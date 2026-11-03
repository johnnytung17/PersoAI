-- Dữ liệu mẫu PersoAI (khớp wireframe trong tài liệu thiết kế). Chỉ nạp khi CSDL còn trống.
-- Ngày demo: Thứ Năm 05/11/2026 (Asia/Ho_Chi_Minh).

INSERT INTO app_user (id, email, password_hash, display_name, class_name, consent_at) VALUES
  ('u-tung', 'tung@example.test', '$2b$12$demo.hash.not.a.real.password.hash.only.for.seed', 'Tùng', 'IT250', '2026-10-24T08:00:00+07');

INSERT INTO course (id, code, name, topics) VALUES
  ('csdl', 'CSDL', 'Cơ sở dữ liệu', ARRAY['Khóa', 'SQL cơ bản', 'JOIN', 'GROUP BY', 'Chuẩn hoá']);

INSERT INTO profile_version (id, user_id, version, data, origins, source_text, confirmed_at) VALUES
  (1, 'u-tung', 1,
   '{"budget":"180 phút","busy":"T4 cả ngày; T5 18:00–22:00","goal":"Thi giữa kỳ CSDL","skill":"Cơ bản","best":null}',
   '{"budget":"extracted","busy":"extracted","goal":"extracted","skill":"extracted"}',
   'Mình đi làm cả ngày thứ Tư và tối thứ Năm, mỗi tuần học khoảng 3 tiếng.', '2026-10-24T09:00:00+07'),
  (2, 'u-tung', 2,
   '{"budget":"180 phút","busy":"T4 cả ngày; T5 18:00–22:00","goal":"Thi giữa kỳ CSDL đạt trên 8 điểm","skill":"Cơ bản, hay nhầm JOIN với GROUP BY","best":null}',
   '{"budget":"confirmed","busy":"confirmed","goal":"typed","skill":"confirmed"}',
   'Mình là sinh viên năm 3 ngành CNTT, đi làm thêm từ 18h đến 22h các ngày thứ Năm, cả ngày thứ Tư cũng đi làm. Mỗi tuần mình chỉ dành được khoảng 3 tiếng để học môn Cơ sở dữ liệu. SQL cơ bản thì biết nhưng hay nhầm JOIN với GROUP BY. Mục tiêu là thi giữa kỳ CSDL đạt trên 8 điểm.',
   '2026-11-01T20:00:00+07');

INSERT INTO busy_slot (user_id, weekday, label, all_day, start_at, end_at) VALUES
  ('u-tung', 3, 'Bận: đi làm, không xếp', TRUE, NULL, NULL),
  ('u-tung', 4, 'Làm thêm 18:00–22:00', FALSE, '18:00', '22:00');

INSERT INTO goal (id, user_id, course_id, output, deadline, priority) VALUES
  (1, 'u-tung', 'csdl', 'Thi giữa kỳ CSDL', '2026-11-20', 'high'),
  (2, 'u-tung', 'csdl', 'Hoàn thành bài tập lớn CSDL', '2026-12-05', 'medium');

INSERT INTO document (id, owner_id, course_id, name, kind, pages, status, error, sha256) VALUES
  (1, 'u-tung', 'csdl', 'Slide_CSDL_Chuong4.pdf', 'course', 38, 'indexed', NULL, 'a1f3…demo'),
  (2, 'u-tung', 'csdl', 'GiaoTrinh_CSDL.pdf', 'course', 212, 'indexed', NULL, 'b72c…demo'),
  (3, 'u-tung', 'csdl', 'BaiTap_SQL_Tuan5.docx', 'own_work', NULL, 'indexed', NULL, 'c9d0…demo'),
  (4, 'u-tung', 'csdl', 'DeThi_2025_scan.pdf', 'reference', NULL, 'failed', 'Không tìm thấy chữ (PDF quét). PersoAI chưa hỗ trợ OCR.', 'd4e5…demo');

