"""Nạp kho đoạn (chunk) từ data/corpus/*.jsonl — dùng chung cho app và thí nghiệm A/B."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import List

from .text import content_tokens


@dataclass
class Chunk:
    id: str
    owner: str
    course: str
    kind: str  # course | own_work (bài làm riêng không phải nguồn tin cậy, RAG-05)
    doc: str
    page: str
    section: str
    before: str
    quote: str
    after: str
    text: str = ""
    tokens: List[str] = field(default_factory=list)
    quote_tokens: List[str] = field(default_factory=list)


def load_corpus(path: Path) -> List[Chunk]:
    chunks: List[Chunk] = []
    with path.open(encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            c = Chunk(**json.loads(line))
            c.text = " ".join(x for x in (c.before, c.quote, c.after) if x)
            c.tokens = content_tokens(c.text)
            c.quote_tokens = content_tokens(c.quote)
            chunks.append(c)
    return chunks


def corpus_hash(chunks: List[Chunk]) -> str:
    """Mã băm nội dung kho, dùng cho bộ đệm embedding và ghi vào run_id (NFR-09, NFR-10)."""
    h = hashlib.sha256()
    for c in chunks:
        h.update(f"{c.id}\x00{c.text}\n".encode("utf-8"))
    return h.hexdigest()[:12]
