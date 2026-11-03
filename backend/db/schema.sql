-- PersoAI — lược đồ PostgreSQL: 30 bảng của SDD v0.4 §6 và Class diagram v0.4 (13 bảng lõi ở trên, 17 bảng bổ sung ở cuối file).
-- Chạy lặp lại an toàn: chỉ tạo bảng còn thiếu.

CREATE TABLE IF NOT EXISTS app_user (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  class_name    TEXT,
  consent_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS profile_version (
  id           SERIAL PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  version      INT  NOT NULL,
  data         JSONB NOT NULL,          -- {key: value|null}
  origins      JSONB NOT NULL,          -- {key: "typed"|"extracted"|"confirmed"}
  source_text  TEXT,
  confirmed_at TIMESTAMPTZ,
  UNIQUE (user_id, version)
);

CREATE TABLE IF NOT EXISTS busy_slot (
  id       SERIAL PRIMARY KEY,
  user_id  TEXT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  weekday  INT  NOT NULL CHECK (weekday BETWEEN 1 AND 7),   -- 1 = Thứ Hai … 7 = Chủ nhật
  label    TEXT NOT NULL,
  all_day  BOOLEAN NOT NULL DEFAULT FALSE,
  start_at TIME,
  end_at   TIME
);

CREATE TABLE IF NOT EXISTS course (
  id     TEXT PRIMARY KEY,
  code   TEXT NOT NULL,
  name   TEXT NOT NULL,
  topics TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS goal (
  id        SERIAL PRIMARY KEY,
  user_id   TEXT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES course(id),
  output    TEXT NOT NULL,
  deadline  DATE NOT NULL,
  priority  TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  status    TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS document (
  id         SERIAL PRIMARY KEY,
  owner_id   TEXT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  course_id  TEXT NOT NULL REFERENCES course(id),
  name       TEXT NOT NULL,
  kind       TEXT NOT NULL CHECK (kind IN ('course', 'reference', 'own_work')),
  version    INT  NOT NULL DEFAULT 1,
  sha256     TEXT,
  pages      INT,
  status     TEXT NOT NULL CHECK (status IN ('processing', 'indexed', 'failed')),
  error      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chunk (
  id          SERIAL PRIMARY KEY,
  document_id INT  NOT NULL REFERENCES document(id) ON DELETE CASCADE,
  ordinal     INT  NOT NULL,
  tokens      INT,
  page        TEXT,
  section     TEXT,
  text        TEXT NOT NULL,
  vector_id   INT
);

CREATE TABLE IF NOT EXISTS plan (
  id                 SERIAL PRIMARY KEY,
  goal_id            INT  NOT NULL REFERENCES goal(id) ON DELETE CASCADE,
  version            INT  NOT NULL,
  profile_version_id INT  REFERENCES profile_version(id),
  parent_id          INT  REFERENCES plan(id),
  status             TEXT NOT NULL CHECK (status IN ('draft', 'active', 'superseded', 'discarded')),
  week_start         DATE NOT NULL,
  budget_minutes     INT  NOT NULL,
  note               TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task (
  id             SERIAL PRIMARY KEY,
  plan_id        INT  NOT NULL REFERENCES plan(id) ON DELETE CASCADE,
  date           DATE NOT NULL,
  start_time     TIME,
  minutes        INT  NOT NULL CHECK (minutes >= 0),
  title          TEXT NOT NULL,
  output         TEXT NOT NULL,
  done_criterion TEXT NOT NULL,
  material       TEXT,
  status         TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'done', 'skipped'))
  -- "quá hạn" không lưu: tính lúc đọc theo ngày Asia/Ho_Chi_Minh
);

CREATE TABLE IF NOT EXISTS study_log (
  id      SERIAL PRIMARY KEY,
  task_id INT  NOT NULL REFERENCES task(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  date    DATE NOT NULL,
  minutes INT  NOT NULL CHECK (minutes BETWEEN 0 AND 600),
  status  TEXT NOT NULL CHECK (status IN ('in_progress', 'done', 'skipped')),
  note    TEXT
);

CREATE TABLE IF NOT EXISTS interaction (
  id              SERIAL PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  task_id         INT  REFERENCES task(id) ON DELETE SET NULL,
  question        TEXT NOT NULL,
  answer          TEXT NOT NULL,
  cited_chunk_ids TEXT[] NOT NULL DEFAULT '{}',
  config          JSONB NOT NULL,
  latency_ms      REAL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report (
  id         SERIAL PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  course_id  TEXT NOT NULL REFERENCES course(id),
  period_start DATE NOT NULL,
  period_end   DATE NOT NULL,
  plan_id    INT  REFERENCES plan(id),
  snapshot   JSONB,
  narrative  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id, period_start)
);

CREATE TABLE IF NOT EXISTS suggestion (
  id           SERIAL PRIMARY KEY,
  report_id    INT  NOT NULL REFERENCES report(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  reason       TEXT NOT NULL,
  evidence_ids TEXT[] NOT NULL,
  diff         JSONB NOT NULL,          -- {from, to}
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  new_plan_id  INT  REFERENCES plan(id)
);

/* ====================================================================
   Phần bổ sung cho đủ 30 bảng (SDD v0.4 §6, Class diagram 2.1).
   Chạy lặp lại an toàn: chỉ tạo bảng/cột còn thiếu.
   ==================================================================== */

-- Chủ đề của môn (Topic): owner_id NULL = chủ đề có sẵn (seeded), có giá trị = người dùng đã xác nhận (confirmed)
CREATE TABLE IF NOT EXISTS topic (
  id               SERIAL PRIMARY KEY,
  course_id        TEXT NOT NULL REFERENCES course(id) ON DELETE CASCADE,
  owner_id         TEXT REFERENCES app_user(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  prerequisite_ids INT[] NOT NULL DEFAULT '{}',
  source           TEXT NOT NULL DEFAULT 'seeded' CHECK (source IN ('seeded', 'confirmed'))
);

-- Cột bổ sung cho bảng đã có
ALTER TABLE goal       ADD COLUMN IF NOT EXISTS horizon  TEXT CHECK (horizon IN ('short', 'semester'));   -- short 1–4 tuần, semester 5–20 tuần
ALTER TABLE goal       ADD COLUMN IF NOT EXISTS share_pct INT CHECK (share_pct BETWEEN 0 AND 100);
ALTER TABLE document   ADD COLUMN IF NOT EXISTS usage    TEXT NOT NULL DEFAULT 'used' CHECK (usage IN ('used', 'to_use'));
ALTER TABLE task       ADD COLUMN IF NOT EXISTS topic_id INT REFERENCES topic(id);
ALTER TABLE study_log  ADD COLUMN IF NOT EXISTS output_submitted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE report     ADD COLUMN IF NOT EXISTS version  INT NOT NULL DEFAULT 1;

-- Lộ trình và cột mốc
CREATE TABLE IF NOT EXISTS direction_session (
  id           SERIAL PRIMARY KEY,
  goal_id      INT  NOT NULL REFERENCES goal(id) ON DELETE CASCADE,
  questions    JSONB NOT NULL DEFAULT '[]',     -- ≤ 3 câu làm rõ
  options      JSONB NOT NULL DEFAULT '[]',     -- 2–3 hướng, đã gắn cờ khả thi
  chosen_index INT,                             -- NULL → không có lộ trình
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS roadmap (
  id                 SERIAL PRIMARY KEY,
  goal_id            INT  NOT NULL REFERENCES goal(id) ON DELETE CASCADE,
  direction_id       INT  REFERENCES direction_session(id),
  profile_version_id INT  REFERENCES profile_version(id),
  version            INT  NOT NULL,
  status             TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'superseded', 'discarded')),
  start_date         DATE NOT NULL,
  end_date           DATE NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (goal_id, version)
);
-- Một lộ trình active mỗi mục tiêu
CREATE UNIQUE INDEX IF NOT EXISTS roadmap_one_active ON roadmap (goal_id) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS milestone (
  id             SERIAL PRIMARY KEY,
  roadmap_id     INT  NOT NULL REFERENCES roadmap(id) ON DELETE CASCADE,
  week_index     INT  NOT NULL CHECK (week_index >= 1),
  week_start     DATE NOT NULL,
  topic_ids      INT[] NOT NULL DEFAULT '{}',
  target_minutes INT  NOT NULL CHECK (target_minutes > 0),
  output         TEXT NOT NULL,
  verify_method  TEXT,                          -- R1: cách kiểm tra
  status         TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'done', 'behind')),
  UNIQUE (roadmap_id, week_index)
);

-- Mỗi lần kiểm tra lộ trình/kế hoạch một dòng (đo RQ3)
CREATE TABLE IF NOT EXISTS plan_validation_run (
  id         SERIAL PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  roadmap_id INT  REFERENCES roadmap(id) ON DELETE CASCADE,
  plan_id    INT  REFERENCES plan(id) ON DELETE CASCADE,
  draft_kind TEXT NOT NULL CHECK (draft_kind IN ('roadmap', 'plan')),
  attempt    INT  NOT NULL CHECK (attempt BETWEEN 0 AND 3),
  results    JSONB NOT NULL,
  passed     BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Đề xuất gắn với kế hoạch hoặc lộ trình; đề xuất có thể hết hạn
ALTER TABLE suggestion ADD COLUMN IF NOT EXISTS target TEXT NOT NULL DEFAULT 'plan' CHECK (target IN ('plan', 'roadmap'));
ALTER TABLE suggestion ADD COLUMN IF NOT EXISTS base_version_id INT;     -- id của plan/roadmap gốc (theo target)
ALTER TABLE suggestion ADD COLUMN IF NOT EXISTS decision_reason TEXT;
ALTER TABLE suggestion DROP CONSTRAINT IF EXISTS suggestion_status_check;
ALTER TABLE suggestion ADD CONSTRAINT suggestion_status_check CHECK (status IN ('pending', 'accepted', 'rejected', 'expired'));

-- Tài liệu gắn với nhiệm vụ
CREATE TABLE IF NOT EXISTS task_document (
  task_id     INT NOT NULL REFERENCES task(id) ON DELETE CASCADE,
  document_id INT NOT NULL REFERENCES document(id) ON DELETE CASCADE,
  section     TEXT,
  PRIMARY KEY (task_id, document_id)
);

-- Chat học tập
CREATE TABLE IF NOT EXISTS chat_thread (
  id           SERIAL PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  course_id    TEXT REFERENCES course(id),
  page_context JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE interaction ADD COLUMN IF NOT EXISTS thread_id  INT REFERENCES chat_thread(id) ON DELETE SET NULL;
ALTER TABLE interaction ADD COLUMN IF NOT EXISTS mode       TEXT NOT NULL DEFAULT 'rag' CHECK (mode IN ('rag', 'agent', 'fallback', 'web'));
ALTER TABLE interaction ADD COLUMN IF NOT EXISTS word_count INT;
ALTER TABLE interaction ADD COLUMN IF NOT EXISTS style_ok   BOOLEAN;

CREATE TABLE IF NOT EXISTS tool_call (
  id             SERIAL PRIMARY KEY,
  interaction_id INT  NOT NULL REFERENCES interaction(id) ON DELETE CASCADE,
  call_index     INT  NOT NULL CHECK (call_index BETWEEN 1 AND 3),
  tool           TEXT NOT NULL,                 -- view_plan, read_report_snapshot, propose_plan_change…
  args           JSONB,
  result_summary TEXT,
  error          TEXT,
  UNIQUE (interaction_id, call_index)
);

CREATE TABLE IF NOT EXISTS web_search_log (
  id             SERIAL PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  interaction_id INT  REFERENCES interaction(id) ON DELETE SET NULL,
  query_text     TEXT NOT NULL,                 -- chỉ nội dung câu hỏi
  provider       TEXT,
  result_urls    TEXT[] NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS llm_call_log (
  id         SERIAL PRIMARY KEY,
  user_id    TEXT REFERENCES app_user(id) ON DELETE SET NULL,
  purpose    TEXT NOT NULL,
  model      TEXT,
  tokens_in  INT,
  tokens_out INT,
  cost_usd   NUMERIC(10, 6),
  cache_hit  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bài luyện trắc nghiệm
CREATE TABLE IF NOT EXISTS quiz_item (
  id          SERIAL PRIMARY KEY,
  user_id     TEXT REFERENCES app_user(id) ON DELETE CASCADE,   -- NULL = câu đã duyệt dùng chung
  course_id   TEXT REFERENCES course(id),
  chunk_id    INT  REFERENCES chunk(id) ON DELETE SET NULL,
  topic_id    INT  REFERENCES topic(id),
  origin      TEXT NOT NULL DEFAULT 'generated' CHECK (origin IN ('generated', 'reviewed')),
  stem        TEXT NOT NULL,
  options     JSONB NOT NULL,                   -- đúng 4 phương án
  key         INT  NOT NULL CHECK (key BETWEEN 0 AND 3),
  hint        TEXT,
  why_correct TEXT,
  why_wrong   JSONB,                            -- 3 giải thích cho phương án sai
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'flagged', 'retired')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz_session (
  id            SERIAL PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  task_id       INT  NOT NULL REFERENCES task(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL CHECK (kind IN ('end_of_session', 'retest')),
  planned_items INT  NOT NULL CHECK (planned_items BETWEEN 1 AND 10),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS quiz_attempt (
  id         SERIAL PRIMARY KEY,
  session_id INT  NOT NULL REFERENCES quiz_session(id) ON DELETE CASCADE,
  item_id    INT  NOT NULL REFERENCES quiz_item(id) ON DELETE CASCADE,
  choice     INT  NOT NULL CHECK (choice BETWEEN 0 AND 3),
  correct    BOOLEAN NOT NULL,
  hint_used  BOOLEAN NOT NULL DEFAULT FALSE,
  seconds    INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Thực hành SQL / bài nộp văn bản (v0.3)
CREATE TABLE IF NOT EXISTS exercise (
  id            SERIAL PRIMARY KEY,
  course_id     TEXT NOT NULL REFERENCES course(id),
  topic_id      INT  REFERENCES topic(id),
  parent_id     INT  REFERENCES exercise(id),   -- biến thể sinh từ bài chuẩn
  owner_id      TEXT REFERENCES app_user(id) ON DELETE CASCADE,   -- NULL = bài chuẩn dùng chung
  kind          TEXT NOT NULL CHECK (kind IN ('sql_select', 'sql_dml', 'submission')),
  level         TEXT,
  prompt        TEXT NOT NULL,
  reference_sql TEXT,
  check_sql     TEXT,                           -- bài DML: SELECT bảng đích
  order_matters BOOLEAN NOT NULL DEFAULT FALSE,
  hint_concept  TEXT,                           -- gợi ý bậc 2
  criteria      JSONB,                          -- bài nộp: 2–4 tiêu chí
  origin        TEXT NOT NULL DEFAULT 'authored' CHECK (origin IN ('authored', 'generated')),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'rejected', 'retired')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task_exercise (
  task_id     INT NOT NULL REFERENCES task(id) ON DELETE CASCADE,
  exercise_id INT NOT NULL REFERENCES exercise(id) ON DELETE CASCADE,
  position    INT NOT NULL CHECK (position BETWEEN 1 AND 5),
  PRIMARY KEY (task_id, exercise_id)
);

CREATE TABLE IF NOT EXISTS exercise_attempt (
  id          SERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  task_id     INT  NOT NULL REFERENCES task(id) ON DELETE CASCADE,
  exercise_id INT  NOT NULL REFERENCES exercise(id) ON DELETE CASCADE,
  action      TEXT NOT NULL CHECK (action IN ('run', 'submit')),
  content     TEXT NOT NULL,
  passed      BOOLEAN,
  diff        JSONB,
  hint_level  INT  NOT NULL DEFAULT 0 CHECK (hint_level BETWEEN 0 AND 3),
  ms          INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hàng đợi làm lại (quiz hoặc bài thực hành)
CREATE TABLE IF NOT EXISTS retest_item (
  id                        SERIAL PRIMARY KEY,
  user_id                   TEXT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  course_id                 TEXT NOT NULL REFERENCES course(id),
  kind                      TEXT NOT NULL CHECK (kind IN ('quiz', 'exercise')),
  quiz_item_id              INT  REFERENCES quiz_item(id) ON DELETE CASCADE,
  exercise_id               INT  REFERENCES exercise(id) ON DELETE CASCADE,
  first_quiz_attempt_id     INT  REFERENCES quiz_attempt(id) ON DELETE SET NULL,       -- lượt sai đầu tiên
  first_exercise_attempt_id INT  REFERENCES exercise_attempt(id) ON DELETE SET NULL,
  wrong_count               INT  NOT NULL DEFAULT 0 CHECK (wrong_count BETWEEN 0 AND 3),
  status                    TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cleared', 'escalated')),
  skip_reason               TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((kind = 'quiz' AND quiz_item_id IS NOT NULL) OR (kind = 'exercise' AND exercise_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS retest_pending ON retest_item (user_id, course_id, created_at) WHERE status = 'pending';