INSERT INTO chunk (document_id, ordinal, tokens, page, section, text) VALUES
  (1, 12, 61, 'tr.12', 'GROUP BY và HAVING', 'Mệnh đề HAVING dùng để lọc kết quả đã gom nhóm; điều kiện có thể chứa hàm gộp như COUNT, SUM.'),
  (1, 9, 58, 'tr.9', 'LEFT JOIN', 'LEFT JOIN trả về mọi dòng của bảng bên trái, kể cả khi không có dòng khớp ở bảng bên phải.'),
  (2, 53, 70, NULL, 'mục 5.3', 'Thứ tự xử lý: FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY.');

-- Tuần trước (26/10 – 01/11): kế hoạch đã chạy, dùng cho báo cáo tuần.
INSERT INTO plan (id, goal_id, version, profile_version_id, parent_id, status, week_start, budget_minutes, note, created_at) VALUES
  (1, 1, 1, 1, NULL, 'superseded', '2026-10-26', 240, 'Kế hoạch tuần đầu', '2026-10-25T20:00:00+07');

INSERT INTO task (id, plan_id, date, start_time, minutes, title, output, done_criterion, material, status) VALUES
  (9,  1, '2026-10-26', '19:00', 30, 'Khóa chính',   'Ghi chú các loại khoá',          'Phân biệt khoá chính, khoá ngoại', 'Slide_CSDL_Chuong3.pdf', 'done'),
  (10, 1, '2026-10-27', '19:00', 30, 'Lọc WHERE',    '5 truy vấn WHERE',               'Chạy đúng cả 5 câu',               'Slide_CSDL_Chuong4.pdf', 'done'),
  (11, 1, '2026-10-27', '20:00', 45, 'Ôn HAVING',    'Tóm tắt HAVING',                 'Nêu khác biệt với WHERE',          'Slide_CSDL_Chuong4.pdf', 'skipped'),
  (12, 1, '2026-10-29', '14:00', 45, 'JOIN',         '5 truy vấn JOIN',                'Chạy đúng cả 5 câu',               'Slide_CSDL_Chuong4.pdf', 'in_progress'),
  (14, 1, '2026-10-30', '19:00', 40, 'GROUP BY',     '4 truy vấn gom nhóm',            'Giải thích thứ tự xử lý',          'GiaoTrinh_CSDL.pdf',     'done'),
  (15, 1, '2026-10-31', '09:00', 50, 'Bài tập JOIN', 'Lời giải 3 bài LEFT JOIN',       'Khớp đáp án mẫu',                  'BaiTap_SQL_Tuan5.docx',  'done');

INSERT INTO study_log (id, task_id, user_id, date, minutes, status, note) VALUES
  (27, 9,  'u-tung', '2026-10-26', 30, 'done', NULL),
  (28, 10, 'u-tung', '2026-10-27', 35, 'done', NULL),
  (29, 11, 'u-tung', '2026-10-27', 0,  'skipped', 'Hết giờ'),
  (31, 12, 'u-tung', '2026-10-29', 20, 'in_progress', 'chưa hiểu LEFT JOIN'),
  (32, 14, 'u-tung', '2026-11-01', 45, 'done', 'Ghi bù vào Chủ nhật'),
  (33, 15, 'u-tung', '2026-11-01', 50, 'done', NULL);

INSERT INTO report (id, user_id, course_id, period_start, period_end, plan_id, narrative, created_at) VALUES
  (1, 'u-tung', 'csdl', '2026-10-26', '2026-11-01', 1,
   'Bạn hoàn thành 4/6 nhiệm vụ; nhiệm vụ JOIN thứ Năm quá hạn. Thứ Sáu và thứ Bảy không có nhật ký nên chưa đủ dữ liệu để nhận xét hai ngày này.',
   '2026-11-02T08:00:00+07');

