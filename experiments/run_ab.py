"""Thí nghiệm A/B truy hồi của PersoAI — chạy ngoài app, chỉ để so sánh và trình bày (RQ1, một phần RQ2).

Thiết kế (Đề cương v4, SDD v0.4 Mục 10):
  - Cặp chính: A = hybrid (BM25 + BGE-M3, RRF, lấy 5 đầu), B = hybrid_rerank (re-rank cùng 20 ứng viên).
    B phải trùng hành vi với config/prod.yaml (kiểm tra trước khi chạy).
  - Tham chiếu phụ: dense (chỉ BGE-M3) — chỉ in chỉ số, không so sánh thống kê, không dùng trả lời RQ1.

Dùng đúng lõi ai-service/rag/ mà app dùng. Mỗi biến thể là một file experiments/configs/*.yaml.
Đo trên golden/questions.jsonl:
  - Xếp hạng (câu có bằng chứng): MRR@10, nDCG@5, Recall@5, Recall@20 với qrels 0/1/2.
  - Từ chối: tỉ lệ từ chối đúng ở câu không có bằng chứng, từ chối nhầm ở câu có bằng chứng.
  - Độ trễ truy hồi: bỏ 3 lần khởi động, đo 3 lần mỗi câu, báo p50/p95.
  - Bootstrap ghép cặp 95% (10.000 lần) cho chênh lệch B − A của MRR@10, nDCG@5, Recall@5.
  - Kiểm tra: Recall@20 của A và B phải bằng nhau từng câu (cùng 20 ứng viên).
Kết quả ghi vào results/<run_id>/ (metrics.json, per_question.csv, summary.md).

Chạy (từ thư mục gốc PersoAI):  ai-service\\.venv\\Scripts\\python experiments\\run_ab.py
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import random
import sys
import time
from datetime import datetime
from pathlib import Path
from statistics import median
from typing import Dict, List

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "ai-service"))

from rag import PROD_CONFIG, RagPipeline, load_config, load_corpus, make_encoder  # noqa: E402

EXP = ROOT / "experiments"
COND_A = "hybrid"
COND_B = "hybrid_rerank"  # = config/prod.yaml
REFERENCE = ["dense"]
MAIN_METRICS = ("mrr@10", "ndcg@5", "recall@5")


# ---------------------------------------------------------------- chỉ số
def dcg(gains: List[int]) -> float:
    return sum((2**g - 1) / math.log2(k + 2) for k, g in enumerate(gains))


def metrics_for(ranked_ids: List[str], qrels: Dict[str, int]) -> Dict[str, float]:
    rel = {d for d, g in qrels.items() if g > 0}
    mrr = next((1.0 / (k + 1) for k, d in enumerate(ranked_ids[:10]) if d in rel), 0.0)
    ideal = dcg(sorted(qrels.values(), reverse=True)[:5])
    ndcg = dcg([qrels.get(d, 0) for d in ranked_ids[:5]]) / ideal if ideal else 0.0
    rec = lambda k: len(rel & set(ranked_ids[:k])) / len(rel) if rel else 0.0  # noqa: E731
    return {"mrr@10": mrr, "ndcg@5": ndcg, "recall@5": rec(5), "recall@20": rec(20)}


def percentile(xs: List[float], p: float) -> float:
    s = sorted(xs)
    if not s:
        return 0.0
    k = (len(s) - 1) * p
    lo, hi = math.floor(k), math.ceil(k)
    return s[lo] + (s[hi] - s[lo]) * (k - lo)


def paired_bootstrap(a: List[float], b: List[float], n: int = 10_000, seed: int = 13) -> Dict[str, float]:
    """Chênh lệch trung bình b − a và khoảng tin cậy 95% bằng lấy mẫu lại ghép cặp theo câu hỏi."""
    rng = random.Random(seed)
    m = len(a)
    diffs = [y - x for x, y in zip(a, b)]
    boots = sorted(sum(diffs[rng.randrange(m)] for _ in range(m)) / m for _ in range(n))
    return {"delta": sum(diffs) / m if m else 0.0, "ci95_low": boots[int(0.025 * n)], "ci95_high": boots[int(0.975 * n) - 1]}


# ---------------------------------------------------------------- chạy
def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--golden", default=str(EXP / "golden" / "questions.jsonl"))
    ap.add_argument("--reference", nargs="*", default=REFERENCE, help="biến thể tham chiếu phụ (chỉ in chỉ số)")
    ap.add_argument("--reps", type=int, default=3)
    args = ap.parse_args()

    names = [COND_A, COND_B] + [n for n in args.reference if n not in (COND_A, COND_B)]
    cfgs = {name: load_config(EXP / "configs" / f"{name}.yaml") for name in names}
    prod = load_config(PROD_CONFIG)
    if cfgs[COND_B].behaviour() != prod.behaviour():
        sys.exit(f"Lỗi: experiments/configs/{COND_B}.yaml khác config/prod.yaml — sửa cho trùng trước khi chạy.")
    same = lambda c: {k: v for k, v in c.behaviour().items() if k != "rerank"}  # noqa: E731
    if same(cfgs[COND_A]) != same(cfgs[COND_B]):
        sys.exit(f"Lỗi: {COND_A} và {COND_B} chỉ được khác nhau ở bước re-rank.")

    questions = [json.loads(l) for l in Path(args.golden).read_text(encoding="utf-8").splitlines() if l.strip()]
    samples = sorted({q.get("split", "") for q in questions})
    first = next(iter(cfgs.values()))
    chunks = load_corpus(first.path(first.corpus))

    # Dùng chung một bộ mã hoá BGE-M3 cho mọi biến thể dense/hybrid (cùng mô hình, chỉ nạp một lần).
    encoder = make_encoder(first) if any(c.retrieval.mode in ("dense", "hybrid") for c in cfgs.values()) else None
    pipes = {name: RagPipeline(cfg, chunks, encoder) for name, cfg in cfgs.items()}

    rows, per_variant = [], {}
    for name, pipe in pipes.items():
        for q in questions[:3]:  # khởi động, không tính
            pipe.retrieve(q["question"], q["owner"], q["course"])
        scores: Dict[str, List[float]] = {k: [] for k in ("mrr@10", "ndcg@5", "recall@5", "recall@20")}
        lat, correct_refusal, false_refusal = [], [], []
        for q in questions:
            times = []
            for _ in range(args.reps):
                t = time.perf_counter()
                r = pipe.retrieve(q["question"], q["owner"], q["course"])
                times.append((time.perf_counter() - t) * 1000)
            lat.extend(times)
            ranked_ids = [chunks[i].id for i, _ in r.ranked]
            refused = not pipe.usable(r)
            role = "A" if name == COND_A else "B" if name == COND_B else "tham chiếu"
            row = {"variant": name, "role": role, "qid": q["id"], "answerable": q["answerable"], "refused": refused,
                   "top5": " ".join(ranked_ids[:5]), "latency_ms": round(median(times), 2)}
            if q["answerable"]:
                m = metrics_for(ranked_ids, q["qrels"])
                for k, v in m.items():
                    scores[k].append(v)
                row.update({k: round(v, 4) for k, v in m.items()})
                false_refusal.append(1.0 if refused else 0.0)
            else:
                correct_refusal.append(1.0 if refused else 0.0)
            rows.append(row)
        per_variant[name] = {
            "config_fingerprint": pipe.cfg.fingerprint(),
            **{k: sum(v) / len(v) if v else 0.0 for k, v in scores.items()},
            "refusal_correct_rate": sum(correct_refusal) / len(correct_refusal) if correct_refusal else None,
            "false_refusal_rate": sum(false_refusal) / len(false_refusal) if false_refusal else None,
            "latency_p50_ms": percentile(lat, 0.5),
            "latency_p95_ms": percentile(lat, 0.95),
            "_per_q": scores,
        }

    # Cặp chính B − A; dense chỉ là tham chiếu, không so sánh thống kê.
    a, b = per_variant[COND_A], per_variant[COND_B]
    main_cmp = {k: paired_bootstrap(a["_per_q"][k], b["_per_q"][k]) for k in MAIN_METRICS}
    main_cmp["latency_p50_ms"] = {"delta": b["latency_p50_ms"] - a["latency_p50_ms"]}
    main_cmp["latency_p95_ms"] = {"delta": b["latency_p95_ms"] - a["latency_p95_ms"]}
    # Re-rank chỉ sắp lại cùng 20 ứng viên, nên Recall@20 phải trùng từng câu; lệch là lỗi cấu hình.
    recall20_same = all(abs(x - y) < 1e-9 for x, y in zip(a["_per_q"]["recall@20"], b["_per_q"]["recall@20"]))
    for v in per_variant.values():
        v.pop("_per_q")

    # ---------------------------------------------------------------- ghi kết quả
    run_id = datetime.now().strftime("%Y%m%d-%H%M%S") + "-" + pipes[next(iter(pipes))].corpus_hash
    out = EXP / "results" / run_id
    out.mkdir(parents=True, exist_ok=True)
    meta = {
        "run_id": run_id,
        "golden": str(Path(args.golden).relative_to(ROOT)),
        "golden_split": samples,
        "n_questions": len(questions),
        "n_answerable": sum(q["answerable"] for q in questions),
        "corpus_hash": pipes[next(iter(pipes))].corpus_hash,
        "dense_model": first.dense.model,
        "device": encoder.device if encoder else None,
        "note": "DỮ LIỆU MẪU — không dùng cho luận văn" if samples == ["sample"] else "",
    }
    report = {
        "meta": meta,
        "main": {"A": COND_A, "B": COND_B, "B_minus_A": main_cmp, "recall@20_identical": recall20_same},
        "reference": [n for n in per_variant if n not in (COND_A, COND_B)],
        "variants": per_variant,
    }
    (out / "metrics.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    with (out / "per_question.csv").open("w", newline="", encoding="utf-8") as f:
        keys = ["variant", "role", "qid", "answerable", "refused", "mrr@10", "ndcg@5", "recall@5", "recall@20", "top5", "latency_ms"]
        w = csv.DictWriter(f, fieldnames=keys)
        w.writeheader()
        w.writerows(rows)

    fmt = lambda x: "—" if x is None else f"{x:.3f}"  # noqa: E731
    lines = [f"# Kết quả A/B truy hồi · {run_id}", ""]
    if meta["note"]:
        lines += [f"> **{meta['note']}** — {meta['n_questions']} câu mẫu trên kho {meta['corpus_hash']}.", ""]
    head = ["| Điều kiện | MRR@10 | nDCG@5 | Recall@5 | Recall@20 | Từ chối đúng | Từ chối nhầm | p50 (ms) | p95 (ms) |", "|---|---|---|---|---|---|---|---|---|"]
    row = lambda label, v: (f"| {label} | {fmt(v['mrr@10'])} | {fmt(v['ndcg@5'])} | {fmt(v['recall@5'])} | {fmt(v['recall@20'])} | "  # noqa: E731
                            f"{fmt(v['refusal_correct_rate'])} | {fmt(v['false_refusal_rate'])} | {v['latency_p50_ms']:.1f} | {v['latency_p95_ms']:.1f} |")
    lines += [f"## Cặp chính (RQ1): A = {COND_A}, B = {COND_B} (= app)", ""] + head
    lines += [row(f"A · {COND_A}", a), row(f"B · {COND_B}", b), ""]
    lines += ["Chênh lệch B − A, bootstrap ghép cặp 95% (10.000 lần):", ""]
    lines += [f"- {k}: {c['delta']:+.3f} [{c['ci95_low']:+.3f}, {c['ci95_high']:+.3f}]" for k, c in main_cmp.items() if "ci95_low" in c]
    lines += [f"- độ trễ p50: {main_cmp['latency_p50_ms']['delta']:+.1f} ms; p95: {main_cmp['latency_p95_ms']['delta']:+.1f} ms",
              f"- Recall@20 trùng từng câu (cùng 20 ứng viên): {'có' if recall20_same else 'KHÔNG — kiểm tra cấu hình'}"]
    if report["reference"]:
        lines += ["", "## Tham chiếu phụ (không so sánh thống kê, không dùng trả lời RQ1)", ""] + head
        lines += [row(n, per_variant[n]) for n in report["reference"]]
    (out / "summary.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    print(f"\nĐã ghi: {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
