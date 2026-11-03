"""Nhánh dense: BGE-M3 (vector CLS đã chuẩn hoá) + chỉ mục inner product.

VectorIndex hiện tìm chính xác bằng numpy, cho cùng kết quả với FAISS IndexFlatIP (SDD chọn FAISS);
khi faiss-cpu có bản cho Python 3.15 thì chỉ cần thay lớp này.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import List, Optional, Sequence

import numpy as np

# transformers 5.x nạp trọng số bằng thread pool; trên Python 3.15 + torch 2.14 việc này gây segfault.
# Nạp tuần tự (chậm hơn ~1 s với BGE-M3) để chạy ổn định.
os.environ.setdefault("HF_DEACTIVATE_ASYNC_LOAD", "1")
# Windows không bật symlink: bộ đệm HF vẫn chạy (chép file thay vì liên kết), tắt cảnh báo lặp lại.
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")

log = logging.getLogger("rag.dense")


class DenseEncoder:
    """Mã hoá câu bằng BGE-M3 qua transformers: dense = vector token [CLS], chuẩn hoá L2."""

    def __init__(self, model: str, device: str = "auto", fp16: bool = True, max_length: int = 512, batch_size: int = 8, cache_dir: Optional[Path] = None):
        import torch
        from transformers import AutoModel, AutoTokenizer

        self.torch = torch
        self.device = ("cuda" if torch.cuda.is_available() else "cpu") if device == "auto" else device
        self.max_length, self.batch_size, self.model_name = max_length, batch_size, model
        cache = str(cache_dir) if cache_dir else None
        self.tokenizer = AutoTokenizer.from_pretrained(model, cache_dir=cache)
        dtype = torch.float16 if fp16 and self.device == "cuda" else torch.float32
        self.model = AutoModel.from_pretrained(model, cache_dir=cache, dtype=dtype).to(self.device).eval()
        log.info("dense encoder %s on %s (%s)", model, self.device, dtype)

    def encode(self, texts: Sequence[str]) -> np.ndarray:
        out: List[np.ndarray] = []
        with self.torch.inference_mode():
            for s in range(0, len(texts), self.batch_size):
                batch = self.tokenizer(list(texts[s : s + self.batch_size]), padding=True, truncation=True, max_length=self.max_length, return_tensors="pt").to(self.device)
                cls = self.model(**batch).last_hidden_state[:, 0]
                cls = self.torch.nn.functional.normalize(cls.float(), dim=-1)
                out.append(cls.cpu().numpy())
        return np.concatenate(out, axis=0) if out else np.zeros((0, 1), dtype=np.float32)


class VectorIndex:
    """Chỉ mục inner product trên vector đã chuẩn hoá (tương đương cosine)."""

    def __init__(self, vectors: np.ndarray):
        self.vectors = vectors.astype(np.float32)

    def scores(self, query: np.ndarray, ids: Sequence[int]) -> np.ndarray:
        # Chỉ chấm các đoạn đã qua lọc người dùng + môn (lọc trước khi xếp hạng, RAG-01).
        return self.vectors[list(ids)] @ query.astype(np.float32)


def load_or_encode(encoder: DenseEncoder, texts: Sequence[str], cache_file: Path) -> np.ndarray:
    """Đệm embedding theo mã băm kho + tên mô hình để chạy lại không phải mã hoá lại (NFR-10)."""
    if cache_file.exists():
        vecs = np.load(cache_file)
        if vecs.shape[0] == len(texts):
            return vecs
    vecs = encoder.encode(texts)
    cache_file.parent.mkdir(parents=True, exist_ok=True)
    np.save(cache_file, vecs)
    return vecs
