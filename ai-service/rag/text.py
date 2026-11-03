"""Tiền xử lý văn bản tiếng Việt cho BM25 và các phép đo trùng từ (bỏ dấu, tách từ, bỏ từ dừng)."""

from __future__ import annotations

import re
import unicodedata
from typing import List, Tuple

STOPWORDS = {
    "la", "gi", "nao", "nhung", "khi", "nen", "gom", "cua", "va", "cac", "co", "duoc", "dung",
    "trong", "mot", "cho", "de", "thi", "voi", "the", "nay", "do", "ve", "bao", "nhieu", "thay",
    "sao", "tai", "vi", "hay", "hoac", "o", "neu", "ra", "nhu", "lam", "toi", "ban", "khac",
    "minh", "ai", "dau", "khong", "a", "an", "is", "what", "of", "giua", "nhau", "can",
}


def strip_accents(text: str) -> str:
    text = text.lower().replace("đ", "d")
    norm = unicodedata.normalize("NFD", text)
    return "".join(ch for ch in norm if unicodedata.category(ch) != "Mn")


def content_tokens(text: str) -> List[str]:
    return [t for t in re.findall(r"[a-z0-9]+", strip_accents(text)) if t not in STOPWORDS]


def bigrams(tokens: List[str]) -> List[Tuple[str, str]]:
    return list(zip(tokens, tokens[1:]))
