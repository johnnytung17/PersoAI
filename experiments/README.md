# experiments/ — A/B truy hồi (ngoài app)

Chỉ để so sánh và trình bày cho giảng viên, hội đồng. App chỉ chạy một cấu hình: `config/prod.yaml`.

| Thư mục / file | Nội dung |
|---|---|
| `configs/` | Cặp chính: `hybrid` = A (BM25 + BGE-M3, RRF), `hybrid_rerank` = B (= prod). Tham chiếu phụ: `dense` (chỉ BGE-M3) |
| `golden/questions.jsonl` | Câu hỏi + nhãn `qrels` 0/1/2 theo id đoạn trong `data/corpus/`; `answerable: false` là câu không có bằng chứng |
| `run_ab.py` | Chạy A, B và tham chiếu trên cùng lõi `ai-service/rag/`, ghi `results/<run_id>/` |
| `results/` | `metrics.json`, `per_question.csv`, `summary.md` cho từng lần chạy |
| `requirements.txt` | Gói riêng cho A/B (kế thừa gói của ai-service) |

Chạy từ thư mục gốc:

```powershell
ai-service\.venv\Scripts\python experiments\run_ab.py
```

Thiết kế (Đề cương v4, SDD v0.4 Mục 10):

- **Cặp chính (RQ1):** B − A cho MRR@10, nDCG@5, Recall@5 kèm bootstrap ghép cặp 95% (10.000 lần, seed 13), cùng chênh lệch độ trễ p50/p95.
- **Tham chiếu phụ:** `dense` chỉ in chỉ số ở mục riêng, không so sánh thống kê và không dùng để trả lời RQ1. Đổi danh sách bằng `--reference`, ví dụ `--reference` (để trống) để bỏ hẳn.
- **Chặn chạy sai:** dừng nếu `configs/hybrid_rerank.yaml` khác `config/prod.yaml`, hoặc nếu A và B khác nhau ở chỗ nào ngoài bước re-rank.
- **Kiểm tra:** Recall@20 của A và B phải trùng từng câu vì re-rank chỉ sắp lại cùng 20 ứng viên; `summary.md` báo nếu lệch.

**Lưu ý:** `golden/questions.jsonl` hiện là 10 câu mẫu (`split: "sample"`) trên 11 đoạn mẫu, chỉ để chạy thử từ đầu đến cuối. Kết quả trên bộ này ghi rõ "DỮ LIỆU MẪU — không dùng cho luận văn". Bộ thật (20 dev + 40 test, qrels gán tay) thay vào cùng định dạng khi có tài liệu môn.