INSERT INTO suggestion (id, report_id, title, reason, evidence_ids, diff) VALUES
  (1, 1, 'Chia nhỏ nhiệm vụ JOIN',
   'Nhiệm vụ 45 phút quá hạn; nhật ký ghi 20 phút và ghi chú “chưa hiểu LEFT JOIN”.',
   ARRAY['task #12', 'log #31'], '{"from":"T5: JOIN 45 phút","to":"T5: LEFT JOIN 25 phút + T7: bài tập 20 phút"}'),
  (2, 1, 'Dời GROUP BY khỏi tối Thứ Sáu',
   'Nhiệm vụ GROUP BY tối Thứ Sáu không làm đúng ngày; nhật ký được ghi bù vào Chủ nhật.',
   ARRAY['task #14', 'log #32'], '{"from":"T6 19:00: GROUP BY 30 phút","to":"CN 09:00: GROUP BY 30 phút"}');

-- Tuần này (02/11 – 08/11): v1 đã thay thế, v2 đang áp dụng, v3 bản nháp.
INSERT INTO plan (id, goal_id, version, profile_version_id, parent_id, status, week_start, budget_minutes, note, created_at) VALUES
  (2, 1, 1, 2, NULL, 'superseded', '2026-11-02', 180, 'Bản đầu tiên do AI soạn, hồ sơ phiên bản 2', '2026-11-01T20:30:00+07'),
  (3, 1, 2, 2, 2,    'active',     '2026-11-02', 180, 'Xác nhận sau khi sửa giờ Thứ Ba',          '2026-11-02T07:00:00+07'),
  (4, 1, 3, 2, 3,    'draft',      '2026-11-02', 180, 'Từ gợi ý "Chia nhỏ nhiệm vụ JOIN" (báo cáo 26/10 – 01/11)', '2026-11-05T08:00:00+07');

INSERT INTO task (id, plan_id, date, start_time, minutes, title, output, done_criterion, material, status) VALUES
  (100, 2, '2026-11-02', '20:00', 30, 'Khóa chính',   'Ghi chú các loại khoá', 'Phân biệt khoá chính, khoá ngoại', 'Slide_CSDL_Chuong3.pdf', 'planned'),
  (101, 3, '2026-11-02', '19:00', 30, 'Khóa chính',   'Ghi chú các loại khoá kèm 3 ví dụ', 'Phân biệt được khoá chính, khoá ứng viên, khoá ngoại', 'Slide_CSDL_Chuong3.pdf', 'done'),
  (102, 3, '2026-11-03', '19:00', 30, 'Lọc WHERE',    '5 truy vấn có điều kiện WHERE', 'Chạy đúng cả 5 câu', 'Slide_CSDL_Chuong4.pdf', 'planned'),
  (103, 3, '2026-11-05', '14:00', 45, 'JOIN và GROUP BY qua ví dụ', '5 truy vấn', 'Chạy đúng cả 5 câu', 'Slide_CSDL_Chuong4.pdf', 'in_progress'),
  (104, 3, '2026-11-06', '19:00', 30, 'GROUP BY',     '4 truy vấn gom nhóm có HAVING', 'Giải thích được thứ tự xử lý của từng câu', 'GiaoTrinh_CSDL.pdf', 'planned'),
  (105, 3, '2026-11-07', '09:00', 35, 'Bài tập JOIN', 'Lời giải 3 bài tập LEFT JOIN', 'Kết quả khớp đáp án mẫu', 'BaiTap_SQL_Tuan5.docx', 'planned'),
  (201, 4, '2026-11-02', '19:00', 30, 'Khóa chính',   'Ghi chú các loại khoá kèm 3 ví dụ', 'Phân biệt được khoá chính, khoá ứng viên, khoá ngoại', 'Slide_CSDL_Chuong3.pdf', 'planned'),
  (202, 4, '2026-11-03', '19:00', 30, 'Lọc WHERE',    '5 truy vấn có điều kiện WHERE', 'Chạy đúng cả 5 câu', 'Slide_CSDL_Chuong4.pdf', 'planned'),
  (203, 4, '2026-11-05', '14:00', 45, 'JOIN ví dụ',   '5 truy vấn', 'Chạy đúng cả 5 câu', 'Slide_CSDL_Chuong4.pdf', 'planned'),
  (204, 4, '2026-11-06', '19:00', 30, 'GROUP BY',     '4 truy vấn gom nhóm có HAVING', 'Giải thích được thứ tự xử lý của từng câu', 'GiaoTrinh_CSDL.pdf', 'planned'),
  (205, 4, '2026-11-07', '09:00', 25, 'Bài tập JOIN', 'Lời giải 3 bài tập LEFT JOIN', 'Kết quả khớp đáp án mẫu', 'BaiTap_SQL_Tuan5.docx', 'planned'),
  (206, 4, '2026-11-07', '09:30', 10, 'Ôn HAVING',    'Tóm tắt 3 dòng về HAVING', 'Nêu được khác biệt với WHERE', 'Slide_CSDL_Chuong4.pdf', 'planned');

