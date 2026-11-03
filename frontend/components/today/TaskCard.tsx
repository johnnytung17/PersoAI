"use client";

import { AlarmClock, CheckCircle2, Clock, FileText, Flag, NotebookPen, Target } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { api, apiOrError } from "@/lib/api";
import { logStatuses, otherTasksToday, todayTask as mockTask, todayTaskId, weekProgress, type LogStatus, type OtherTask } from "@/lib/mock";

export type Task = typeof mockTask & { id: string };
type Other = OtherTask & { id: string };
type TodayResponse = { weekLabel: string; task: Task | null; others: (Omit<Other, "status"> & { status: string })[] };

const statusStyle: Record<string, string> = {
  "Đang làm": "bg-amber-50 text-amber-800",
  "Chưa làm": "bg-slate-100 text-ink-500",
  Xong: "bg-emerald-50 text-emerald-700",
  "Đã xong": "bg-emerald-50 text-emerald-700",
  "Bỏ qua": "bg-slate-100 text-ink-500",
};

/** Đọc nhiệm vụ hôm nay từ PostgreSQL; API chưa sẵn sàng thì giữ dữ liệu mẫu. */
export function useToday() {
  const [task, setTask] = useState<Task>({ ...mockTask, id: todayTaskId });
  const [others, setOthers] = useState<Other[]>(otherTasksToday.map((t, i) => ({ ...t, id: `mock-${i}` })));
  const [weekLabel, setWeekLabel] = useState(weekProgress);
  const [live, setLive] = useState(false);

  const load = useCallback(async () => {
    const d = await api<TodayResponse>("/today");
    if (!d || !d.task) return;
    setTask(d.task);
    setOthers(d.others.filter((o) => o.status === "Đã xong" || o.status === "Quá hạn") as Other[]);
    setWeekLabel(d.weekLabel);
    setLive(true);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { task, setTask, others, weekLabel, live, reload: load };
}

export function TaskBanner({ task, done, total }: { task: Task; done: number; total: number }) {
  return (
    <section aria-labelledby="task-heading" className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="label-eyebrow">Nhiệm vụ hôm nay · Cơ sở dữ liệu</p>
          <h2 id="task-heading" className="mt-1 text-2xl font-semibold text-ink-900">
            {task.title}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-700">
            <li className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-ink-500" aria-hidden />
              {task.minutes} phút
            </li>
            <li className="flex items-center gap-1.5">
              <Target className="h-4 w-4 text-ink-500" aria-hidden />
              <span className="sr-only">Đầu ra: </span>
              {task.output}
            </li>
            <li className="flex items-center gap-1.5">
              <Flag className="h-4 w-4 text-ink-500" aria-hidden />
              <span className="sr-only">Tiêu chí: </span>
              {task.criteria}
            </li>
            <li className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-ink-500" aria-hidden />
              <span className="font-semibold text-indigo-600">{task.material}</span>
            </li>
          </ul>
        </div>
        <span className={`pill ${statusStyle[task.status] ?? statusStyle["Đang làm"]}`}>
          <span className="sr-only">Trạng thái: </span>
          {task.status}
        </span>
      </div>
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-semibold text-ink-500">
          <span>Tiến độ buổi học</span>
          <span>
            {done}/{total} bước
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total} aria-label="Tiến độ buổi học">
          <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${(done / total) * 100}%` }} />
        </div>
      </div>
    </section>
  );
}

function LogFields({
  idPrefix,
  status,
  setStatus,
  minutes,
  setMinutes,
  note,
  setNote,
  submitted,
  setSubmitted,
}: {
  idPrefix: string;
  status: LogStatus;
  setStatus: (s: LogStatus) => void;
  minutes: string;
  setMinutes: (m: string) => void;
  note: string;
  setNote: (n: string) => void;
  submitted?: boolean;
  setSubmitted?: (v: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="text-sm font-semibold text-ink-700">Trạng thái</legend>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:max-w-md">
          {logStatuses.map((s) => (
            <label
              key={s}
              className={`flex cursor-pointer items-center justify-center rounded-lg border px-2 py-2.5 text-sm font-semibold transition-colors focus-within:ring-2 focus-within:ring-indigo-600 ${
                status === s ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-line-strong text-ink-700 hover:border-ink-500"
              }`}
            >
              <input type="radio" name={`${idPrefix}-status`} value={s} checked={status === s} onChange={() => setStatus(s)} className="sr-only" />
              {s}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="sm:max-w-xs">
        <label htmlFor={`${idPrefix}-minutes`} className="text-sm font-semibold text-ink-700">
          Số phút thực tế
        </label>
        <div className="relative mt-1.5">
          <input
            id={`${idPrefix}-minutes`}
            type="number"
            inputMode="numeric"
            min={0}
            max={600}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="field pr-14"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">phút</span>
        </div>
      </div>
      {setSubmitted && (
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" checked={submitted} onChange={(e) => setSubmitted(e.target.checked)} className="h-4 w-4 accent-indigo-600" />
          Đã nộp đầu ra của nhiệm vụ
        </label>
      )}
      <div>
        <label htmlFor={`${idPrefix}-note`} className="text-sm font-semibold text-ink-700">
          Ghi chú
        </label>
        <textarea
          id={`${idPrefix}-note`}
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ví dụ: còn vướng LEFT JOIN ở bài 4…"
          className="field mt-1.5 resize-none"
        />
      </div>
    </div>
  );
}

/** Bước Ghi nhật ký trong buổi học (LOG-01). */
export function LogStep({ task, live, onSaved }: { task: Task; live: boolean; onSaved: (status: LogStatus) => void }) {
  const toast = useToast();
  const [status, setStatus] = useState<LogStatus>("Xong");
  const [minutes, setMinutes] = useState(String(task.minutes));
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(true);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (live) {
      const { error } = await apiOrError("/logs", { method: "POST", body: { taskId: task.id, status, minutes: Number(minutes), note } });
      if (error) return toast.show(error);
    }
    toast.show("Đã ghi nhật ký");
    onSaved(status);
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <LogFields idPrefix="log" status={status} setStatus={setStatus} minutes={minutes} setMinutes={setMinutes} note={note} setNote={setNote} submitted={submitted} setSubmitted={setSubmitted} />
      <button type="submit" className="btn-primary">
        <NotebookPen className="h-4 w-4" aria-hidden />
        Lưu nhật ký
      </button>
    </form>
  );
}

/** Nhiệm vụ khác trong tuần, kèm ghi nhật ký muộn cho nhiệm vụ quá hạn. */
export function OtherTasks({ others, live, reload }: { others: Other[]; live: boolean; reload: () => Promise<void> }) {
  const toast = useToast();
  const [target, setTarget] = useState<Other | null>(null);
  const [status, setStatus] = useState<LogStatus>("Xong");
  const [minutes, setMinutes] = useState("30");
  const [note, setNote] = useState("");
  const [lateLogged, setLateLogged] = useState<string[]>([]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    if (live) {
      const { error } = await apiOrError("/logs", { method: "POST", body: { taskId: target.id, status, minutes: Number(minutes), note } });
      if (error) return toast.show(error);
      await reload();
    } else if (status === "Xong") setLateLogged((l) => [...l, target.title]);
    toast.show(`Đã ghi nhật ký muộn cho "${target.title}"`);
    setTarget(null);
  }

  return (
    <section aria-labelledby="others-heading">
      <h2 id="others-heading" className="text-sm font-semibold text-ink-900">
        Nhiệm vụ khác trong tuần
      </h2>
      {others.length === 0 && <p className="mt-2 px-2 text-sm text-ink-500">Chưa có nhiệm vụ nào khác đã xong hoặc quá hạn.</p>}
      <ul className="mt-2 space-y-1">
        {others.map((t) => {
          const overdue = t.status === "Quá hạn" && !lateLogged.includes(t.title);
          return (
            <li key={t.id} className="flex items-start gap-2.5 rounded-lg px-2 py-2 text-sm">
              {overdue ? <AlarmClock className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />}
              <span className="min-w-0 flex-1">
                <span className={`block font-semibold ${overdue ? "text-ink-900" : "text-ink-500 line-through"}`}>{t.title}</span>
                <span className="text-xs text-ink-500">
                  {t.minutes} phút{t.due ? ` · ${t.due}` : ""}
                  {overdue && <span className="ml-1 font-semibold text-rose-700">· Quá hạn</span>}
                </span>
                {overdue && (
                  <button
                    type="button"
                    className="focus-ring mt-1 block rounded text-xs font-semibold text-indigo-600 hover:underline"
                    onClick={() => {
                      setTarget(t);
                      setMinutes(String(t.minutes));
                      setStatus("Xong");
                      setNote("");
                    }}
                  >
                    Ghi nhật ký muộn
                  </button>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-1 px-2 text-[11px] text-ink-400">Quá hạn tính tự động theo giờ Việt Nam.</p>

      <Modal
        open={target !== null}
        onClose={() => setTarget(null)}
        title="Ghi nhật ký muộn"
        description={target ? `Nhiệm vụ: ${target.title}` : undefined}
        icon={<NotebookPen className="h-5 w-5" />}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setTarget(null)}>
              Huỷ
            </button>
            <button type="submit" form="late-log-form" className="btn-primary">
              Lưu
            </button>
          </>
        }
      >
        <form id="late-log-form" onSubmit={save}>
          <LogFields idPrefix="late" status={status} setStatus={setStatus} minutes={minutes} setMinutes={setMinutes} note={note} setNote={setNote} />
        </form>
      </Modal>
    </section>
  );
}
