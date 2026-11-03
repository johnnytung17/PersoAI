"""PersoAI — dịch vụ AI (FastAPI): /qa gọi lõi rag/ bằng cấu hình prod.

App chỉ chạy một bản: config/prod.yaml (hybrid + re-rank). So sánh A/B chạy riêng bằng experiments/run_ab.py
trên cùng lõi rag/. Đặt PERSOAI_CONFIG để trỏ sang file cấu hình khác khi cần.

Chạy: python -m uvicorn main:app --port 5000
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Dict, Optional

from fastapi import FastAPI
from pydantic import BaseModel, Field

from rag import PROD_CONFIG, RagPipeline, load_config

logging.basicConfig(level=logging.INFO)
CONFIG_PATH = Path(os.environ.get("PERSOAI_CONFIG", PROD_CONFIG))
state: Dict[str, RagPipeline] = {}


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Nạp mô hình và mã hoá kho một lần khi khởi động; lỗi thì dừng hẳn thay vì chạy âm thầm cấu hình khác.
    state["rag"] = RagPipeline(load_config(CONFIG_PATH))
    yield
    state.clear()


app = FastAPI(title="PersoAI ai-service", version="3.0.0", lifespan=lifespan)


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=500)
    owner: str = "u-tung"
    course: str = "csdl"
    task_id: Optional[str] = None


@app.get("/health")
def health() -> Dict:
    rag = state["rag"]
    return {
        "status": "ok",
        "service": "ai-service",
        "config": rag.cfg.name,
        "chunks": len(rag.chunks),
        "dense": rag.encoder.device if rag.encoder else None,
    }


# async def: chạy trên luồng chính của uvicorn. Gọi BGE-M3 từ luồng phụ (threadpool của FastAPI khi dùng def)
# làm torch 2.14 trên Python 3.15 bị segfault; mỗi câu chỉ chiếm luồng ~20–90 ms nên chấp nhận được.
@app.post("/qa")
async def qa(req: AskRequest) -> Dict:
    out = state["rag"].answer(req.question, req.owner, req.course)
    out["taskId"] = req.task_id
    return out
