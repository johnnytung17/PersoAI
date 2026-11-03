# PersoAI

Personalized study assistant. Answers questions from the learner's own documents using RAG: hybrid retrieval (BM25 + BGE-M3) with re-ranking, cited sources, and refusal when evidence is missing.

| Part | Stack | Port |
| --- | --- | --- |
| `frontend/` | Next.js 14 | 3000 |
| `backend/` | NestJS 10 | 4000 |
| `ai-service/` | Python, FastAPI | 5000 |
| PostgreSQL 16 | `docker-compose.yml` | 5432 |

## Setup

```powershell
docker compose up -d
cd ai-service; python -m venv .venv; .\.venv\Scripts\python -m pip install -r requirements.txt; cd ..
cd backend; npm install; cd ..
cd frontend; npm install; cd ..
```

BGE-M3 (about 2.3 GB) downloads into `data/models/` on first run.

## Run

```powershell
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

Open http://localhost:3000.