INSERT INTO study_log (id, task_id, user_id, date, minutes, status, note) VALUES
  (40, 101, 'u-tung', '2026-11-02', 30, 'done', NULL);

-- Đẩy các sequence qua giá trị đã chèn tay.
SELECT setval(pg_get_serial_sequence('profile_version', 'id'), (SELECT MAX(id) FROM profile_version));
SELECT setval(pg_get_serial_sequence('goal', 'id'), (SELECT MAX(id) FROM goal));
SELECT setval(pg_get_serial_sequence('document', 'id'), (SELECT MAX(id) FROM document));
SELECT setval(pg_get_serial_sequence('plan', 'id'), (SELECT MAX(id) FROM plan));
SELECT setval(pg_get_serial_sequence('task', 'id'), (SELECT MAX(id) FROM task));
SELECT setval(pg_get_serial_sequence('study_log', 'id'), (SELECT MAX(id) FROM study_log));
SELECT setval(pg_get_serial_sequence('report', 'id'), (SELECT MAX(id) FROM report));
SELECT setval(pg_get_serial_sequence('suggestion', 'id'), (SELECT MAX(id) FROM suggestion));

/* ====================================================================
   Dữ liệu mẫu cho 17 bảng bổ sung (SDD v0.4 §6). Chỉ là dữ liệu minh hoạ giao diện:
   - llm_call_log, web_search_log, tool_call để trống vì chưa có LLM / tìm web / agent chạy thật;
   - câu trắc nghiệm do tác giả soạn từ 3 đoạn mẫu, gắn nhãn generated (chưa duyệt).
   ==================================================================== */

-- Chủ đề của môn CSDL (khớp course.topics)
INSERT INTO topic (id, course_id, owner_id, name, prerequisite_ids, source) VALUES
  (1, 'csdl', NULL, 'Khóa',        '{}',    'seeded'),
  (2, 'csdl', NULL, 'SQL cơ bản',  '{1}',   'seeded'),
  (3, 'csdl', NULL, 'JOIN',        '{1,2}', 'seeded'),
  (4, 'csdl', NULL, 'GROUP BY',    '{2}',   'seeded'),
  (5, 'csdl', NULL, 'Chuẩn hoá',   '{1}',   'seeded');

-- Cột bổ sung của bảng cũ
UPDATE goal SET horizon = 'short',    share_pct = 70 WHERE id = 1;   -- hạn 20/11: 2 tuần
UPDATE goal SET horizon = 'semester', share_pct = 30 WHERE id = 2;   -- hạn 05/12: 5 tuần
UPDATE document SET usage = 'to_use' WHERE id = 4;
UPDATE task SET topic_id = CASE
  WHEN id IN (9, 100, 101, 201) THEN 1
  WHEN id IN (10, 102, 202) THEN 2
  WHEN id IN (12, 15, 103, 105, 203, 205) THEN 3
  ELSE 4 END;
UPDATE study_log SET output_submitted = TRUE WHERE status = 'done';
UPDATE suggestion SET target = 'plan', base_version_id = 3 WHERE id IN (1, 2);

