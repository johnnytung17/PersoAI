"use client";

import { motion } from "framer-motion";
import {
  AlarmClockOff,
  BarChart3,
  Loader2,
  RefreshCw,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Database,
  Lightbulb,
  ListChecks,
  NotebookTabs,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { FadeUp } from "@/components/ui/FadeUp";
import { reportNote, reports, type Metric, type Suggestion, type WeeklyReport } from "@/lib/mock";
import { api, apiOrError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";
import { useDemo } from "@/lib/demo";

const toneMap: Record<Metric["tone"], { icon: LucideIcon; chip: string; bar: string }> = {
  indigo: { icon: ListChecks, chip: "bg-indigo-50 text-indigo-600", bar: "bg-indigo-600" },
  cyan: { icon: Clock3, chip: "bg-indigo-50 text-indigo-600", bar: "bg-indigo-400" },
  rose: { icon: AlarmClockOff, chip: "bg-rose-50 text-rose-600", bar: "bg-rose-600" },
  amber: { icon: NotebookTabs, chip: "bg-amber-50 text-amber-700", bar: "bg-amber-500" },
};

// Luyện tập theo chủ đề (RPT-01, HND-08): “đúng X/Y”, “đạt X/Y”, không kết luận thành thạo.
const practiceByTopic = [
  { topic: "Khóa chính", quiz: "2/3", exercise: "—", retest: "1 chờ" },
  { topic: "Lọc WHERE", quiz: "2/3", exercise: "4/4", retest: "1 chờ" },
  { topic: "JOIN", quiz: "2/3", exercise: "5/5 · 7 lần nộp", retest: "—" },
];

function MetricCard({ m, i }: { m: Metric; i: number }) {
  const t = toneMap[m.tone];
  const Icon = t.icon;
  return (
    <FadeUp delay={0.04 * i}>
      <motion.article className="card h-full p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-ink-500">{m.label}</h3>
          <span className={`hidden h-9 w-9 shrink-0 place-items-center rounded-xl sm:grid ${t.chip}`} aria-hidden>
            <Icon className="h-[18px] w-[18px]" />
          </span>
        </div>
        <p className="mt-3 text-[26px] font-semibold leading-none tracking-tight text-ink-900 sm:text-[32px]">
          {m.value}
          {m.total && <span className="text-lg font-semibold text-ink-400">{m.total}</span>}
        </p>
        {m.ratio !== undefined ? (
          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(m.ratio * 100)}
            aria-label={`${m.label}: ${Math.round(m.ratio * 100)}%`}
          >
            <motion.div
              className={`h-full rounded-full ${t.bar}`}
              initial={{ width: 0 }}
              animate={{ width: `${m.ratio * 100}%` }}
              transition={{ duration: 0.9, delay: 0.2 + 0.05 * i, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        ) : (
          <p className={`mt-4 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.value === "—" ? "bg-slate-100 text-ink-400" : t.chip}`}>{m.value === "—" ? "Chưa có dữ liệu" : "Cần chú ý"}</p>
        )}
      </motion.article>
    </FadeUp>
  );
}

type Decision = "pending" | "accepted" | "dismissed";

function SuggestionCard({
  s,
  index,
  total,
  onDecide,
}: {
  s: Suggestion;
  index: number;
  total: number;
  onDecide?: (decision: "accepted" | "rejected") => Promise<{ ok: boolean; version?: number | null }>;
}) {
  const initial: Decision = s.status === "accepted" ? "accepted" : s.status === "rejected" ? "dismissed" : "pending";
  const [state, setState] = useState<Decision>(initial);
  const [newVersion, setNewVersion] = useState<number | null>(null);

  async function decide(next: Decision) {
    if (onDecide) {
      const r = await onDecide(next === "accepted" ? "accepted" : "rejected");
      if (!r.ok) return;
      setNewVersion(r.version ?? null);
    }
    setState(next);
  }
  return (
    <motion.article
      layout
      animate={{ opacity: state === "dismissed" ? 0.55 : 1 }}
      transition={{ duration: 0.25 }}
      aria-labelledby={`sg-${s.id}`}
      className={`overflow-hidden rounded-lg border ${state === "accepted" ? "border-emerald-600 ring-1 ring-emerald-600" : "border-line"}`}
    >
      <div className={`h-full p-5 ${state === "dismissed" ? "bg-muted" : "bg-white"}`}>
        <div className="flex items-start gap-3">
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold ${
              state === "accepted" ? "bg-emerald-50 text-emerald-600" : "bg-brand-soft text-indigo-600"
            }`}
            aria-hidden
          >
            {index + 1}
          </span>
          <h3
            id={`sg-${s.id}`}
            className={`pt-1 text-base font-bold leading-snug ${state === "dismissed" ? "text-ink-500 line-through decoration-ink-400/50" : "text-ink-900"}`}
          >
            <span className="text-indigo-600">Gợi ý {index + 1}/{total} ·</span> {s.title}
          </h3>
        </div>

        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="label-eyebrow">Lý do</dt>
            <dd className="mt-1 text-ink-700">{s.reason}</dd>
          </div>
          <div>
            <dt className="label-eyebrow">Bằng chứng</dt>
            <dd className="mt-1.5 flex flex-wrap gap-1.5">
              {s.evidence.map((e) => (
                <code key={e} className="pill bg-slate-100 font-mono text-[11px] text-ink-700 ring-1 ring-slate-200">
                  {e}
                </code>
              ))}
            </dd>
          </div>
          {s.diff && (
            <div>
              <dt className="label-eyebrow">Xem trước thay đổi</dt>
              <dd className="mt-1.5 flex flex-col gap-1.5 rounded-2xl border border-slate-100 bg-slate-50 p-2.5 font-mono text-[12px] sm:flex-row sm:items-center">
                <span className="rounded-lg bg-rose-50 px-2 py-1 text-rose-700 line-through decoration-rose-400/70">
                  <span className="sr-only">Cũ: </span>− {s.diff.from}
                </span>
                <ArrowRight className="hidden h-4 w-4 shrink-0 text-ink-400 sm:block" aria-hidden />
                <span className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700">
                  <span className="sr-only">Mới: </span>+ {s.diff.to}
                </span>
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-5" aria-live="polite">
            {state === "pending" ? (
              <motion.div
                key="actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-2 sm:flex-row sm:justify-end"
              >
                <button type="button" className="btn-secondary" onClick={() => void decide("dismissed")}>
                  <X className="h-4 w-4" aria-hidden />
                  Bỏ qua
                </button>
                <button type="button" className="btn-primary" onClick={() => void decide("accepted")}>
                  <Check className="h-4 w-4" aria-hidden />
                  Chấp nhận
                </button>
              </motion.div>
            ) : state === "accepted" ? (
              <motion.p
                key="accepted"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                Đã chấp nhận{onDecide ? (newVersion ? ` · tạo kế hoạch phiên bản ${newVersion}` : " · đã tạo bản nháp kế hoạch mới") : " · tạo kế hoạch phiên bản 4"}
              </motion.p>
            ) : (
              <motion.p
                key="dismissed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2.5 text-sm font-semibold text-ink-500"
              >
                <X className="h-4 w-4 shrink-0" aria-hidden />
                Đã bỏ qua
              </motion.p>
            )}
        </div>
      </div>
    </motion.article>
  );
}

type ApiReport = {
  start: string;
  label: string;
  generated: boolean;
  logCount?: number;
  snapshot?: { total: number; done: number; planned: number; logged: number; overdue: number; missingDays: number; logCount: number };
  narrative?: string | null;
  suggestions?: Suggestion[];
};

/** Chuyển ảnh chụp SQL từ NestJS thành dữ liệu hiển thị. */
function toWeekly(r: ApiReport): WeeklyReport {
  const s = r.snapshot;
  const has = !!s && s.logCount > 0;
  return {
    key: r.start,
    label: r.label,
    title: `Báo cáo tuần ${r.label} · Cơ sở dữ liệu`,
    logCount: s?.logCount ?? 0,
    metrics: [
      { label: "Nhiệm vụ hoàn thành", value: has ? String(s.done) : "—", total: has ? `/${s.total}` : undefined, ratio: has && s.total ? s.done / s.total : undefined, tone: "indigo" },
      { label: "Phút đã ghi / dự kiến", value: has ? String(s.logged) : "—", total: has ? `/${s.planned}` : undefined, ratio: has && s.planned ? Math.min(s.logged / s.planned, 1) : undefined, tone: "cyan" },
      { label: "Nhiệm vụ quá hạn", value: has ? String(s.overdue) : "—", tone: "rose" },
      { label: "Không có nhật ký", value: has ? `${s.missingDays} ngày` : "—", tone: "amber" },
    ],
    summary: r.narrative ?? null,
    suggestions: r.suggestions ?? [],
  };
}

export function ReportView() {
  const { ready, setup, account } = useDemo();
  if (!ready) return null;
  // RPT-02: không có kế hoạch → "không có kế hoạch hoạt động"; có kế hoạch nhưng chưa có nhật ký → "chưa đủ dữ liệu".
  if (!setup.plan)
    return (
      <EmptyState
        icon={<BarChart3 className="h-8 w-8" />}
        title="Không có kế hoạch hoạt động"
        text="Báo cáo tuần được tính từ nhật ký của các nhiệm vụ trong kế hoạch. Hoàn tất thiết lập để có kế hoạch tuần đầu tiên."
        href="/"
        action="Xem các bước thiết lập"
      />
    );
  return <ReportBody key={account} initial={account === "lan" ? [reports[1]] : reports} />;
}

function ReportBody({ initial }: { initial: WeeklyReport[] }) {
  const toast = useToast();
  const [list, setList] = useState<WeeklyReport[]>(initial);
  const [live, setLive] = useState(false);
  const [weekKey, setWeekKey] = useState(initial[0].key);
  const [generating, setGenerating] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<Record<string, boolean>>({ [initial[0].key]: true });

  // Báo cáo đọc từ PostgreSQL: số liệu tính bằng SQL ở NestJS, không lấy từ LLM.
  useEffect(() => {
    (async () => {
      const weeks = await api<{ start: string; label: string }[]>("/reports");
      if (!weeks) return;
      const rows = await Promise.all(weeks.map((w) => api<ApiReport>(`/reports/${w.start}`)));
      if (rows.some((r) => !r)) return;
      const data = rows as ApiReport[];
      setList(data.map(toWeekly));
      const gen = Object.fromEntries(data.map((r) => [r.start, r.generated]));
      setGeneratedAt(gen);
      setWeekKey(data.find((r) => r.generated)?.start ?? data[0].start);
      setLive(true);
    })();
  }, []);

  const report = list.find((r) => r.key === weekKey) ?? list[0];
  const shown = generatedAt[report.key];
  const noData = report.logCount === 0;

  async function generate() {
    setGenerating(true);
    if (live) {
      const r = await api<ApiReport>(`/reports/${report.key}/generate`, { method: "POST" });
      setGenerating(false);
      if (!r) return toast.show("Không tạo được báo cáo.");
      const w = toWeekly(r);
      setList((l) => l.map((x) => (x.key === w.key ? w : x)));
      setGeneratedAt((g) => ({ ...g, [w.key]: true }));
      return toast.show(w.logCount === 0 ? "Tuần này chưa có nhật ký nào, chưa đủ dữ liệu để báo cáo" : `Đã tính lại số liệu từ ${w.logCount} nhật ký học`);
    }
    window.setTimeout(() => {
      setGenerating(false);
      setGeneratedAt((g) => ({ ...g, [weekKey]: true }));
      toast.show(noData ? "Tuần này chưa có nhật ký nào, chưa đủ dữ liệu để báo cáo" : `Đã tạo báo cáo từ ${report.logCount} nhật ký học`);
    }, 1000);
  }

  async function decide(id: string, decision: "accepted" | "rejected") {
    if (!live) return { ok: true };
    const { data, error } = await apiOrError<{ status: string; newPlanVersion?: number | null }>(`/suggestions/${id}/decision`, {
      method: "POST",
      body: { decision },
    });
    if (error) {
      toast.show(error);
      return { ok: false };
    }
    return { ok: true, version: data?.newPlanVersion ?? null };
  }

  return (
    <div className="space-y-5">
      <FadeUp>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-ink-900">{report.title}</h2>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-ink-500">
              <Database className="h-3.5 w-3.5 text-indigo-500" aria-hidden />
              {reportNote}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div role="tablist" aria-label="Chọn tuần" className="flex rounded-lg border border-line-strong p-1">
              {list.map((r) => (
                <button
                  key={r.key}
                  role="tab"
                  type="button"
                  aria-selected={weekKey === r.key}
                  onClick={() => setWeekKey(r.key)}
                  className={`focus-ring flex-1 whitespace-nowrap rounded px-3 py-1.5 text-sm font-semibold transition-colors ${
                    weekKey === r.key ? "bg-indigo-600 text-white" : "text-ink-700 hover:bg-indigo-50"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button type="button" className="btn-primary" onClick={generate} disabled={generating}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
              {generating ? "Đang tạo…" : shown ? "Tạo lại báo cáo" : "Tạo báo cáo"}
            </button>
          </div>
        </div>
      </FadeUp>

      {!shown ? (
        <FadeUp delay={0.05}>
          <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
            <BarChart3 className="h-8 w-8 text-indigo-600" aria-hidden />
            <p className="text-lg font-semibold text-ink-900">Chưa có báo cáo cho tuần {report.label}</p>
            <p className="max-w-md text-sm text-ink-500">Bấm “Tạo báo cáo” để tính số liệu 7 ngày từ nhật ký học của bạn.</p>
          </div>
        </FadeUp>
      ) : (
        <>
          <section aria-label="Số liệu tuần" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {report.metrics.map((m, i) => (
              <MetricCard key={`${report.key}-${m.label}`} m={m} i={i} />
            ))}
          </section>

          {!noData && (
            <section aria-labelledby="practice-heading" className="card overflow-hidden">
              <h2 id="practice-heading" className="px-5 pt-5 text-base font-semibold text-ink-900 sm:px-6">
                Luyện tập và thực hành theo chủ đề
              </h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="bg-muted text-ink-500">
                    <tr>
                      {["Chủ đề", "Bài luyện", "Thực hành SQL", "Làm lại"].map((h) => (
                        <th key={h} scope="col" className="px-5 py-2.5 font-semibold sm:px-6">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {practiceByTopic.map((r) => (
                      <tr key={r.topic} className="border-t border-line">
                        <th scope="row" className="px-5 py-3 font-semibold text-ink-900 sm:px-6">
                          {r.topic}
                        </th>
                        <td className="px-5 py-3 text-ink-700 sm:px-6">đúng {r.quiz}</td>
                        <td className="px-5 py-3 text-ink-700 sm:px-6">{r.exercise === "—" ? "—" : `đạt ${r.exercise}`}</td>
                        <td className="px-5 py-3 text-ink-700 sm:px-6">{r.retest}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <FadeUp delay={0.15}>
            <section aria-labelledby="insight-heading" className="card p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-indigo-600" aria-hidden />
                <h2 id="insight-heading" className="text-base font-semibold text-ink-900">
                  Nhận xét
                </h2>
                <span className="pill bg-slate-100 text-ink-500">Do AI viết từ số liệu</span>
              </div>
              {noData ? (
                <p className="relative mt-3 flex max-w-3xl items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-[15px] leading-7 text-amber-900 ring-1 ring-amber-200">
                  <NotebookTabs className="mt-1.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
                  Chưa đủ dữ liệu: tuần này chưa có nhật ký học nào, nên PersoAI không nhận xét tiến độ và không đưa ra gợi ý.
                </p>
              ) : (
                <p className="relative mt-3 max-w-3xl text-[15px] leading-7 text-ink-700">{report.summary}</p>
              )}
            </section>
          </FadeUp>

          {!noData && (
            <FadeUp delay={0.2}>
              <section aria-labelledby="sg-heading">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 text-amber-600" aria-hidden>
                      <Lightbulb className="h-4 w-4" />
                    </span>
                    <h2 id="sg-heading" className="text-base font-bold text-ink-900">
                      Gợi ý điều chỉnh
                    </h2>
                  </div>
                  <span className="pill bg-white text-ink-500 ring-1 ring-slate-200">{report.suggestions.length} gợi ý · tối đa 3</span>
                </div>
                <div className="mt-3 grid gap-4 lg:grid-cols-2">
                  {report.suggestions.map((s, i) => (
                    <SuggestionCard key={`${report.key}-${s.id}`} s={s} index={i} total={report.suggestions.length} onDecide={(d) => decide(s.id, d)} />
                  ))}
                </div>
                <p className="mt-3 text-xs text-ink-400">Kế hoạch chỉ thay đổi khi bạn chấp nhận; mỗi gợi ý được chấp nhận tạo một phiên bản kế hoạch mới.</p>
              </section>
            </FadeUp>
          )}
        </>
      )}
    </div>
  );
}
