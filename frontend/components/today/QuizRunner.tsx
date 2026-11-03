"use client";

import { CheckCircle2, Flag, Lightbulb, XCircle } from "lucide-react";
import { useState } from "react";
import type { QuizItem } from "@/lib/mock";

export type QuizResult = { id: string; topic: string; correct: boolean; flagged: boolean };

// Một câu một lần; gợi ý trước khi trả lời; chấm theo key đã lưu; giải thích ≤ 80 từ kèm nguồn (SES-05, SES-10).
export function QuizRunner({
  items,
  onFinish,
  finishLabel = "Xem kết quả",
}: {
  items: (QuizItem & { wrongCount?: number })[];
  onFinish: (results: QuizResult[]) => void;
  finishLabel?: string;
}) {
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [hint, setHint] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);
  const item = items[index];
  const correct = choice === item.key;

  function submit() {
    if (choice === null) return;
    setAnswered(true);
    setResults((r) => [...r, { id: item.id, topic: item.topic, correct: choice === item.key, flagged: false }]);
  }

  function next() {
    const updated = results.map((r) => (r.id === item.id ? { ...r, flagged } : r));
    if (index === items.length - 1) return onFinish(updated);
    setResults(updated);
    setIndex((i) => i + 1);
    setChoice(null);
    setAnswered(false);
    setHint(false);
    setFlagged(false);
  }

  // why_wrong được lưu theo thứ tự các phương án sai, bỏ qua phương án đúng.
  const wrongIdx = choice !== null && choice !== item.key ? (choice < item.key ? choice : choice - 1) : -1;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink-500">
          Câu {index + 1}/{items.length} · {item.topic}
          {item.wrongCount ? <span className="ml-2 text-rose-700">sai {item.wrongCount} lần</span> : null}
        </p>
        {item.generated && <span className="pill bg-amber-50 text-amber-800">AI tạo – chưa duyệt</span>}
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100" aria-hidden>
        <div className="h-full bg-indigo-600 transition-all" style={{ width: `${((index + (answered ? 1 : 0)) / items.length) * 100}%` }} />
      </div>

      <fieldset className="mt-5" disabled={answered}>
        <legend className="text-lg font-semibold text-ink-900">{item.stem}</legend>
        <div className="mt-4 space-y-2">
          {item.options.map((o, i) => {
            const isKey = answered && i === item.key;
            const isWrongPick = answered && i === choice && i !== item.key;
            return (
              <label
                key={i}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-[15px] transition-colors focus-within:ring-2 focus-within:ring-indigo-600 ${
                  isKey
                    ? "border-emerald-600 bg-emerald-50"
                    : isWrongPick
                      ? "border-rose-600 bg-rose-50"
                      : choice === i
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-line-strong hover:border-ink-500"
                } ${answered ? "cursor-default" : ""}`}
              >
                <input type="radio" name={`q-${item.id}`} checked={choice === i} onChange={() => setChoice(i)} className="mt-1 h-4 w-4 accent-indigo-600" />
                <span className="flex-1 text-ink-900">{o}</span>
                {isKey && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-label="Đáp án đúng" />}
                {isWrongPick && <XCircle className="h-5 w-5 shrink-0 text-rose-600" aria-label="Lựa chọn sai" />}
              </label>
            );
          })}
        </div>
      </fieldset>

      {!answered && hint && (
        <p className="mt-4 flex gap-2 rounded-lg bg-indigo-50 px-4 py-3 text-sm text-ink-900">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
          {item.hint}
        </p>
      )}

      {answered && (
        <div className={`mt-4 rounded-lg border-l-4 px-4 py-3 text-sm ${correct ? "border-emerald-600 bg-emerald-50" : "border-rose-600 bg-rose-50"}`} role="status">
          <p className="font-semibold text-ink-900">{correct ? "Đúng" : "Chưa đúng"}</p>
          <p className="mt-1 text-ink-700">
            <span className="font-semibold">Vì sao đúng: </span>
            {item.whyCorrect}
          </p>
          {wrongIdx >= 0 && (
            <p className="mt-1 text-ink-700">
              <span className="font-semibold">Vì sao lựa chọn của bạn sai: </span>
              {item.whyWrong[wrongIdx]}
            </p>
          )}
          <p className="mt-2 text-xs text-ink-500">
            Đọc lại: <span className="font-semibold text-indigo-700">{item.source}</span>
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {!answered ? (
          <>
            <button type="button" className="btn-primary" disabled={choice === null} onClick={submit}>
              Trả lời
            </button>
            <button type="button" className="btn-ghost" onClick={() => setHint(true)} disabled={hint}>
              <Lightbulb className="h-4 w-4" aria-hidden />
              Gợi ý
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn-primary" onClick={next} data-autofocus>
              {index === items.length - 1 ? finishLabel : "Câu tiếp"}
            </button>
            {item.generated && (
              <button type="button" className="btn-ghost text-ink-500" aria-pressed={flagged} onClick={() => setFlagged((f) => !f)}>
                <Flag className="h-4 w-4" aria-hidden />
                {flagged ? "Đã báo lỗi · không tính điểm" : "Báo lỗi câu này"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Tổng kết “đúng X/Y” theo chủ đề; câu bị báo lỗi không tính (SES-04, SES-09). */
export function QuizSummary({ results }: { results: QuizResult[] }) {
  const counted = results.filter((r) => !r.flagged);
  const topics = Array.from(new Set(counted.map((r) => r.topic)));
  const wrong = counted.filter((r) => !r.correct).length;
  return (
    <div>
      <p className="text-lg font-semibold text-ink-900">
        Đúng {counted.filter((r) => r.correct).length}/{counted.length}
      </p>
      <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
        {topics.map((t) => {
          const rs = counted.filter((r) => r.topic === t);
          return (
            <li key={t} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-ink-700">{t}</span>
              <span className="font-semibold text-ink-900">
                đúng {rs.filter((r) => r.correct).length}/{rs.length}
              </span>
            </li>
          );
        })}
      </ul>
      {wrong > 0 && <p className="mt-3 text-sm text-ink-500">{wrong} câu sai được đưa vào hàng đợi làm lại, hỏi lại trước buổi học kế tiếp của môn này.</p>}
    </div>
  );
}