-- Hướng học → lộ trình → cột mốc (mục tiêu 1: thi giữa kỳ, 3 tuần từ 02/11)
INSERT INTO direction_session (id, goal_id, questions, options, chosen_index, created_at) VALUES
  (1, 1,
   '["Bạn muốn ưu tiên làm thật nhiều bài tập hay hiểu lý thuyết trước?", "Bạn còn nhớ được phần nào của JOIN?"]',
   '[{"title":"Luyện truy vấn trước, lý thuyết sau","hoursPerWeek":3,"feasible":true},
     {"title":"Đọc giáo trình rồi mới làm bài","hoursPerWeek":4,"feasible":false}]',
   0, '2026-11-01T20:10:00+07');

INSERT INTO roadmap (id, goal_id, direction_id, profile_version_id, version, status, start_date, end_date, created_at) VALUES
  (1, 1, 1, 2, 1, 'active', '2026-11-02', '2026-11-20', '2026-11-01T20:20:00+07');

INSERT INTO milestone (id, roadmap_id, week_index, week_start, topic_ids, target_minutes, output, verify_method, status) VALUES
  (1, 1, 1, '2026-11-02', '{1,2,3,4}', 180, 'Làm được truy vấn WHERE, JOIN và GROUP BY cơ bản',  'Chạy đúng các bài luyện của tuần', 'planned'),
  (2, 1, 2, '2026-11-09', '{3,4}',     180, 'Phân biệt LEFT/INNER JOIN và WHERE/HAVING',          'Bài luyện cuối buổi đúng từ 80%',  'planned'),
  (3, 1, 3, '2026-11-16', '{5,3,4}',   120, 'Ôn tập và làm đề thi thử',                           'Đề thi thử đạt mục tiêu 8 điểm',   'planned');

-- Kết quả bộ kiểm tra cho hai kế hoạch tuần 02/11 (chỉ các quy tắc đã cài: V1, V3, V5, V9)
INSERT INTO plan_validation_run (user_id, plan_id, draft_kind, attempt, results, passed, created_at) VALUES
  ('u-tung', 3, 'plan', 0,
   '[{"id":"V1","ok":true,"blocking":true},{"id":"V3","ok":true,"blocking":true},{"id":"V5","ok":true,"blocking":true},{"id":"V9","ok":true,"blocking":false}]',
   TRUE, '2026-11-02T07:00:00+07'),
  ('u-tung', 4, 'plan', 0,
   '[{"id":"V1","ok":true,"blocking":true},{"id":"V3","ok":true,"blocking":true},{"id":"V5","ok":true,"blocking":true},{"id":"V9","ok":false,"blocking":false,"detail":"Nhiệm vụ #206 dưới 15 phút"}]',
   TRUE, '2026-11-05T08:00:00+07');

-- Tài liệu gắn với nhiệm vụ
INSERT INTO task_document (task_id, document_id, section) VALUES
  (102, 1, NULL),
  (103, 1, 'LEFT JOIN'),
  (104, 1, 'GROUP BY và HAVING'),
  (104, 2, 'mục 5.3'),
  (105, 3, NULL);

-- Chat: một luồng và một lượt hỏi đáp mẫu (đoạn trích từ chunk của Slide_CSDL_Chuong4.pdf)
INSERT INTO chat_thread (id, user_id, course_id, page_context, created_at) VALUES
  (1, 'u-tung', 'csdl', '{"page":"hom-nay","taskId":103}', '2026-11-05T14:05:00+07');

INSERT INTO interaction (id, user_id, task_id, thread_id, question, answer, cited_chunk_ids, config, latency_ms, mode, word_count, style_ok, created_at) VALUES
  (1, 'u-tung', 103, 1, 'LEFT JOIN khác INNER JOIN ở điểm nào?',
   'LEFT JOIN giữ mọi dòng của bảng bên trái, kể cả khi không có dòng khớp ở bảng bên phải [S1].',
   ARRAY['2'], '{"config":"hybrid_rerank"}', NULL, 'rag', 21, TRUE, '2026-11-05T14:06:00+07');

