"""Bước re-rank. Hiện là điểm kiểu cross-encoder dựa trên trùng từ (tạm, chạy mọi máy);
thay bằng BGE-reranker-v2-m3 bằng cách thêm method mới, không đổi pipeline."""

from __future__ import annotations

from typing import List, Sequence

from .corpus import Chunk
from .text import bigrams


def coverage(q: List[str], c: Chunk) -> float:
    qs = set(q)
    return len(qs & set(c.tokens)) / len(qs) if qs else 0.0


def proximity(q: List[str], c: Chunk) -> float:
    qs = set(q)
    pos = [k for k, t in enumerate(c.tokens) if t in qs]
    if len(pos) < 2:
        return 0.0
    return 1.0 / min(pos[k + 1] - pos[k] for k in range(len(pos) - 1))


def heuristic_score(q: List[str], c: Chunk, first_stage_norm: float) -> float:
    qb = set(bigrams(q))
    big = len(qb & set(bigrams(c.tokens))) / len(qb) if qb else 0.0
    quote_hit = len(set(q) & set(c.quote_tokens)) / len(set(q)) if q else 0.0
    return 0.25 * first_stage_norm + 0.3 * coverage(q, c) + 0.25 * quote_hit + 0.1 * big + 0.1 * proximity(q, c)


def rerank(method: str, q: List[str], chunks: Sequence[Chunk], first_stage: Sequence[float]) -> List[float]:
    if method != "heuristic":
        raise ValueError(f"rerank method chưa hỗ trợ: {method}")
    top = max(first_stage) if first_stage and max(first_stage) > 0 else 1.0
    return [heuristic_score(q, c, s / top) for c, s in zip(chunks, first_stage)]
