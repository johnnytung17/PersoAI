"""Cấu hình truy hồi đọc từ YAML: config/prod.yaml cho app, experiments/configs/*.yaml cho A/B."""

from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass, field
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]  # thư mục gốc PersoAI/
PROD_CONFIG = ROOT / "config" / "prod.yaml"


@dataclass
class RetrievalCfg:
    mode: str = "hybrid"  # dense | bm25 | hybrid
    top_n: int = 20  # số ứng viên trước re-rank
    rrf_k: int = 60  # hằng số Reciprocal Rank Fusion khi mode = hybrid


@dataclass
class DenseCfg:
    model: str = "BAAI/bge-m3"
    device: str = "auto"  # auto | cuda | cpu
    fp16: bool = True
    max_length: int = 512
    batch_size: int = 8
    cache_dir: str = "data/models"


@dataclass
class RerankCfg:
    enabled: bool = True
    method: str = "heuristic"  # heuristic (tạm) → bge-reranker-v2-m3


@dataclass
class AnswerCfg:
    top_k: int = 5  # số đoạn đưa vào ngữ cảnh trả lời
    min_coverage: float = 0.5  # ngưỡng bằng chứng; dưới ngưỡng thì từ chối (RAG-04)
    max_sources: int = 2


@dataclass
class RagConfig:
    name: str
    corpus: str
    retrieval: RetrievalCfg = field(default_factory=RetrievalCfg)
    dense: DenseCfg = field(default_factory=DenseCfg)
    rerank: RerankCfg = field(default_factory=RerankCfg)
    answer: AnswerCfg = field(default_factory=AnswerCfg)

    def path(self, rel: str) -> Path:
        p = Path(rel)
        return p if p.is_absolute() else ROOT / p

    def behaviour(self) -> dict:
        """Phần quyết định kết quả (bỏ tên), để so prod với biến thể A/B."""
        d = asdict(self)
        d.pop("name")
        return d

    def fingerprint(self) -> str:
        return hashlib.sha256(json.dumps(self.behaviour(), sort_keys=True).encode()).hexdigest()[:12]


def load_config(path: Path = PROD_CONFIG) -> RagConfig:
    raw = yaml.safe_load(Path(path).read_text(encoding="utf-8")) or {}
    return RagConfig(
        name=raw["name"],
        corpus=raw["corpus"],
        retrieval=RetrievalCfg(**raw.get("retrieval", {})),
        dense=DenseCfg(**raw.get("dense", {})),
        rerank=RerankCfg(**raw.get("rerank", {})),
        answer=AnswerCfg(**raw.get("answer", {})),
    )
