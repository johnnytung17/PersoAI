"use client";

import { CheckCircle2, ChevronRight, Circle, Lock, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useDemo } from "@/lib/demo";
import { course, quizItems, retestItems, sessionSteps, todayLabel, type SessionStepKey } from "@/lib/mock";
import { PracticePanel } from "./PracticePanel";
import { QuizRunner, QuizSummary, type QuizResult } from "./QuizRunner";
import { StudyCorner } from "./StudyCorner";
import { LogStep, OtherTasks, TaskBanner, useToday } from "./TaskCard";

type StepState = "todo" | "done" | "skipped";

// Một buổi học = một nhiệm vụ: làm lại → góc học tập → thực hành → nhật ký → bài luyện (SES-01, UC-08/09).
// Hỏi đáp chỉ nằm trong Trợ lý học tập (chat nổi), không đặt trong bước.
export function TodayView() {
  const toast = useToast();
  const { firstWeek } = useDemo();
  const today = useToday();
  const { task, setTask, live, reload } = today;
  // Buổi học đầu tiên của người mới: chưa có câu sai nên không có bước Làm lại, chưa có nhiệm vụ khác.
  const steps = firstWeek ? sessionSteps.filter((s) => s.key !== "retest") : sessionSteps;
  const others = firstWeek ? [] : today.others;
  const weekLabel = firstWeek ? "Tuần 1 · 0/5 nhiệm vụ xong" : today.weekLabel;
  const [current, setCurrent] = useState<SessionStepKey>(steps[0].key);
  const [state, setState] = useState<Record<SessionStepKey, StepState>>({ retest: "todo", study: "todo", practice: "todo", log: "todo", quiz: "todo" });
  const [retestResults, setRetestResults] = useState<QuizResult[] | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResult[] | null>(null);
  const [skipOpen, setSkipOpen] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const [practice, setPractice] = useState({ passed: firstWeek ? 0 : 3, total: 5 });

  const contentRef = useRef<HTMLElement>(null);
  const stripRef = useRef<HTMLElement>(null);

  // Giữ nút bước đang mở trong tầm nhìn của thanh bước ngang (màn hẹp).
  useEffect(() => {
    const strip = stripRef.current;
    const active = strip?.querySelector<HTMLElement>('[aria-current="step"]');
    if (strip && active) strip.scrollTo({ left: active.offsetLeft - 16, behavior: "smooth" });
  }, [current]);
  const retestPending = !firstWeek && state.retest === "todo";
  const doneCount = steps.filter((s) => state[s.key] !== "todo").length;
  const stepIndex = steps.findIndex((s) => s.key === current);

  // Đổi bước; trên màn hẹp cuộn tới đầu nội dung bước vì thanh bước nằm phía trên.
  function goTo(key: SessionStepKey) {
    setCurrent(key);
    const el = contentRef.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: "start" });
  }

  function complete(key: SessionStepKey, how: StepState = "done") {
    setState((s) => ({ ...s, [key]: how }));
    const next = steps[steps.findIndex((s) => s.key === key) + 1];
    if (next) goTo(next.key);
  }

  function skipRetest(e: React.FormEvent) {
    e.preventDefault();
    if (!skipReason.trim()) return;
    setSkipOpen(false);
    toast.show("Đã ghi lý do bỏ qua; 2 câu vẫn chờ ở buổi sau");
    complete("retest", "skipped");
  }

  const stepMeta = steps[stepIndex];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Hôm nay</h1>
          <p className="mt-1 text-[15px] text-ink-500">
            {todayLabel} · {course.name} · {weekLabel}
          </p>
        </div>
      </div>

      <TaskBanner task={task} done={doneCount} total={steps.length} />

      {/* Mobile/tablet: thanh bước ngang để nội dung bài học nằm ngay dưới thẻ nhiệm vụ. */}
      <nav ref={stripRef} aria-label="Các bước (thu gọn)" className="scrollbar-thin -mx-4 mt-5 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:hidden">
        <ol className="flex w-max gap-2 pb-1">
          {steps.map((s, i) => {
            const st = state[s.key];
            const active = s.key === current;
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => goTo(s.key)}
                  aria-current={active ? "step" : undefined}
                  className={`focus-ring inline-flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm font-semibold transition-colors ${
                    active ? "border-indigo-600 bg-indigo-600 text-white" : "border-line-strong text-ink-700"
                  }`}
                >
                  {st === "done" ? (
                    <CheckCircle2 className={`h-4 w-4 ${active ? "text-white" : "text-emerald-600"}`} aria-label="Đã xong" />
                  ) : st === "skipped" ? (
                    <RotateCcw className={`h-4 w-4 ${active ? "text-white" : "text-amber-600"}`} aria-label="Đã bỏ qua" />
                  ) : (
                    <span aria-hidden>{i + 1}.</span>
                  )}
                  {s.label}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden space-y-6 lg:sticky lg:top-24 lg:block lg:self-start">
          <nav aria-label="Các bước của buổi học">
            <p className="label-eyebrow mb-2 px-2">Buổi học</p>
            <ol className="space-y-0.5">
              {steps.map((s, i) => {
                const st = state[s.key];
                const active = s.key === current;
                const locked = retestPending && s.key !== "retest";
                return (
                  <li key={s.key}>
                    <button
                      type="button"
                      onClick={() => goTo(s.key)}
                      aria-current={active ? "step" : undefined}
                      className={`focus-ring relative flex w-full items-start gap-3 rounded-lg py-2.5 pl-4 pr-3 text-left transition-colors ${
                        active ? "bg-indigo-50" : "hover:bg-slate-50"
                      }`}
                    >
                      {active && <span className="absolute inset-y-1 left-0 w-1 rounded-r bg-indigo-600" aria-hidden />}
                      <span className="mt-0.5 shrink-0">
                        {st === "done" ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-label="Đã xong" />
                        ) : st === "skipped" ? (
                          <RotateCcw className="h-5 w-5 text-amber-600" aria-label="Đã bỏ qua" />
                        ) : locked ? (
                          <Lock className="h-5 w-5 text-ink-400" aria-label="Chờ làm lại" />
                        ) : (
                          <Circle className="h-5 w-5 text-ink-400" aria-label="Chưa làm" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm font-semibold ${active ? "text-indigo-700" : "text-ink-900"}`}>
                          {i + 1}. {s.label}
                        </span>
                        <span className="block text-xs text-ink-500">
                          {s.key === "retest" ? `${retestItems.length} câu chờ · ${s.hint}` : s.key === "practice" ? `Đạt ${practice.passed}/${practice.total} bài` : s.hint}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
          <div className="border-t border-line pt-4">
            <OtherTasks others={others} live={live} reload={reload} />
          </div>
        </aside>

        <section ref={contentRef} aria-labelledby="step-heading" className="min-w-0 scroll-mt-20">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
            <div>
              <p className="text-sm text-ink-500">
                Bước {stepIndex + 1}/{steps.length}
              </p>
              <h2 id="step-heading" className="text-xl font-semibold text-ink-900">
                {stepMeta.label}
              </h2>
            </div>
            {stepIndex < steps.length - 1 && current !== "retest" && (
              <button type="button" className="btn-ghost" onClick={() => goTo(steps[stepIndex + 1].key)}>
                Bước tiếp
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>

          {retestPending && current !== "retest" && (
            <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm" role="status">
              <span className="min-w-[220px] flex-1 text-ink-900">
                Còn {retestItems.length} câu sai từ buổi trước cần làm lại trước nội dung mới của môn này.
              </span>
              <button type="button" className="btn-secondary px-3 py-1.5" onClick={() => goTo("retest")}>
                Làm lại ngay
              </button>
            </div>
          )}

          {current === "retest" &&
            (state.retest !== "todo" ? (
              <div className="space-y-4">
                {retestResults ? <QuizSummary results={retestResults} /> : <p className="text-sm text-ink-700">Đã bỏ qua kèm lý do: “{skipReason}”.</p>}
                <button type="button" className="btn-primary" onClick={() => goTo("study")}>
                  Sang Học & hỏi đáp
                </button>
              </div>
            ) : (
              <div className="max-w-2xl">
                <p className="mb-5 text-sm text-ink-500">
                  Câu đúng sẽ được xóa khỏi hàng đợi; sai lần thứ 3 thì thôi chặn và thành bằng chứng cho đề xuất ôn tập.
                </p>
                <QuizRunner
                  items={retestItems}
                  finishLabel="Hoàn tất làm lại"
                  onFinish={(r) => {
                    setRetestResults(r);
                    complete("retest");
                  }}
                />
                <div className="mt-6 border-t border-line pt-4">
                  <button type="button" className="focus-ring rounded text-sm font-semibold text-indigo-600 hover:underline" onClick={() => setSkipOpen(true)}>
                    Bỏ qua lần này (cần ghi lý do)
                  </button>
                </div>
              </div>
            ))}

          {current === "study" && (
            <div className="space-y-5">
              <StudyCorner />
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <button type="button" className="btn-primary" onClick={() => complete("study")}>
                  Đã đọc xong, sang Thực hành
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
                <span className="text-sm text-ink-500">Hỏi đáp không bắt buộc</span>
              </div>
            </div>
          )}

          {current === "practice" && (
            <div className="space-y-5">
              <PracticePanel fresh={firstWeek} onPassedChange={(passed, total) => setPractice({ passed, total })} />
              <div className="border-t border-line pt-4">
                <button type="button" className="btn-primary" onClick={() => complete("practice")}>
                  Kết thúc thực hành
                </button>
                <p className="mt-2 text-xs text-ink-500">Bài chưa đạt khi kết thúc buổi sẽ vào hàng đợi làm lại.</p>
              </div>
            </div>
          )}

          {current === "log" && (
            <div className="max-w-2xl">
              <LogStep
                task={task}
                live={live}
                onSaved={(status) => {
                  setTask((t) => ({ ...t, status }));
                  complete("log");
                }}
              />
            </div>
          )}

          {current === "quiz" &&
            (quizResults ? (
              <div className="max-w-2xl space-y-4">
                <QuizSummary results={quizResults} />
                <p className="text-sm text-ink-500">Buổi học đã xong. Kết quả được tính vào báo cáo tuần.</p>
              </div>
            ) : (
              <div className="max-w-2xl">
                <p className="mb-5 text-sm text-ink-500">Nhiệm vụ 45 phút nên có 3 câu. Trả lời trước, xem giải thích sau.</p>
                <QuizRunner
                  items={quizItems}
                  onFinish={(r) => {
                    setQuizResults(r);
                    setState((s) => ({ ...s, quiz: "done" }));
                  }}
                />
              </div>
            ))}
        </section>

        <div className="border-t border-line pt-4 lg:hidden">
          <OtherTasks others={others} live={live} reload={reload} />
        </div>
      </div>

      <Modal
        open={skipOpen}
        onClose={() => setSkipOpen(false)}
        title="Bỏ qua làm lại"
        description="Lý do được lưu; các câu vẫn chờ ở buổi sau của môn này."
        icon={<RotateCcw className="h-5 w-5" />}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setSkipOpen(false)}>
              Huỷ
            </button>
            <button type="submit" form="skip-form" className="btn-primary" disabled={!skipReason.trim()}>
              Bỏ qua
            </button>
          </>
        }
      >
        <form id="skip-form" onSubmit={skipRetest}>
          <label htmlFor="skip-reason" className="text-sm font-semibold text-ink-700">
            Lý do
          </label>
          <textarea id="skip-reason" rows={3} value={skipReason} onChange={(e) => setSkipReason(e.target.value)} placeholder="Ví dụ: hôm nay chỉ còn 30 phút, ưu tiên bài thực hành" className="field mt-1.5 resize-none" />
        </form>
      </Modal>
    </div>
  );
}