-- Câu trắc nghiệm mẫu (dùng chung, user_id NULL); chunk 1 = HAVING, 2 = LEFT JOIN, 3 = thứ tự xử lý
INSERT INTO quiz_item (id, user_id, course_id, chunk_id, topic_id, origin, stem, options, key, hint, why_correct, why_wrong, status) VALUES
  (1, NULL, 'csdl', 1, 4, 'generated',
   'Mệnh đề nào dùng để lọc kết quả sau khi đã gom nhóm?',
   '["WHERE","HAVING","ORDER BY","DISTINCT"]', 1,
   'Điều kiện này có thể chứa hàm gộp như COUNT hay SUM.',
   'HAVING lọc các nhóm sau GROUP BY và cho phép dùng hàm gộp.',
   '["WHERE lọc từng dòng trước khi gom nhóm nên không dùng được hàm gộp.","ORDER BY chỉ sắp xếp kết quả, không lọc.","DISTINCT chỉ loại dòng trùng, không lọc theo điều kiện của nhóm."]', 'active'),
  (2, NULL, 'csdl', 2, 3, 'generated',
   'Với LEFT JOIN, dòng của bảng bên trái không có dòng khớp ở bảng bên phải sẽ ra sao?',
   '["Bị loại khỏi kết quả","Vẫn xuất hiện, các cột của bảng phải là NULL","Gây lỗi cú pháp","Bị nhân đôi"]', 1,
   'Hãy nhớ LEFT JOIN “giữ” bảng nào.',
   'LEFT JOIN giữ mọi dòng của bảng bên trái, phần không khớp được điền NULL.',
   '["Đó là hành vi của INNER JOIN, không phải LEFT JOIN.","LEFT JOIN là cú pháp hợp lệ.","Dòng chỉ bị nhân lên khi có nhiều dòng khớp, không phải do không khớp."]', 'active'),
  (3, NULL, 'csdl', 3, 4, 'generated',
   'Trong thứ tự xử lý của một câu truy vấn, mệnh đề nào chạy ngay sau WHERE?',
   '["SELECT","HAVING","GROUP BY","ORDER BY"]', 2,
   'Thứ tự: FROM, WHERE, …',
   'Thứ tự xử lý là FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY.',
   '["SELECT chạy sau HAVING.","HAVING chạy sau GROUP BY vì cần các nhóm đã được tạo.","ORDER BY chạy cuối cùng."]', 'active'),
  (4, NULL, 'csdl', 1, 4, 'generated',
   'Cần đếm sinh viên mỗi lớp và chỉ giữ lớp có từ 30 sinh viên. Điều kiện số lượng viết ở đâu?',
   '["WHERE COUNT(*) >= 30","HAVING COUNT(*) >= 30","ON COUNT(*) >= 30","ORDER BY COUNT(*) >= 30"]', 1,
   'Điều kiện trên kết quả đã gom nhóm.',
   'Điều kiện trên hàm gộp của nhóm phải đặt trong HAVING.',
   '["WHERE chạy trước khi gom nhóm nên không dùng được hàm gộp.","ON là điều kiện nối bảng, không lọc nhóm.","ORDER BY chỉ sắp xếp."]', 'active');

-- Buổi luyện cuối buổi của nhiệm vụ JOIN tuần trước: sai 2/3 câu → vào hàng đợi làm lại
INSERT INTO quiz_session (id, user_id, task_id, kind, planned_items, started_at, finished_at) VALUES
  (1, 'u-tung', 12, 'end_of_session', 3, '2026-10-29T15:00:00+07', '2026-10-29T15:08:00+07');

INSERT INTO quiz_attempt (id, session_id, item_id, choice, correct, hint_used, seconds, created_at) VALUES
  (1, 1, 2, 1, TRUE,  FALSE, 25, '2026-10-29T15:02:00+07'),
  (2, 1, 1, 0, FALSE, TRUE,  60, '2026-10-29T15:04:00+07'),
  (3, 1, 4, 0, FALSE, FALSE, 40, '2026-10-29T15:07:00+07');

