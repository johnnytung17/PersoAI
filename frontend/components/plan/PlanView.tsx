"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarCheck2,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Coffee,
  FileText,
  Flag,
  GraduationCap,
  History,
  Lock,
  MousePointerClick,
  Pencil,
  Target,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, apiOrError, validatePlan } from "@/lib/api";
import { useDemo } from "@/lib/demo";
import { EmptyState } from "@/components/ui/EmptyState";
import { FadeUp } from "@/components/ui/FadeUp";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { plan, planDays, planVersions, type PlanDay, type PlanTask, type PlanVersion } from "@/lib/mock";
import { PlanWizard } from "./PlanWizard";

/* ---------- Bộ kiểm tra quy tắc (chạy lại sau mỗi lần sửa) ---------- */

type Check = { id: string; ok: boolean; blocking: boolean; label: string; detail?: string };

function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function validate(days: PlanDay[], budget: number): Check[] {
  const tasks = days.flatMap((d) => d.tasks.map((t) => ({ t, d })));
  const total = tasks.reduce((s, x) => s + x.t.minutes, 0);
  const missing = tasks.filter((x) => !x.t.title.trim() || !(x.t.minutes > 0));
  const clashes = tasks.filter(({ t, d }) =>
    d.busy.some((b) => {
      if (b.allDay) return true;
      if (!t.time || !b.start || !b.end) return false;
      const s = toMin(t.time);
      const e = s + t.minutes;
      return s < toMin(b.end) && e > toMin(b.start);
    }),
  );
  const short = tasks.filter((x) => x.t.minutes > 0 && x.t.minutes < 15);

  const checks: Check[] = [
    { id: "budget", ok: total <= budget, blocking: true, label: `Ngân sách ${total}/${budget} phút` },
    {
      id: "busy",
      ok: clashes.length === 0,
      blocking: true,
      label: clashes.length === 0 ? "Không trùng giờ bận" : "Trùng giờ bận",
      detail: clashes.length ? clashes.map(({ t, d }) => `${t.title} (${d.short})`).join(", ") : undefined,
    },
    { id: "deadline", ok: true, blocking: true, label: "Trước hạn chót" },
    {
      id: "short",
      ok: short.length === 0,
      blocking: false,
      label: short.length === 0 ? "Không có nhiệm vụ dưới 15 phút" : "Có nhiệm vụ dưới 15 phút",
      detail: short.length ? short.map(({ t, d }) => `${t.title}, ${t.minutes} phút, ${d.full}`).join("; ") : undefined,
    },
  ];
  if (missing.length) {
    checks.splice(3, 0, { id: "fields", ok: false, blocking: true, label: "Thiếu thông tin nhiệm vụ", detail: `${missing.length} nhiệm vụ thiếu tên hoặc số phút` });
  }
  return checks;
}

/* ---------- Thành phần lưới tuần ---------- */

function TaskChip({ task, warn, clash, selected, onSelect }: { task: PlanTask; warn: boolean; clash: boolean; selected: boolean; onSelect: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`focus-ring w-full rounded-lg border p-3 text-left transition-shadow ${
        selected
          ? "border-indigo-600 bg-indigo-600 text-white"
          : clash
            ? "border-rose-400 bg-rose-50 text-ink-900"
            : warn
              ? "border-dashed border-amber-400 bg-amber-50 text-ink-900 hover:shadow-lift"
              : "border-line bg-white text-ink-900 hover:shadow-lift"
      }`}
    >
      <span className="flex items-start justify-between gap-1.5">
        <span className="text-[13px] font-semibold leading-snug">{task.title}</span>
        {(warn || clash) && (
          <AlertTriangle
            className={`mt-0.5 h-4 w-4 shrink-0 ${selected ? "text-amber-200" : clash ? "text-rose-500" : "text-amber-500"}`}
            aria-label={clash ? "Trùng giờ bận" : "Cảnh báo: dưới 15 phút"}
          />
        )}
      </span>
      <span className={`mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold ${selected ? "text-white/90" : "text-ink-500"}`}>
        <span className={`pill px-2 ${selected ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-700"}`}>
          <Clock className="h-3 w-3" aria-hidden />
          {task.minutes} phút
        </span>
        {task.time && <span>{task.time}</span>}
      </span>
    </motion.button>
  );
}

