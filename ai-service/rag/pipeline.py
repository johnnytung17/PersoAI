"""Đường truy hồi duy nhất cho app (/qa) và thí nghiệm A/B (SDD: "một đường mã truy hồi").

Các bước:
  1. Lọc theo chủ sở hữu + môn trước khi xếp hạng (RAG-01).
  2. Vòng 1 lấy Top-N theo mode: bm25 | dense (BGE-M3) | hybrid (gộp hai nhánh bằng RRF).
  3. Re-rank Top-N → Top-K khi bật (RAG-02).
  4. Tài liệu môn đứng trước bài làm riêng (RAG-05); thiếu bằng chứng thì từ chối (RAG-04).
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

from .bm25 import BM25Index
from .config import RagConfig
from .corpus import Chunk, corpus_hash, load_corpus
from .dense import DenseEncoder, VectorIndex, load_or_encode
from .rerank import coverage, rerank
from .text import content_tokens

REFUSAL = "Không đủ bằng chứng trong tài liệu để trả lời câu này. Bạn thử hỏi cụ thể hơn về nội dung môn học."

Ranked = List[Tuple[int, float]]  # (chỉ số đoạn, điểm)


@dataclass
class Retrieval:
    tokens: List[str]
    candidates: Ranked  # Top-N vòng 1
    ranked: Ranked  # toàn bộ Top-N theo thứ tự cuối (sau re-rank nếu bật) — dùng cho MRR@10, Recall@20
    final: Ranked  # K đầu của ranked, đưa vào ngữ cảnh trả lời
    ms: Dict[str, float]


def make_encoder(cfg: RagConfig) -> DenseEncoder:
    d = cfg.dense
    return DenseEncoder(d.model, d.device, d.fp16, d.max_length, d.batch_size, cfg.path(d.cache_dir))


class RagPipeline:
    def __init__(self, cfg: RagConfig, chunks: Optional[List[Chunk]] = None, encoder: Optional[DenseEncoder] = None):
        self.cfg = cfg
        self.chunks = chunks if chunks is not None else load_corpus(cfg.path(cfg.corpus))
        self.corpus_hash = corpus_hash(self.chunks)
        self.bm25 = BM25Index(self.chunks)
        self.encoder: Optional[DenseEncoder] = None
        self.index: Optional[VectorIndex] = None
        if cfg.retrieval.mode in ("dense", "hybrid"):
            self.encoder = encoder or make_encoder(cfg)
            slug = cfg.dense.model.replace("/", "__")
            cache = cfg.path("data/corpus/.cache") / f"{slug}_{self.corpus_hash}.npy"
            self.index = VectorIndex(load_or_encode(self.encoder, [c.text for c in self.chunks], cache))

    # ------------------------------------------------------------ vòng 1
    def _bm25(self, q: List[str], ids: List[int]) -> Ranked:
        s = [(i, self.bm25.score(q, i)) for i in ids]
        return sorted((x for x in s if x[1] > 0), key=lambda x: (-x[1], self.chunks[x[0]].id))

    def _dense(self, question: str, ids: List[int]) -> Ranked:
        assert self.encoder is not None and self.index is not None
        qv = self.encoder.encode([question])[0]
        s = self.index.scores(qv, ids)
        return sorted(zip(ids, (float(x) for x in s)), key=lambda x: (-x[1], self.chunks[x[0]].id))

    def _first_stage(self, question: str, q: List[str], ids: List[int]) -> Ranked:
        r = self.cfg.retrieval
        if r.mode == "bm25":
            ranked = self._bm25(q, ids)
        elif r.mode == "dense":
            ranked = self._dense(question, ids)
        elif r.mode == "hybrid":
            fused: Dict[int, float] = {}
            for lst in (self._bm25(q, ids)[: r.top_n], self._dense(question, ids)[: r.top_n]):
                for rank, (i, _) in enumerate(lst, start=1):
                    fused[i] = fused.get(i, 0.0) + 1.0 / (r.rrf_k + rank)
            ranked = sorted(fused.items(), key=lambda x: (-x[1], self.chunks[x[0]].id))
        else:
            raise ValueError(f"retrieval.mode không hợp lệ: {r.mode}")
        return ranked[: r.top_n]

    # ------------------------------------------------------------ API
    def retrieve(self, question: str, owner: str, course: str) -> Retrieval:
        t0 = time.perf_counter()
        q = content_tokens(question)
        ids = [i for i, c in enumerate(self.chunks) if c.owner == owner and c.course == course]
        candidates = self._first_stage(question, q, ids) if ids else []
        t1 = time.perf_counter()
        if self.cfg.rerank.enabled and candidates:
            scores = rerank(self.cfg.rerank.method, q, [self.chunks[i] for i, _ in candidates], [s for _, s in candidates])
            ranked = sorted(zip((i for i, _ in candidates), scores), key=lambda x: (-x[1], self.chunks[x[0]].id))
        else:
            ranked = list(candidates)
        t2 = time.perf_counter()
        return Retrieval(q, candidates, ranked, ranked[: self.cfg.answer.top_k], {"first_stage": (t1 - t0) * 1000, "rerank": (t2 - t1) * 1000})

    def usable(self, r: Retrieval) -> Ranked:
        """Đoạn đủ bằng chứng để trả lời: tài liệu môn (RAG-05) và phủ ≥ ngưỡng từ khoá câu hỏi."""
        evidence = sorted(r.final, key=lambda x: self.chunks[x[0]].kind != "course")
        return [x for x in evidence if self.chunks[x[0]].kind == "course" and coverage(r.tokens, self.chunks[x[0]]) >= self.cfg.answer.min_coverage]

    def public(self, item: Tuple[int, float]) -> Dict:
        c = self.chunks[item[0]]
        return {"id": c.id, "doc": c.doc, "page": c.page, "section": c.section, "score": round(item[1], 4)}

    def answer(self, question: str, owner: str, course: str) -> Dict:
        started = time.perf_counter()
        r = self.retrieve(question, owner, course)
        used = self.usable(r)[: self.cfg.answer.max_sources]
        if used:
            answer = "; ".join(f"{self.chunks[i].quote.rstrip('.')} [S{k + 1}]" for k, (i, _) in enumerate(used)) + "."
            sources = []
            for k, (i, s) in enumerate(used):
                c = self.chunks[i]
                sources.append({"tag": f"S{k + 1}", "id": c.id, "doc": c.doc, "page": c.page, "section": c.section,
                                "quote": c.quote, "before": c.before, "after": c.after, "score": round(s, 4)})
            refusal = False
        else:
            answer, sources, refusal = REFUSAL, [], True
        return {
            "answer": answer,
            "refusal": refusal,
            "sources": sources,
            "rankingBefore": [self.public(x) for x in r.candidates],
            "rankingAfter": [self.public(x) for x in r.final],
            "config": self.cfg.name,
            "latencyMs": round((time.perf_counter() - started) * 1000, 1),
        }
