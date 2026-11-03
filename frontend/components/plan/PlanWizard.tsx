"use client";

import { AlertTriangle, CalendarPlus, CheckCircle2, CircleDashed, Loader2, Scissors, CalendarClock, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { clarifyingQuestions, goals, plan } from "@/lib/mock";

type Step = "goal" | "questions" | "running" | "infeasible" | "done";
type LogLine = { text: string; tone: "info" | "ok" | "fail" };

// Kịch bản minh hoạ UC-06: soạn nháp → kiểm tra → sửa tối đa 2 lần.
const NORMAL_RUN: LogLine[] = [
  { text: "Gửi hồ sơ đã xác nhận, mục tiêu, câu trả lời và danh sách tài liệu tới AI", tone: "info" },
  { text: "Nhận bản nháp 7 ngày", tone: "info" },
  { text: "Kiểm tra lần 1: vượt ngân sách 205/180 phút", tone: "fail" },
  { text: "Sửa lần 1: rút ngắn \"Bài tập JOIN\" và \"GROUP BY\"", tone: "info" },
  { text: "Kiểm tra lần 2: mọi quy tắc chặn đều đạt (170/180 phút)", tone: "ok" },
];

const HEAVY_RUN: LogLine[] = [
  { text: "Gửi hồ sơ đã xác nhận, mục tiêu, câu trả lời và danh sách tài liệu tới AI", tone: "info" },
  { text: "Nhận bản nháp 7 ngày", tone: "info" },
  { text: "Kiểm tra lần 1: vượt ngân sách 290/180 phút", tone: "fail" },
  { text: "Sửa lần 1", tone: "info" },
  { text: "Kiểm tra lần 2: vẫn vượt ngân sách 245/180 phút", tone: "fail" },
  { text: "Sửa lần 2", tone: "info" },
  { text: "Kiểm tra lần 3: vẫn vượt ngân sách 215/180 phút, dừng sửa", tone: "fail" },
];

export function PlanWizard({
  open,
  onClose,
  nextVersion,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  nextVersion: number;
  onDone: (version: number) => void;
}) {
  const [step, setStep] = useState<Step>("goal");
  const [goalId, setGoalId] = useState(goals[0].id);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [lines, setLines] = useState<LogLine[]>([]);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (!open) {
      timers.current.forEach(window.clearTimeout);
      timers.current = [];
      setStep("goal");
      setAnswers({});
      setLines([]);
    }
  }, [open]);

  function run(script: LogLine[], then: Step) {
    setStep("running");
    setLines([]);
    script.forEach((line, i) => {
      timers.current.push(window.setTimeout(() => setLines((l) => [...l, line]), 450 * (i + 1)));
    });
    timers.current.push(window.setTimeout(() => setStep(then), 450 * (script.length + 1)));
  }

  function generate() {
    const heavy = answers.q3 === clarifyingQuestions[2].options[1];
    run(heavy ? HEAVY_RUN : NORMAL_RUN, heavy ? "infeasible" : "done");
  }

  function resolve(choice: "scope" | "deadline") {
    run(
      [
        {
          text: choice === "scope" ? "Giảm phạm vi: bỏ 2 chủ đề nâng cao, soạn lại bản nháp" : "Lùi hạn chót mục tiêu sang 27/11, soạn lại bản nháp",
          tone: "info",
        },
        { text: "Kiểm tra: mọi quy tắc chặn đều đạt (170/180 phút)", tone: "ok" },
      ],
      "done",
    );
  }

  const allAnswered = clarifyingQuestions.every((q) => answers[q.id]);
  const goal = goals.find((g) => g.id === goalId)!;

  const footer =
    step === "goal" ? (
      <>
        <button type="button" className="btn-secondary" onClick={onClose}>
          Huỷ
        </button>
        <button type="button" className="btn-primary" onClick={() => setStep("questions")}>
          Tiếp tục
        </button>
      </>
    ) : step === "questions" ? (
      <>
        <button type="button" className="btn-secondary" onClick={() => setStep("goal")}>
          Quay lại
        </button>
        <button type="button" className="btn-primary" disabled={!allAnswered} onClick={generate}>
          Soạn bản nháp
        </button>
      </>
    ) : step === "done" ? (
      <button
        type="button"
        className="btn-primary"
        data-autofocus
        onClick={() => {
          onDone(nextVersion);
          onClose();
        }}
      >
        Mở bản nháp
      </button>
    ) : step === "infeasible" ? (
      <button type="button" className="btn-secondary" onClick={onClose}>
        Đóng, không lưu gì
      </button>
    ) : undefined;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Lập kế hoạch tuần mới"
      description={`Tuần ${plan.title.replace("Kế hoạch tuần ", "")} · đóng giữa chừng sẽ không lưu gì`}
      icon={<CalendarPlus className="h-5 w-5" />}
      size="lg"
      footer={footer}
    >
      <ol className="mb-4 flex gap-1.5" aria-label="Các bước">
        {["Mục tiêu", "Câu hỏi làm rõ", "Soạn và kiểm tra"].map((label, i) => {
          const idx = step === "goal" ? 0 : step === "questions" ? 1 : 2;
          return (
            <li key={label} className="flex-1">
              <span className={`block h-1.5 rounded-full ${i <= idx ? "bg-brand" : "bg-slate-200"}`} aria-hidden />
              <span className={`mt-1 block text-[11px] font-semibold ${i <= idx ? "text-indigo-700" : "text-ink-400"}`}>
                {i + 1}. {label}
              </span>
            </li>
          );
        })}
      </ol>

      {step === "goal" && (
        <fieldset>
          <legend className="text-sm font-semibold text-ink-700">Chọn mục tiêu đã xác nhận</legend>
          <div className="mt-2 space-y-2">
            {goals.map((g) => (
              <label
                key={g.id}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-3 text-sm transition focus-within:ring-2 focus-within:ring-indigo-500 ${
                  goalId === g.id ? "border-indigo-300 bg-indigo-50/60" : "border-slate-200 bg-white hover:border-indigo-200"
                }`}
              >
                <span className="flex items-center gap-3">
                  <input type="radio" name="goal" checked={goalId === g.id} onChange={() => setGoalId(g.id)} className="h-4 w-4 accent-indigo-600" />
                  <span>
                    <span className="block font-semibold text-ink-900">{g.output}</span>
                    <span className="text-xs text-ink-500">Hạn {g.deadline}</span>
                  </span>
                </span>
                <span className="pill bg-white text-ink-500 ring-1 ring-slate-200">Ưu tiên {g.priority.toLowerCase()}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {step === "questions" && (
        <div className="space-y-4">
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-ink-500">
            PersoAI hỏi tối đa 3 câu trước khi soạn kế hoạch cho mục tiêu “{goal.output}”.
          </p>
          {clarifyingQuestions.map((q, qi) => (
            <fieldset key={q.id}>
              <legend className="text-sm font-semibold text-ink-900">
                {qi + 1}/3 · {q.question}
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {q.options.map((o) => (
                  <label
                    key={o}
                    className={`cursor-pointer rounded-xl border px-3 py-2 text-sm font-medium transition focus-within:ring-2 focus-within:ring-indigo-500 ${
                      answers[q.id] === o ? "border-transparent bg-brand text-white shadow-glow" : "border-slate-200 bg-white text-ink-700 hover:border-indigo-200"
                    }`}
                  >
                    <input type="radio" name={q.id} value={o} checked={answers[q.id] === o} onChange={() => setAnswers((a) => ({ ...a, [q.id]: o }))} className="sr-only" />
                    {o}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      )}

      {(step === "running" || step === "done" || step === "infeasible") && (
        <div className="space-y-3">
          <ul className="space-y-2" aria-live="polite">
            {lines.map((l, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                {l.tone === "ok" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                ) : l.tone === "fail" ? (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" aria-hidden />
                ) : (
                  <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" aria-hidden />
                )}
                <span className={l.tone === "fail" ? "text-rose-800" : l.tone === "ok" ? "font-semibold text-emerald-800" : "text-ink-700"}>{l.text}</span>
              </li>
            ))}
            {step === "running" && (
              <li className="flex items-center gap-2 text-sm text-ink-400">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Đang xử lý…
              </li>
            )}
          </ul>

          {step === "infeasible" && (
            <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200" role="alert">
              <p className="flex items-start gap-2 text-sm font-semibold text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
                Đã sửa 2 lần nhưng kế hoạch vẫn vượt thời gian bạn có. Bạn muốn chọn cách nào?
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button type="button" className="btn-secondary justify-start text-left" onClick={() => resolve("scope")}>
                  <Scissors className="h-4 w-4 shrink-0" aria-hidden />
                  Giảm phạm vi tuần này
                </button>
                <button type="button" className="btn-secondary justify-start text-left" onClick={() => resolve("deadline")}>
                  <CalendarClock className="h-4 w-4 shrink-0" aria-hidden />
                  Lùi hạn chót sang 27/11
                </button>
              </div>
            </div>
          )}

          {step === "done" && (
            <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
              Bản nháp phiên bản {nextVersion} đã sẵn sàng. Kế hoạch chỉ được lưu khi bạn bấm Xác nhận kế hoạch.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