function DayColumn({ day, clashIds, selectedId, onSelect }: { day: PlanDay; clashIds: Set<string>; selectedId: string | null; onSelect: (id: string) => void }) {
  const total = day.tasks.reduce((s, t) => s + t.minutes, 0);
  return (
    <div className={`flex min-w-0 flex-col rounded-lg border p-3 ${day.rest ? "border-dashed border-line-strong bg-white" : "border-line bg-muted"}`}>
      <div className="flex items-baseline justify-between gap-2 px-1">
        <h3 className="text-sm font-bold text-ink-900">
          {day.short} <span className="font-medium text-ink-400">{day.date}</span>
          <span className="sr-only"> ({day.full})</span>
        </h3>
        {total > 0 && <span className="text-[11px] font-semibold text-ink-400">{total}′</span>}
      </div>
      <div className="mt-3 flex flex-1 flex-col gap-2">
        {day.busy.map((b) => (
          <div
            key={b.label}
            className="flex items-start gap-1.5 rounded-xl bg-slate-100 px-2.5 py-2 text-[12px] font-medium text-ink-500"
            style={{ backgroundImage: "repeating-linear-gradient(135deg, rgba(100,108,143,0.06) 0 6px, transparent 6px 12px)" }}
          >
            <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            <span>
              <span className="sr-only">Giờ bận: </span>
              {b.label}
            </span>
          </div>
        ))}
        {day.tasks.map((t) => (
          <TaskChip
            key={t.id}
            task={t}
            warn={t.minutes < 15}
            clash={clashIds.has(t.id)}
            selected={selectedId === t.id}
            onSelect={() => onSelect(t.id)}
          />
        ))}
        {day.rest && day.tasks.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl py-6 text-center text-ink-400">
            <Coffee className="h-6 w-6" aria-hidden />
            <span className="text-sm font-semibold">Nghỉ</span>
          </div>
        )}
      </div>
    </div>
  );
}

const versionStyle: Record<PlanVersion["status"], string> = {
  "Bản nháp": "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  "Đang áp dụng": "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  "Đã thay thế": "bg-slate-100 text-ink-500",
  "Đã bỏ": "bg-slate-100 text-ink-400 line-through",
};

/* ---------- Màn hình ---------- */

type EditForm = { id: string; title: string; minutes: string; day: string; time: string };
type PlanMeta = { id: number | null; version: number; title: string; goal: string; budget: number };
type PlanResponse = { plan: PlanMeta & { status: string }; days: PlanDay[]; versions: PlanVersion[] };

export function PlanView() {
  const { ready, setup, account, complete } = useDemo();
  if (!ready) return null;
  if (!setup.roadmap)
    return (
      <EmptyState
        icon={<CalendarPlus className="h-8 w-8" />}
        title="Không có kế hoạch hoạt động"
        text="Kế hoạch tuần được soạn từ cột mốc của lộ trình đã xác nhận. Hãy chọn hướng học và xác nhận lộ trình trước."
        href={!setup.survey ? "/khao-sat" : !setup.course ? "/mon-hoc" : "/lo-trinh"}
        action={!setup.survey ? "Làm khảo sát" : !setup.course ? "Thêm môn học" : "Chọn hướng học"}
      />
    );
  // Người mới: phiên bản 1 là bản nháp đầu tiên; xác nhận xong là hoàn tất thiết lập.
  const firstVersions: PlanVersion[] | undefined =
    account === "lan" ? [{ version: 1, status: setup.plan ? "Đang áp dụng" : "Bản nháp", date: "05/11", note: "Bản đầu tiên do AI soạn từ cột mốc tuần 1 của lộ trình" }] : undefined;
  return <PlanBody key={account} initialVersions={firstVersions} onConfirmed={() => complete("plan")} showNext={account === "lan" && !setup.plan} />;
}