INSERT INTO retest_item (id, user_id, course_id, kind, quiz_item_id, first_quiz_attempt_id, wrong_count, status, created_at) VALUES
  (1, 'u-tung', 'csdl', 'quiz', 1, 2, 1, 'pending', '2026-10-29T15:08:00+07'),
  (2, 'u-tung', 'csdl', 'quiz', 4, 3, 1, 'pending', '2026-10-29T15:08:00+07');

-- Bài thực hành: 4 bài chuẩn SQL (sandbox SinhVien/MonHoc/Diem), 1 biến thể "AI tạo", 1 bài nộp văn bản
INSERT INTO exercise (id, course_id, topic_id, parent_id, owner_id, kind, level, prompt, reference_sql, check_sql, order_matters, hint_concept, criteria, origin, status) VALUES
  (1, 'csdl', 3, NULL, NULL, 'sql_select', 'cơ bản',
   'Liệt kê họ tên sinh viên và tên môn đã có điểm.',
   'SELECT sv.HoTen, mh.TenMH FROM SinhVien sv JOIN Diem d ON d.MaSV = sv.MaSV JOIN MonHoc mh ON mh.MaMH = d.MaMH',
   NULL, FALSE, 'Cần nối ba bảng qua khoá ngoại.', NULL, 'authored', 'active'),
  (2, 'csdl', 3, NULL, NULL, 'sql_select', 'cơ bản',
   'Liệt kê điểm môn CSDL của lớp IT01.',
   'SELECT sv.MaSV, sv.HoTen, d.Diem FROM SinhVien sv JOIN Diem d ON d.MaSV = sv.MaSV WHERE d.MaMH = ''CSDL'' AND sv.Lop = ''IT01''',
   NULL, FALSE, 'Lọc theo môn và lớp sau khi nối.', NULL, 'authored', 'active'),
  (3, 'csdl', 4, NULL, NULL, 'sql_select', 'trung bình',
   'Đếm số môn mỗi sinh viên đã có điểm.',
   'SELECT sv.MaSV, COUNT(d.MaMH) AS SoMon FROM SinhVien sv JOIN Diem d ON d.MaSV = sv.MaSV GROUP BY sv.MaSV',
   NULL, FALSE, 'Gom nhóm theo sinh viên rồi đếm.', NULL, 'authored', 'active'),
  (4, 'csdl', 3, NULL, NULL, 'sql_select', 'trung bình',
   'Liệt kê MaSV, HoTen và Diem môn CSDL của TẤT CẢ sinh viên lớp IT01; sinh viên chưa có điểm vẫn phải xuất hiện (Diem để trống).',
   'SELECT sv.MaSV, sv.HoTen, d.Diem FROM SinhVien sv LEFT JOIN Diem d ON d.MaSV = sv.MaSV AND d.MaMH = ''CSDL'' WHERE sv.Lop = ''IT01''',
   NULL, FALSE, 'INNER JOIN bỏ các dòng không khớp. Cần giữ cả sinh viên chưa có điểm?', NULL, 'authored', 'active'),
  (5, 'csdl', 3, 3, 'u-tung', 'sql_select', 'trung bình',
   'Liệt kê môn chưa có sinh viên nào có điểm.',
   'SELECT mh.MaMH, mh.TenMH FROM MonHoc mh LEFT JOIN Diem d ON d.MaMH = mh.MaMH WHERE d.MaSV IS NULL',
   NULL, FALSE, 'Giữ mọi môn, rồi tìm môn không có dòng điểm tương ứng.', NULL, 'generated', 'active'),
  (6, 'csdl', 4, NULL, NULL, 'submission', NULL,
   'Giải thích thứ tự xử lý của một câu truy vấn có GROUP BY và HAVING (tối đa 3.000 ký tự).',
   NULL, NULL, FALSE, NULL,
   '[{"name":"Nêu đúng thứ tự FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY"},{"name":"Chỉ ra WHERE chạy trước GROUP BY còn HAVING chạy sau"}]',
   'authored', 'active');

