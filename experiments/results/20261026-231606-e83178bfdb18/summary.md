# Kết quả A/B truy hồi · 20261026-231606-e83178bfdb18

> **DỮ LIỆU MẪU — không dùng cho luận văn** — 10 câu mẫu trên kho e83178bfdb18.

## Cặp chính (RQ1): A = hybrid, B = hybrid_rerank (= app)

| Điều kiện | MRR@10 | nDCG@5 | Recall@5 | Recall@20 | Từ chối đúng | Từ chối nhầm | p50 (ms) | p95 (ms) |
|---|---|---|---|---|---|---|---|---|
| A · hybrid | 1.000 | 0.900 | 0.906 | 1.000 | 0.500 | 0.000 | 13.6 | 16.9 |
| B · hybrid_rerank | 0.938 | 0.848 | 0.906 | 1.000 | 0.500 | 0.000 | 13.8 | 17.4 |

Chênh lệch B − A, bootstrap ghép cặp 95% (10.000 lần):

- mrr@10: -0.062 [-0.188, +0.000]
- ndcg@5: -0.052 [-0.144, +0.000]
- recall@5: +0.000 [+0.000, +0.000]
- độ trễ p50: +0.2 ms; p95: +0.5 ms
- Recall@20 trùng từng câu (cùng 20 ứng viên): có

## Tham chiếu phụ (không so sánh thống kê, không dùng trả lời RQ1)

| Điều kiện | MRR@10 | nDCG@5 | Recall@5 | Recall@20 | Từ chối đúng | Từ chối nhầm | p50 (ms) | p95 (ms) |
|---|---|---|---|---|---|---|---|---|
| dense | 1.000 | 0.935 | 0.969 | 1.000 | 0.500 | 0.000 | 13.4 | 14.9 |