function PlanBody({ initialVersions, onConfirmed, showNext }: { initialVersions?: PlanVersion[]; onConfirmed: () => void; showNext: boolean }) {
  const toast = useToast();
  const [days, setDays] = useState<PlanDay[]>(planDays);
  const [versions, setVersions] = useState<PlanVersion[]>(initialVersions ?? planVersions);
  const [meta, setMeta] = useState<PlanMeta>({ id: null, version: initialVersions ? 1 : plan.version, title: plan.title, goal: plan.goal, budget: plan.budget });
  const [justConfirmed, setJustConfirmed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditForm | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const live = meta.id !== null;

  function apply(d: PlanResponse) {
    setDays(d.days);
    setVersions(d.versions);
    setMeta({ id: d.plan.id, version: d.plan.version, title: d.plan.title, goal: d.plan.goal, budget: d.plan.budget });
    return d.days;
  }

  // Kế hoạch tuần đọc từ PostgreSQL; khi API chưa sẵn sàng thì dùng dữ liệu mẫu.
  const reload = useCallback(async () => {
    const d = await api<PlanResponse>("/plan/current");
    return d ? apply(d) : null;
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const draft = versions[0];
  const confirmed = draft.status === "Đang áp dụng";
  const localChecks = useMemo(() => validate(days, meta.budget), [days, meta.budget]);
  // Quy tắc chạy ở NestJS; nếu API không phản hồi thì dùng bản kiểm tra cục bộ cùng logic.
  const [remote, setRemote] = useState<{ days: PlanDay[]; checks: Check[] } | null>(null);
  useEffect(() => {
    let alive = true;
    validatePlan(days, meta.budget).then((c) => alive && setRemote(c ? { days, checks: c } : null));
    return () => {
      alive = false;
    };
  }, [days, meta.budget]);
  const fromServer = remote !== null && remote.days === days;
  const checks = fromServer ? remote.checks : localChecks;
  const blocked = checks.some((c) => c.blocking && !c.ok);
  const clashIds = useMemo(() => {
    const ids = new Set<string>();
    for (const d of days)
      for (const t of d.tasks)
        if (
          d.busy.some((b) => b.allDay || (t.time && b.start && b.end && toMin(t.time) < toMin(b.end) && toMin(t.time) + t.minutes > toMin(b.start)))
        )
          ids.add(t.id);
    return ids;
  }, [days]);

  const selected = useMemo(() => {
    for (const d of days) {
      const t = d.tasks.find((x) => x.id === selectedId);
      if (t) return { task: t, day: d };
    }
    return null;
  }, [selectedId, days]);

  const detailRef = useRef<HTMLElement>(null);

  function select(id: string) {
    const willSelect = selectedId !== id;
    setSelectedId(willSelect ? id : null);
    if (willSelect && window.matchMedia("(max-width: 639px)").matches) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.setTimeout(() => detailRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }), 50);
    }
  }

  async function confirm() {
    if (blocked) return;
    if (live) {
      const { error } = await apiOrError(`/plan/${meta.id}/confirm`, { method: "POST" });
      if (error) return toast.show(error);
      await reload();
    } else {
      setVersions((vs) => vs.map((v, i) => (i === 0 ? { ...v, status: "Đang áp dụng" } : v.status === "Đang áp dụng" ? { ...v, status: "Đã thay thế" } : v)));
    }
    if (showNext) setJustConfirmed(true);
    onConfirmed();
    toast.show(`Đã xác nhận, kế hoạch phiên bản ${draft.version} đang áp dụng`);
  }

  function openEdit() {
    if (!selected) {
      toast.show("Chọn một thẻ nhiệm vụ để sửa");
      return;
    }
    const { task, day } = selected;
    setEdit({ id: task.id, title: task.title, minutes: String(task.minutes), day: day.key, time: task.time ?? "" });
  }

  function report(next: PlanDay[]) {
    const fails = validate(next, meta.budget).filter((c) => c.blocking && !c.ok);
    toast.show(fails.length ? `Đã kiểm tra lại: ${fails.map((f) => f.label.toLowerCase()).join(", ")}` : "Đã kiểm tra lại: mọi quy tắc chặn đều đạt");
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    if (live) {
      const day = days.find((d) => d.key === edit.day);
      const { data, error } = await apiOrError<{ taskId: string }>(`/tasks/${edit.id}`, {
        method: "PUT",
        body: { title: edit.title, minutes: Number(edit.minutes), date: day?.iso, time: edit.time },
      });
      if (error || !data) return toast.show(error ?? "Không lưu được nhiệm vụ.");
      setEdit(null);
      const next = await reload();
      setSelectedId(data.taskId);
      if (next) report(next);
      return;
    }
    const original = days.flatMap((d) => d.tasks).find((x) => x.id === edit.id);
    if (!original) return;
    const moved: PlanTask = { ...original, title: edit.title.trim(), minutes: Number(edit.minutes), time: edit.time || undefined };
    const withTask = days.map((d) => {
      const rest = d.tasks.filter((x) => x.id !== edit.id);
      return { ...d, tasks: d.key === edit.day ? [...rest, moved] : rest };
    });
    setDays(withTask);
    setEdit(null);
    // Sửa kế hoạch đã áp dụng sẽ tạo bản nháp mới, giữ nguyên ảnh chụp cũ.
    if (confirmed) {
      setVersions((vs) => [{ version: vs[0].version + 1, status: "Bản nháp", date: "05/11", note: "Sửa nhiệm vụ giữa tuần" }, ...vs]);
    }
    report(withTask);
  }

  async function onNewDraft(version: number) {
    setSelectedId(null);
    if (live) {
      const d = await api<PlanResponse>("/plan/drafts", { method: "POST" });
      if (d) {
        apply(d);
        return toast.show(`Bản nháp phiên bản ${d.plan.version} đã sẵn sàng để bạn xem và sửa`);
      }
    }
    setVersions((vs) => [
      { version, status: "Bản nháp", date: "05/11", note: "Bản nháp mới do AI soạn sau 3 câu hỏi làm rõ" },
      ...vs.map((v) => (v.status === "Bản nháp" ? { ...v, status: "Đã bỏ" as const } : v)),
    ]);
    setDays(planDays);
    toast.show(`Bản nháp phiên bản ${version} đã sẵn sàng để bạn xem và sửa`);
  }

  return (
    <div className="space-y-5">
      {(showNext || justConfirmed) && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border-l-4 border-indigo-600 bg-indigo-50 px-4 py-3 text-sm" role="status">
          <span className="min-w-[220px] flex-1 text-ink-900">
            {justConfirmed
              ? "Thiết lập đã xong. Nhiệm vụ đầu tiên đang chờ bạn ở trang Hôm nay."
              : "Bước 4/4: xem bản nháp, sửa nếu cần rồi bấm Xác nhận kế hoạch. Kế hoạch chỉ được lưu khi mọi quy tắc chặn đều đạt."}
          </span>
          {justConfirmed && (
            <Link href="/" className="btn-primary px-3 py-1.5">
              Bắt đầu buổi học
            </Link>
          )}
        </div>
      )}
      <FadeUp>
        <div className="card p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold text-ink-900">{meta.title}</h2>
                <span
                  className={`pill ${confirmed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}
                  role="status"
                >
                  {confirmed ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Đang áp dụng · phiên bản {draft.version}
                    </>
                  ) : (
                    <>
                      <Pencil className="h-3 w-3" aria-hidden /> Bản nháp · phiên bản {draft.version}
                    </>
                  )}
                </span>
              </div>
              <p className="mt-2 flex items-start gap-2 text-sm font-medium text-ink-700">
                <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" aria-hidden />
                <span>
                  <span className="text-ink-500">Mục tiêu: </span>
                  {meta.goal}
                </span>
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button type="button" className="btn-ghost" onClick={() => setWizardOpen(true)}>
                <CalendarPlus className="h-4 w-4" aria-hidden />
                Lập kế hoạch mới
              </button>
              <button type="button" className="btn-secondary" onClick={openEdit}>
                <Pencil className="h-4 w-4" aria-hidden />
                Sửa nhiệm vụ
              </button>
              <button type="button" className="btn-primary" onClick={confirm} disabled={confirmed || blocked}>
                <CalendarCheck2 className="h-4 w-4" aria-hidden />
                {confirmed ? "Đã xác nhận" : "Xác nhận kế hoạch"}
              </button>
            </div>
          </div>
        </div>
      </FadeUp>

      <FadeUp delay={0.05}>
        <section aria-labelledby="rules-heading" className="card p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="rules-heading" className="label-eyebrow">
              Kiểm tra quy tắc
              <span className="ml-2 normal-case tracking-normal text-ink-400">
                · {fromServer ? "máy chủ NestJS" : "kiểm tra cục bộ"}
              </span>
            </h2>
            {blocked && !confirmed && (
              <p className="text-xs font-semibold text-rose-600" role="alert">
                Chỉ xác nhận được khi mọi quy tắc chặn đều đạt.
              </p>
            )}
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {checks.map((r) => {
              const tone = r.ok ? "ok" : r.blocking ? "fail" : "warn";
              return (
                <li
                  key={r.id}
                  className={`flex items-start gap-2.5 rounded-2xl px-3 py-2.5 text-sm ${
                    tone === "ok" ? "bg-emerald-50/70 text-emerald-900" : tone === "fail" ? "bg-rose-50 text-rose-900 ring-1 ring-rose-200" : "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
                  }`}
                >
                  {tone === "ok" ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-label="Đạt" />
                  ) : tone === "fail" ? (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" aria-label="Không đạt, chặn xác nhận" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-label="Cảnh báo" />
                  )}
                  <span className="min-w-0">
                    <span className="font-semibold">{r.label}</span>
                    {r.detail && <span className="mt-0.5 block text-xs opacity-80">({r.detail})</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </FadeUp>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <FadeUp delay={0.1} className="min-w-0">
          <section aria-labelledby="week-heading" className="min-w-0">
            <h2 id="week-heading" className="sr-only">
              Lưới 7 ngày
            </h2>
            <div className="scrollbar-thin -mx-1 overflow-x-auto px-1 pb-2 sm:pb-3" role="region" aria-label="Lịch tuần, có thể cuộn ngang" tabIndex={0}>
              <div className="grid grid-cols-1 gap-3 sm:min-w-[1000px] sm:grid-cols-7">
                {days.map((d) => (
                  <DayColumn key={d.key} day={d} clashIds={clashIds} selectedId={selectedId} onSelect={select} />
                ))}
              </div>
            </div>
          </section>
        </FadeUp>

        <FadeUp delay={0.15} className="min-w-0 space-y-5">
          <aside ref={detailRef} aria-labelledby="detail-heading" aria-live="polite" className="card scroll-mt-24 p-5">
            <h2 id="detail-heading" className="label-eyebrow">
              Chi tiết nhiệm vụ
            </h2>
            {selected ? (
              <div key={selected.task.id}>
                <h3 className="mt-2 text-lg font-bold text-ink-900">{selected.task.title}</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="pill bg-indigo-50 text-indigo-700">
                    {selected.day.full} {selected.day.date}
                  </span>
                  <span className="pill bg-cyan-50 text-cyan-700">{selected.task.minutes} phút</span>
                  {selected.task.time && <span className="pill bg-slate-100 text-ink-500">{selected.task.time}</span>}
                  {selected.task.minutes < 15 && <span className="pill bg-amber-100 text-amber-800">⚠ Dưới 15 phút</span>}
                </div>
                <dl className="mt-4 grid gap-3 sm:grid-cols-3 2xl:grid-cols-1">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <dt className="flex items-center gap-1.5 text-xs font-semibold text-ink-500">
                      <Target className="h-3.5 w-3.5 text-violet-500" aria-hidden /> Đầu ra
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-ink-900">{selected.task.output}</dd>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <dt className="flex items-center gap-1.5 text-xs font-semibold text-ink-500">
                      <Flag className="h-3.5 w-3.5 text-cyan-500" aria-hidden /> Tiêu chí hoàn thành
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-ink-900">{selected.task.criteria}</dd>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <dt className="flex items-center gap-1.5 text-xs font-semibold text-ink-500">
                      <FileText className="h-3.5 w-3.5 text-indigo-500" aria-hidden /> Tài liệu
                    </dt>
                    <dd className="mt-1 break-words text-sm font-semibold text-indigo-700">{selected.task.material}</dd>
                  </div>
                </dl>
                <button type="button" className="btn-secondary mt-4 w-full" onClick={openEdit}>
                  <Pencil className="h-4 w-4" aria-hidden />
                  Sửa nhiệm vụ này
                </button>
              </div>
            ) : (
              <div className="mt-3 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center">
                <MousePointerClick className="h-6 w-6 text-indigo-400" aria-hidden />
                <p className="text-sm font-medium text-ink-500">Chọn một thẻ nhiệm vụ để xem đầu ra, tiêu chí hoàn thành và tài liệu.</p>
              </div>
            )}
          </aside>

          <section aria-labelledby="history-heading" className="card p-5">
            <button
              type="button"
              onClick={() => setShowHistory((s) => !s)}
              aria-expanded={showHistory}
              className="focus-ring flex w-full items-center justify-between gap-2 rounded-xl text-left"
            >
              <h2 id="history-heading" className="flex items-center gap-2 text-sm font-bold text-ink-900">
                <History className="h-4 w-4 text-indigo-500" aria-hidden />
                Lịch sử phiên bản
              </h2>
              <span className="text-xs font-semibold text-indigo-600">{showHistory ? "Ẩn" : `${versions.length} phiên bản`}</span>
            </button>
            {showHistory && (
              <ol className="mt-3 space-y-2">
                {versions.map((v) => (
                  <li key={v.version} className="rounded-2xl bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-bold text-ink-900">Phiên bản {v.version}</span>
                      <span className={`pill ${versionStyle[v.status]}`}>{v.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-ink-500">
                      {v.date} · {v.note}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </FadeUp>
      </div>

      <Modal
        open={edit !== null}
        onClose={() => setEdit(null)}
        title="Sửa nhiệm vụ"
        description="Sau khi lưu, bộ kiểm tra quy tắc sẽ chạy lại."
        icon={<Pencil className="h-5 w-5" />}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setEdit(null)}>
              Huỷ
            </button>
            <button type="submit" form="edit-form" className="btn-primary">
              Lưu và kiểm tra lại
            </button>
          </>
        }
      >
        {edit && (
          <form id="edit-form" onSubmit={saveEdit} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="ed-title" className="text-sm font-semibold text-ink-700">
                Tên nhiệm vụ
              </label>
              <input
                id="ed-title"
                value={edit.title}
                onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                className="focus-ring mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="ed-day" className="text-sm font-semibold text-ink-700">
                Ngày
              </label>
              <select
                id="ed-day"
                value={edit.day}
                onChange={(e) => setEdit({ ...edit, day: e.target.value })}
                className="focus-ring mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              >
                {days.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.full} {d.date}
                    {d.busy.some((b) => b.allDay) ? " (bận cả ngày)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ed-time" className="text-sm font-semibold text-ink-700">
                Giờ bắt đầu
              </label>
              <input
                id="ed-time"
                type="time"
                value={edit.time}
                onChange={(e) => setEdit({ ...edit, time: e.target.value })}
                className="focus-ring mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="ed-min" className="text-sm font-semibold text-ink-700">
                Số phút
              </label>
              <input
                id="ed-min"
                type="number"
                min={0}
                max={600}
                value={edit.minutes}
                onChange={(e) => setEdit({ ...edit, minutes: e.target.value })}
                className="focus-ring mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              />
            </div>
          </form>
        )}
      </Modal>

      <PlanWizard open={wizardOpen} onClose={() => setWizardOpen(false)} nextVersion={versions[0].version + 1} onDone={onNewDraft} />
    </div>
  );
}
