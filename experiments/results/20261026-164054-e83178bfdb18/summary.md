# Kết quả A/B truy hồi · 20261026-164054-e83178bfdb18

> **DỮ LIỆU MẪU — không dùng cho luận văn** — 10 câu mẫu trên kho e83178bfdb18.

| Biến thể | MRR@10 | nDCG@5 | Recall@5 | Recall@20 | Từ chối đúng | Từ chối nhầm | p50 (ms) | p95 (ms) |
|---|---|---|---|---|---|---|---|---|
| dense | 1.000 | 0.935 | 0.969 | 1.000 | 0.500 | 0.000 | 13.6 | 17.7 |
| hybrid | 1.000 | 0.900 | 0.906 | 1.000 | 0.500 | 0.000 | 12.8 | 15.0 |
| hybrid_rerank (prod) | 0.938 | 0.848 | 0.906 | 1.000 | 0.500 | 0.000 | 12.7 | 13.5 |

Chênh lệch (prod − biến thể), bootstrap ghép cặp 95%:

- hybrid_rerank vs dense: mrr@10: -0.062 [-0.188, +0.000]; ndcg@5: -0.086 [-0.220, +0.009]
- hybrid_rerank vs hybrid: mrr@10: -0.062 [-0.188, +0.000]; ndcg@5: -0.052 [-0.144, +0.000]