INSERT INTO task_exercise (task_id, exercise_id, position) VALUES
  (103, 1, 1), (103, 2, 2), (103, 3, 3), (103, 4, 4), (103, 5, 5),
  (104, 6, 1);

-- Lượt làm của nhiệm vụ hôm nay (JOIN và GROUP BY): bài 1–3 đạt, bài 4 chưa đạt
INSERT INTO exercise_attempt (id, user_id, task_id, exercise_id, action, content, passed, diff, hint_level, ms, created_at) VALUES
  (1, 'u-tung', 103, 1, 'submit', 'SELECT sv.HoTen, mh.TenMH FROM SinhVien sv JOIN Diem d ON d.MaSV = sv.MaSV JOIN MonHoc mh ON mh.MaMH = d.MaMH', TRUE, NULL, 0, 38, '2026-11-05T14:10:00+07'),
  (2, 'u-tung', 103, 2, 'submit', 'SELECT sv.MaSV, sv.HoTen, d.Diem FROM SinhVien sv JOIN Diem d ON d.MaSV = sv.MaSV WHERE d.MaMH = ''CSDL'' AND sv.Lop = ''IT01''', TRUE, NULL, 0, 41, '2026-11-05T14:14:00+07'),
  (3, 'u-tung', 103, 3, 'submit', 'SELECT sv.MaSV, COUNT(d.MaMH) AS SoMon FROM SinhVien sv JOIN Diem d ON d.MaSV = sv.MaSV GROUP BY sv.MaSV', TRUE, NULL, 0, 35, '2026-11-05T14:18:00+07'),
  (4, 'u-tung', 103, 4, 'run',    'SELECT sv.MaSV, sv.HoTen, d.Diem FROM SinhVien sv JOIN Diem d ON d.MaSV = sv.MaSV AND d.MaMH = ''CSDL'' WHERE sv.Lop = ''IT01''', NULL, NULL, 0, 44, '2026-11-05T14:22:00+07'),
  (5, 'u-tung', 103, 4, 'submit', 'SELECT sv.MaSV, sv.HoTen, d.Diem FROM SinhVien sv JOIN Diem d ON d.MaSV = sv.MaSV AND d.MaMH = ''CSDL'' WHERE sv.Lop = ''IT01''', FALSE, '{"missingRows":3,"extraRows":0,"wrongColumns":0}', 0, 46, '2026-11-05T14:23:00+07');

-- Đẩy các sequence của bảng mới qua giá trị đã chèn tay.
SELECT setval(pg_get_serial_sequence('topic', 'id'), (SELECT MAX(id) FROM topic));
SELECT setval(pg_get_serial_sequence('direction_session', 'id'), (SELECT MAX(id) FROM direction_session));
SELECT setval(pg_get_serial_sequence('roadmap', 'id'), (SELECT MAX(id) FROM roadmap));
SELECT setval(pg_get_serial_sequence('milestone', 'id'), (SELECT MAX(id) FROM milestone));
SELECT setval(pg_get_serial_sequence('chat_thread', 'id'), (SELECT MAX(id) FROM chat_thread));
SELECT setval(pg_get_serial_sequence('interaction', 'id'), (SELECT MAX(id) FROM interaction));
SELECT setval(pg_get_serial_sequence('quiz_item', 'id'), (SELECT MAX(id) FROM quiz_item));
SELECT setval(pg_get_serial_sequence('quiz_session', 'id'), (SELECT MAX(id) FROM quiz_session));
SELECT setval(pg_get_serial_sequence('quiz_attempt', 'id'), (SELECT MAX(id) FROM quiz_attempt));
SELECT setval(pg_get_serial_sequence('retest_item', 'id'), (SELECT MAX(id) FROM retest_item));
SELECT setval(pg_get_serial_sequence('exercise', 'id'), (SELECT MAX(id) FROM exercise));
SELECT setval(pg_get_serial_sequence('exercise_attempt', 'id'), (SELECT MAX(id) FROM exercise_attempt));
