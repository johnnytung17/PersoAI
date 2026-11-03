import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { PlanValidatorService } from '../plan/plan-validator.service';
import { PlanDayInput } from '../plan/plan.types';

// Bản demo chưa có phiên đăng nhập thật: mọi truy vấn chạy cho một người dùng, nhưng vẫn lọc theo owner.
export const DEMO_USER = 'u-tung';
const COURSE = 'csdl';
const today = (): string => process.env.DEMO_TODAY || '2026-11-05';

const WEEKDAY = ['', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
const WEEKDAY_SHORT = ['', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const PLAN_STATUS: Record<string, string> = { draft: 'Bản nháp', active: 'Đang áp dụng', superseded: 'Đã thay thế', discarded: 'Đã bỏ' };
const PRIORITY: Record<string, string> = { high: 'Cao', medium: 'Trung bình', low: 'Thấp' };
const PRIORITY_IN: Record<string, string> = { Cao: 'high', 'Trung bình': 'medium', Thấp: 'low' };
const KIND: Record<string, string> = { course: 'Tài liệu môn', reference: 'Tham khảo', own_work: 'Bài làm của tôi' };
const KIND_IN: Record<string, string> = { 'Tài liệu môn': 'course', 'Tham khảo': 'reference', 'Bài làm của tôi': 'own_work' };
const DOC_STATUS: Record<string, string> = { indexed: 'Đã lập chỉ mục', processing: 'Đang xử lý', failed: 'Lỗi' };
const TASK_STATUS: Record<string, string> = { planned: 'Chưa làm', in_progress: 'Đang làm', done: 'Xong', skipped: 'Bỏ qua' };
const LOG_STATUS_IN: Record<string, string> = { Xong: 'done', 'Đang làm': 'in_progress', 'Bỏ qua': 'skipped' };
const ORIGIN: Record<string, string> = { confirmed: 'Đã xác nhận', extracted: 'Trích xuất', typed: 'Tự nhập' };
const ORIGIN_IN: Record<string, string> = { 'Đã xác nhận': 'confirmed', 'Trích xuất': 'extracted', 'Tự nhập': 'typed' };
const PROFILE_FIELDS = [
  { key: 'budget', label: 'Thời gian học mỗi tuần' },
  { key: 'busy', label: 'Giờ bận' },
  { key: 'goal', label: 'Mục tiêu' },
  { key: 'skill', label: 'Kỹ năng SQL' },
  { key: 'best', label: 'Thời điểm học hiệu quả nhất', question: 'Bạn thường học hiệu quả nhất vào buổi nào (sáng, chiều hay tối)?' },
];
const SCANNED_ERROR = 'Không tìm thấy chữ (PDF quét). PersoAI chưa hỗ trợ OCR.';

function ddmm(d: string): string {
  const [, m, day] = d.split('-');
  return `${day}/${m}`;
}
function ddmmyyyy(d: string): string {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}
function addDays(d: string, n: number): string {
  const t = new Date(`${d}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}
function isoWeekday(d: string): number {
  const w = new Date(`${d}T00:00:00Z`).getUTCDay();
  return w === 0 ? 7 : w;
}
const hhmm = (t: string | null): string | undefined => (t ? t.slice(0, 5) : undefined);

type TaskRow = {
  id: number;
  plan_id: number;
  date: string;
  start_time: string | null;
  minutes: number;
  title: string;
  output: string;
  done_criterion: string;
  material: string | null;
  status: string;
};
type PlanRow = { id: number; goal_id: number; version: number; status: string; week_start: string; budget_minutes: number; note: string | null; created_at: Date };

@Injectable()
export class DataService {
  constructor(
    private readonly db: DbService,
    private readonly validator: PlanValidatorService,
  ) {}

  private weekStartOf(d: string): string {
    return addDays(d, 1 - isoWeekday(d));
  }

  /* ---------------- Hôm nay ---------------- */

  async today() {
    const now = today();
    const weekStart = this.weekStartOf(now);
    const [plan] = await this.db.query<PlanRow>(
      `SELECT p.* FROM plan p JOIN goal g ON g.id = p.goal_id
        WHERE g.user_id = $1 AND p.week_start = $2 AND p.status = 'active' LIMIT 1`,
      [DEMO_USER, weekStart],
    );
    if (!plan) return { weekLabel: 'Chưa có kế hoạch đang áp dụng', task: null, others: [] };
    const tasks = await this.db.query<TaskRow>('SELECT * FROM task WHERE plan_id = $1 ORDER BY date, start_time', [plan.id]);
    const [{ n }] = await this.db.query<{ n: string }>(
      `SELECT COUNT(DISTINCT p.week_start) AS n FROM plan p JOIN goal g ON g.id = p.goal_id WHERE g.user_id = $1 AND p.week_start <= $2`,
      [DEMO_USER, weekStart],
    );
    const done = tasks.filter((t) => t.status === 'done').length;
    const current = tasks.find((t) => t.date === now) ?? null;
    return {
      weekLabel: `Tuần ${n} · ${done}/${tasks.length} nhiệm vụ xong`,
      task: current && {
        id: String(current.id),
        title: current.title,
        minutes: current.minutes,
        status: TASK_STATUS[current.status],
        output: current.output,
        criteria: current.done_criterion,
        material: current.material ?? '',
      },
      others: tasks
        .filter((t) => t.id !== current?.id && t.date < now)
        .map((t) => ({
          id: String(t.id),
          title: t.title,
          minutes: t.minutes,
          due: `${WEEKDAY_SHORT[isoWeekday(t.date)]} ${ddmm(t.date)}`,
          // Quá hạn tính lúc đọc theo ngày, không lưu trong CSDL (LOG-02).
          status: t.status === 'done' ? 'Đã xong' : t.status === 'skipped' ? 'Bỏ qua' : 'Quá hạn',
        })),
    };
  }

  async addLog(body: { taskId?: unknown; status?: unknown; minutes?: unknown; note?: unknown }) {
    const taskId = Number(body.taskId);
    const status = LOG_STATUS_IN[String(body.status)];
    const minutes = Number(body.minutes);
    if (!Number.isInteger(taskId)) throw new BadRequestException('Nhật ký phải gắn với một nhiệm vụ.');
    if (!status) throw new BadRequestException('Trạng thái không hợp lệ.');
    if (!Number.isFinite(minutes) || minutes < 0 || minutes > 600) throw new BadRequestException('Số phút phải từ 0 đến 600.');
    return this.db.tx(async (q) => {
      const owned = await q(
        `SELECT t.id FROM task t JOIN plan p ON p.id = t.plan_id JOIN goal g ON g.id = p.goal_id WHERE t.id = $1 AND g.user_id = $2`,
        [taskId, DEMO_USER],
      );
      if (!owned.length) throw new NotFoundException('Không tìm thấy nhiệm vụ.');
      const [log] = await q<{ id: number }>(
        `INSERT INTO study_log (task_id, user_id, date, minutes, status, note) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [taskId, DEMO_USER, today(), minutes, status, typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null],
      );
      await q('UPDATE task SET status = $1 WHERE id = $2', [status, taskId]);
      return { id: log.id };
    });
  }

  /* ---------------- Kế hoạch ---------------- */

  private async planDays(plan: PlanRow) {
    const tasks = await this.db.query<TaskRow>('SELECT * FROM task WHERE plan_id = $1 ORDER BY date, start_time', [plan.id]);
    const busy = await this.db.query<{ weekday: number; label: string; all_day: boolean; start_at: string | null; end_at: string | null }>(
      'SELECT weekday, label, all_day, start_at, end_at FROM busy_slot WHERE user_id = $1 ORDER BY weekday',
      [DEMO_USER],
    );
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(plan.week_start, i);
      const wd = i + 1;
      const dayTasks = tasks.filter((t) => t.date === date);
      return {
        key: WEEKDAY_SHORT[wd].toLowerCase(),
        short: WEEKDAY_SHORT[wd],
        date: ddmm(date),
        iso: date,
        full: WEEKDAY[wd],
        busy: busy
          .filter((b) => b.weekday === wd)
          .map((b) => ({ label: b.label, allDay: b.all_day || undefined, start: hhmm(b.start_at), end: hhmm(b.end_at) })),
        tasks: dayTasks.map((t) => ({
          id: String(t.id),
          title: t.title,
          minutes: t.minutes,
          time: hhmm(t.start_time),
          output: t.output,
          criteria: t.done_criterion,
          material: t.material ?? '',
        })),
        rest: wd === 7 && dayTasks.length === 0 ? true : undefined,
      };
    });
  }

  async currentPlan() {
    const weekStart = this.weekStartOf(today());
    const plans = await this.db.query<PlanRow & { output: string; deadline: string }>(
      `SELECT p.*, g.output, g.deadline FROM plan p JOIN goal g ON g.id = p.goal_id
        WHERE g.user_id = $1 AND p.week_start = $2 ORDER BY p.version DESC`,
      [DEMO_USER, weekStart],
    );
    if (!plans.length) throw new NotFoundException('Chưa có kế hoạch cho tuần này.');
    const latest = plans[0];
    return {
      plan: {
        id: latest.id,
        version: latest.version,
        status: PLAN_STATUS[latest.status],
        title: `Kế hoạch tuần ${ddmm(weekStart)} – ${ddmm(addDays(weekStart, 6))}`,
        goal: `${latest.output}, hạn ${ddmm(latest.deadline)}`,
        budget: latest.budget_minutes,
      },
      days: await this.planDays(latest),
      versions: plans.map((p) => ({
        version: p.version,
        status: PLAN_STATUS[p.status],
        date: ddmm(new Date(p.created_at).toISOString().slice(0, 10)),
        note: p.note ?? '',
      })),
    };
  }

  async confirmPlan(planId: number) {
    const [plan] = await this.db.query<PlanRow>(
      `SELECT p.* FROM plan p JOIN goal g ON g.id = p.goal_id WHERE p.id = $1 AND g.user_id = $2`,
      [planId, DEMO_USER],
    );
    if (!plan) throw new NotFoundException('Không tìm thấy kế hoạch.');
    const days = await this.planDays(plan);
    const report = this.validator.check(days as PlanDayInput[], plan.budget_minutes);
    if (!report.canConfirm) throw new BadRequestException('Kế hoạch còn vi phạm quy tắc chặn, chưa thể xác nhận.');
    await this.db.tx(async (q) => {
      await q(`UPDATE plan SET status = 'superseded' WHERE goal_id = $1 AND week_start = $2 AND status = 'active'`, [plan.goal_id, plan.week_start]);
      await q(`UPDATE plan SET status = 'active' WHERE id = $1`, [plan.id]);
    });
    return { version: plan.version, status: PLAN_STATUS.active };
  }

  /** Tạo phiên bản nháp mới sao chép từ một kế hoạch; bản nháp cũ (nếu có) bị bỏ. */
  private async cloneAsDraft(
    q: <R extends object>(sql: string, params?: unknown[]) => Promise<R[]>,
    source: PlanRow,
    note: string,
  ): Promise<number> {
    await q(`UPDATE plan SET status = 'discarded' WHERE goal_id = $1 AND week_start = $2 AND status = 'draft'`, [source.goal_id, source.week_start]);
    const [{ max }] = await q<{ max: number }>(`SELECT MAX(version) AS max FROM plan WHERE goal_id = $1 AND week_start = $2`, [
      source.goal_id,
      source.week_start,
    ]);
    const [created] = await q<{ id: number }>(
      `INSERT INTO plan (goal_id, version, profile_version_id, parent_id, status, week_start, budget_minutes, note)
       SELECT goal_id, $2, profile_version_id, id, 'draft', week_start, budget_minutes, $3 FROM plan WHERE id = $1 RETURNING id`,
      [source.id, max + 1, note],
    );
    await q(
      `INSERT INTO task (plan_id, date, start_time, minutes, title, output, done_criterion, material, status)
       SELECT $2, date, start_time, minutes, title, output, done_criterion, material, 'planned' FROM task WHERE plan_id = $1`,
      [source.id, created.id],
    );
    return created.id;
  }

  async updateTask(taskId: number, body: { title?: unknown; minutes?: unknown; date?: unknown; time?: unknown }) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const minutes = Number(body.minutes);
    const date = typeof body.date === 'string' ? body.date : '';
    const time = typeof body.time === 'string' && body.time ? body.time : null;
    if (!title || !Number.isFinite(minutes) || minutes < 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Nhiệm vụ cần tên, số phút và ngày hợp lệ.');
    }
    return this.db.tx(async (q) => {
      const [row] = await q<TaskRow & PlanRow & { task_id: number }>(
        `SELECT t.id AS task_id, t.title, p.* FROM task t JOIN plan p ON p.id = t.plan_id JOIN goal g ON g.id = p.goal_id
          WHERE t.id = $1 AND g.user_id = $2`,
        [taskId, DEMO_USER],
      );
      if (!row) throw new NotFoundException('Không tìm thấy nhiệm vụ.');
      let targetTask = taskId;
      // Sửa kế hoạch đã áp dụng tạo bản nháp mới, giữ nguyên ảnh chụp cũ (PLN-05).
      if (row.status !== 'draft') {
        const draftId = await this.cloneAsDraft(q, row, 'Sửa nhiệm vụ giữa tuần');
        const [copy] = await q<{ id: number }>(
          `SELECT t2.id FROM task t1 JOIN task t2 ON t2.plan_id = $2 AND t2.date = t1.date AND t2.title = t1.title
            AND t2.start_time IS NOT DISTINCT FROM t1.start_time WHERE t1.id = $1 LIMIT 1`,
          [taskId, draftId],
        );
        targetTask = copy.id;
      }
      await q('UPDATE task SET title = $1, minutes = $2, date = $3, start_time = $4 WHERE id = $5', [title, minutes, date, time, targetTask]);
      return { taskId: String(targetTask) };
    });
  }

  async newDraft() {
    const weekStart = this.weekStartOf(today());
    const [latest] = await this.db.query<PlanRow>(
      `SELECT p.* FROM plan p JOIN goal g ON g.id = p.goal_id WHERE g.user_id = $1 AND p.week_start = $2 ORDER BY p.version DESC LIMIT 1`,
      [DEMO_USER, weekStart],
    );
    if (!latest) throw new NotFoundException('Chưa có kế hoạch để làm gốc.');
    // Bản demo: bản nháp "do AI soạn" được mô phỏng bằng cách sao chép bản gần nhất.
    await this.db.tx((q) => this.cloneAsDraft(q, latest, 'Bản nháp mới do AI soạn sau 3 câu hỏi làm rõ'));
    return this.currentPlan();
  }

  /* ---------------- Mục tiêu & tài liệu ---------------- */

  async goals() {
    const rows = await this.db.query<{ id: number; output: string; deadline: string; priority: string; status: string }>(
      `SELECT id, output, deadline, priority, status FROM goal WHERE user_id = $1 AND course_id = $2 ORDER BY deadline`,
      [DEMO_USER, COURSE],
    );
    return rows.map((g) => ({ id: String(g.id), output: g.output, deadline: ddmmyyyy(g.deadline), priority: PRIORITY[g.priority], status: 'Đang theo đuổi' }));
  }

  async addGoal(body: { output?: unknown; deadline?: unknown; priority?: unknown }) {
    const output = typeof body.output === 'string' ? body.output.trim() : '';
    const deadline = typeof body.deadline === 'string' ? body.deadline : '';
    const priority = PRIORITY_IN[String(body.priority)];
    if (!output) throw new BadRequestException('Hãy nhập đầu ra mong muốn.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) throw new BadRequestException('Mục tiêu cần có hạn chót.');
    if (!priority) throw new BadRequestException('Mức ưu tiên không hợp lệ.');
    await this.db.query(`INSERT INTO goal (user_id, course_id, output, deadline, priority) VALUES ($1, $2, $3, $4, $5)`, [
      DEMO_USER,
      COURSE,
      output,
      deadline,
      priority,
    ]);
    return this.goals();
  }

  async documents() {
    const rows = await this.db.query<{ id: number; name: string; kind: string; pages: number | null; status: string; error: string | null }>(
      `SELECT id, name, kind, pages, status, error FROM document WHERE owner_id = $1 AND course_id = $2 ORDER BY id`,
      [DEMO_USER, COURSE],
    );
    return rows.map((d) => ({
      id: String(d.id),
      name: d.name,
      kind: KIND[d.kind],
      pages: d.pages ? `${d.pages} trang` : undefined,
      status: DOC_STATUS[d.status],
      error: d.error ?? undefined,
    }));
  }

  async addDocument(body: { name?: unknown; kind?: unknown; size?: unknown }) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const kind = KIND_IN[String(body.kind)];
    const size = Number(body.size) || 0;
    if (!name || !/\.(pdf|docx|txt)$/i.test(name)) throw new BadRequestException('Chỉ nhận PDF có chữ, DOCX hoặc TXT.');
    if (!kind) throw new BadRequestException('Loại tài liệu không hợp lệ.');
    if (size > 20 * 1024 * 1024) {
      await this.db.query(`INSERT INTO document (owner_id, course_id, name, kind, status, error) VALUES ($1, $2, $3, $4, 'failed', 'File vượt quá 20 MB.')`, [
        DEMO_USER,
        COURSE,
        name,
        kind,
      ]);
      return this.documents();
    }
    const [doc] = await this.db.query<{ id: number }>(
      `INSERT INTO document (owner_id, course_id, name, kind, status) VALUES ($1, $2, $3, $4, 'processing') RETURNING id`,
      [DEMO_USER, COURSE, name, kind],
    );
    // Bản demo: mô phỏng trích chữ + lập chỉ mục; file có "scan" trong tên giả lập PDF quét không có lớp chữ.
    setTimeout(() => {
      const scanned = /scan/i.test(name);
      void this.db
        .query(`UPDATE document SET status = $1, error = $2, pages = $3 WHERE id = $4`, [
          scanned ? 'failed' : 'indexed',
          scanned ? SCANNED_ERROR : null,
          scanned || !/\.pdf$/i.test(name) ? null : 12,
          doc.id,
        ])
        .catch(() => undefined);
    }, 2000);
    return this.documents();
  }

  async deleteDocument(id: number) {
    // Xoá tài liệu kéo theo chunk (ON DELETE CASCADE) để không còn được truy xuất (AUTH-04).
    const rows = await this.db.query(`DELETE FROM document WHERE id = $1 AND owner_id = $2 RETURNING id`, [id, DEMO_USER]);
    if (!rows.length) throw new NotFoundException('Không tìm thấy tài liệu.');
    return this.documents();
  }

  /* ---------------- Báo cáo tuần ---------------- */

  async reportWeeks() {
    const current = this.weekStartOf(today());
    return [addDays(current, -14), addDays(current, -7)].map((s) => ({ start: s, label: `${ddmm(s)} – ${ddmm(addDays(s, 6))}` }));
  }

  /** Ảnh chụp 7 ngày tính hoàn toàn bằng SQL; LLM chỉ viết lời (RPT-01, RPT-02). */
  private async snapshot(start: string, planId: number | null) {
    const end = addDays(start, 6);
    const [s] = await this.db.query<{ total: string; done: string; planned: string; logged: string; overdue: string; missing: string; logs: string }>(
      `WITH t AS (
         SELECT t.* FROM task t JOIN plan p ON p.id = t.plan_id JOIN goal g ON g.id = p.goal_id
          WHERE g.user_id = $1 AND t.date BETWEEN $2 AND $3 AND ($4::int IS NULL OR t.plan_id = $4)
       )
       SELECT COUNT(*)                                                         AS total,
              COUNT(*) FILTER (WHERE status = 'done')                          AS done,
              COALESCE(SUM(minutes), 0)                                        AS planned,
              (SELECT COALESCE(SUM(l.minutes), 0) FROM study_log l WHERE l.task_id IN (SELECT id FROM t)) AS logged,
              COUNT(*) FILTER (WHERE status NOT IN ('done', 'skipped') AND date < $5) AS overdue,
              (SELECT COUNT(DISTINCT d.date) FROM t d
                WHERE NOT EXISTS (SELECT 1 FROM study_log l WHERE l.user_id = $1 AND l.date = d.date)) AS missing,
              (SELECT COUNT(*) FROM study_log l WHERE l.task_id IN (SELECT id FROM t)) AS logs
         FROM t`,
      [DEMO_USER, start, end, planId, today()],
    );
    return {
      total: Number(s.total),
      done: Number(s.done),
      planned: Number(s.planned),
      logged: Number(s.logged),
      overdue: Number(s.overdue),
      missingDays: Number(s.missing),
      logCount: Number(s.logs),
    };
  }

  async report(start: string, generate = false) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new BadRequestException('Tuần không hợp lệ.');
    const end = addDays(start, 6);
    const [row] = await this.db.query<{ id: number; plan_id: number | null; narrative: string | null; snapshot: unknown }>(
      `SELECT id, plan_id, narrative, snapshot FROM report WHERE user_id = $1 AND course_id = $2 AND period_start = $3`,
      [DEMO_USER, COURSE, start],
    );
    if (!row && !generate) return { start, label: `${ddmm(start)} – ${ddmm(end)}`, generated: false };

    const snap = await this.snapshot(start, row?.plan_id ?? null);
    let reportId = row?.id;
    if (generate) {
      const [saved] = await this.db.query<{ id: number }>(
        `INSERT INTO report (user_id, course_id, period_start, period_end, plan_id, snapshot)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, course_id, period_start) DO UPDATE SET snapshot = EXCLUDED.snapshot, created_at = now()
         RETURNING id`,
        [DEMO_USER, COURSE, start, end, row?.plan_id ?? null, JSON.stringify(snap)],
      );
      reportId = saved.id;
    }
    const noData = snap.logCount === 0;
    const suggestions = noData
      ? []
      : await this.db.query<{ id: number; title: string; reason: string; evidence_ids: string[]; diff: { from: string; to: string }; status: string }>(
          `SELECT id, title, reason, evidence_ids, diff, status FROM suggestion WHERE report_id = $1 ORDER BY id LIMIT 3`,
          [reportId],
        );
    return {
      start,
      label: `${ddmm(start)} – ${ddmm(end)}`,
      generated: true,
      logCount: snap.logCount,
      snapshot: snap,
      narrative: noData ? null : row?.narrative ?? null,
      suggestions: suggestions.map((s) => ({
        id: String(s.id),
        title: s.title,
        reason: s.reason,
        evidence: s.evidence_ids,
        diff: s.diff,
        status: s.status,
      })),
    };
  }

  async decideSuggestion(id: number, decision: unknown) {
    if (decision !== 'accepted' && decision !== 'rejected') throw new BadRequestException('Quyết định không hợp lệ.');
    return this.db.tx(async (q) => {
      const [s] = await q<{ id: number; status: string }>(
        `SELECT s.id, s.status FROM suggestion s JOIN report r ON r.id = s.report_id WHERE s.id = $1 AND r.user_id = $2`,
        [id, DEMO_USER],
      );
      if (!s) throw new NotFoundException('Không tìm thấy gợi ý.');
      if (s.status !== 'pending') throw new BadRequestException('Gợi ý này đã được xử lý.');
      if (decision === 'rejected') {
        // Bỏ qua gợi ý không đổi kế hoạch (RPT-03).
        await q(`UPDATE suggestion SET status = 'rejected' WHERE id = $1`, [id]);
        return { status: 'rejected' };
      }
      const [active] = await q<PlanRow>(
        `SELECT p.* FROM plan p JOIN goal g ON g.id = p.goal_id WHERE g.user_id = $1 AND p.status = 'active' ORDER BY p.week_start DESC LIMIT 1`,
        [DEMO_USER],
      );
      const newPlanId = active ? await this.cloneAsDraft(q, active, `Từ gợi ý #${id} trong báo cáo tuần`) : null;
      await q(`UPDATE suggestion SET status = 'accepted', new_plan_id = $2 WHERE id = $1`, [id, newPlanId]);
      const [v] = newPlanId ? await q<{ version: number }>(`SELECT version FROM plan WHERE id = $1`, [newPlanId]) : [];
      return { status: 'accepted', newPlanVersion: v?.version ?? null };
    });
  }

  /* ---------------- Hồ sơ ---------------- */

  async profile() {
    const [p] = await this.db.query<{ version: number; data: Record<string, string | null>; origins: Record<string, string>; source_text: string | null; confirmed_at: Date | null }>(
      `SELECT version, data, origins, source_text, confirmed_at FROM profile_version WHERE user_id = $1 ORDER BY version DESC LIMIT 1`,
      [DEMO_USER],
    );
    if (!p) return null;
    return {
      version: p.version,
      confirmedAt: p.confirmed_at ? ddmmyyyy(new Date(p.confirmed_at).toISOString().slice(0, 10)) : null,
      sourceText: p.source_text ?? '',
      fields: PROFILE_FIELDS.map((f) => ({
        key: f.key,
        label: f.label,
        value: p.data[f.key] ?? null,
        source: p.data[f.key] ? ORIGIN[p.origins[f.key]] : undefined,
        question: f.question,
      })),
    };
  }

  async saveProfile(body: { sourceText?: unknown; fields?: unknown }) {
    if (!Array.isArray(body.fields)) throw new BadRequestException('Thiếu danh sách trường hồ sơ.');
    const data: Record<string, string | null> = {};
    const origins: Record<string, string> = {};
    for (const f of body.fields as { key: string; value: string | null; source?: string }[]) {
      if (!PROFILE_FIELDS.some((x) => x.key === f.key)) continue;
      data[f.key] = f.value && String(f.value).trim() ? String(f.value).trim().slice(0, 300) : null;
      if (data[f.key]) origins[f.key] = ORIGIN_IN[f.source ?? ''] === 'typed' ? 'typed' : 'confirmed';
    }
    const sourceText = typeof body.sourceText === 'string' ? body.sourceText.slice(0, 2000) : null;
    // Chỉ lưu khi người dùng xác nhận; mỗi lần xác nhận là một phiên bản mới (PRO-04).
    await this.db.query(
      `INSERT INTO profile_version (user_id, version, data, origins, source_text, confirmed_at)
       SELECT $1, COALESCE(MAX(version), 0) + 1, $2, $3, $4, now() FROM profile_version WHERE user_id = $1`,
      [DEMO_USER, JSON.stringify(data), JSON.stringify(origins), sourceText],
    );
    return this.profile();
  }

  /* ---------------- Hỏi đáp ---------------- */

  async saveInteraction(taskId: string | null, question: string, answer: string, cited: string[], config: object, latencyMs: number) {
    if (!this.db.available) return;
    const tid = taskId && /^\d+$/.test(taskId) ? Number(taskId) : null;
    await this.db.query(
      `INSERT INTO interaction (user_id, task_id, question, answer, cited_chunk_ids, config, latency_ms) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [DEMO_USER, tid, question, answer, cited, JSON.stringify(config), latencyMs],
    );
  }
}
