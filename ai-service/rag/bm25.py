"""BM25 thuần Python trên token đã bỏ dấu — nhánh từ khoá của hybrid."""

from __future__ import annotations

import math
from collections import Counter
from typing import List, Sequence

from .corpus import Chunk


class BM25Index:
    def __init__(self, chunks: Sequence[Chunk], k1: float = 1.5, b: float = 0.75):
        self.k1, self.b = k1, b
        self.tfs = [Counter(c.tokens) for c in chunks]
        self.lens = [len(c.tokens) for c in chunks]
        self.avg = sum(self.lens) / max(len(self.lens), 1)
        self.df: Counter = Counter()
        for c in chunks:
            self.df.update(set(c.tokens))
        self.n = len(chunks)

    def score(self, q: List[str], i: int) -> float:
        tf, dl, s = self.tfs[i], self.lens[i], 0.0
        for term in set(q):
            if term not in tf:
                continue
            idf = math.log(1 + (self.n - self.df[term] + 0.5) / (self.df[term] + 0.5))
            s += idf * tf[term] * (self.k1 + 1) / (tf[term] + self.k1 * (1 - self.b + self.b * dl / self.avg))
        return s
