"use client";

import { ArrowLeft, ArrowRight, Check, Loader2, Wand2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { FieldRow, ProvenanceLegend } from "@/components/profile/FieldRow";
import { useToast } from "@/components/ui/Toast";
import { useDemo } from "@/lib/demo";
import { profile12, profileMaxChars, profileSampleText, surveyHints, type ProfileField } from "@/lib/mock";

const STEPS = ["Kể về việc học", "Kiểm tra hồ sơ", "Câu hỏi bổ sung", "Xác nhận"];

// Khảo sát (UC-02, ONB-01..06): lời kể → LLM trích 12 trường → ≤ 3 câu bổ sung → xác nhận mới lưu.
export function SurveyView() {
  const toast = useToast();
  const { setup, complete } = useDemo();
  const [step, setStep] = useState(0);
  const [text, setText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [fields, setFields] = useState<ProfileField[]>([]);
  const [saved, setSaved] = useState(false);

  const missing = fields.filter((f) => !f.value);
  // Mâu thuẫn (ONB-06): quỹ giờ lớn hơn thời gian rảnh ước tính.
  const budget = Number(fields.find((f) => f.key === "weekly_budget_min")?.value ?? 0);
  const conflict = budget > 3000 ? "Số phút tự học vượt 3.000 phút/tuần." : null;

  function extract() {
    setExtracting(true);
    window.setTimeout(() => {
      setFields(profile12.map((f) => ({ ...f })));
      setExtracting(false);
      setStep(1);
    }, 900);
  }

  function update(key: string, value: string) {
    setFields((fs) => fs.map((f) => (f.key === key ? { ...f, value, source: "Tự nhập" } : f)));
  }

  function confirm() {
    setFields((fs) => fs.map((f) => (f.value ? { ...f, source: f.source === "Tự nhập" ? "Tự nhập" : "Đã xác nhận" } : f)));
    setSaved(true);
    complete("survey");
    toast.show(setup.survey ? "Đã lưu phiên bản hồ sơ mới" : "Đã lưu hồ sơ phiên bản 1");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <ol className="mb-8 grid grid-cols-4 gap-2" aria-label="Các bước khảo sát">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === step ? "step" : undefined}>
            <span className={`block h-1 rounded-full ${i <= step ? "bg-indigo-600" : "bg-slate-200"}`} aria-hidden />
            <span className={`mt-2 hidden text-sm font-semibold sm:block ${i === step ? "text-indigo-700" : i < step ? "text-ink-900" : "text-ink-400"}`}>
              {i + 1}. {label}
            </span>
          </li>
        ))}
      </ol>
      {/* Màn hẹp: một dòng nhãn bước hiện tại thay cho 4 nhãn bị xuống dòng. */}
      <p className="-mt-6 mb-8 text-sm font-semibold text-indigo-700 sm:hidden">
        Bước {step + 1}/{STEPS.length} · {STEPS[step]}
      </p>

      {step === 0 && (
        <section aria-labelledby="s0">
          <h2 id="s0" className="text-xl font-semibold text-ink-900">
            Hãy kể ngắn về việc học của bạn
          </h2>
          <p className="mt-1 text-[15px] text-ink-500">Viết tự nhiên. PersoAI chỉ gửi đoạn này để trích hồ sơ; trường nào chưa rõ sẽ để trống và hỏi lại, không đoán.</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {surveyHints.map((h) => (
              <li key={h} className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-ink-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
                {h}
              </li>
            ))}
          </ul>
          <label htmlFor="survey-text" className="sr-only">
            Lời kể
          </label>
          <textarea
            id="survey-text"
            rows={7}
            maxLength={profileMaxChars}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ví dụ: Mình năm 3 CNTT, đi làm thêm tối thứ Năm…"
            className="field mt-4 resize-y text-[15px] leading-6"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-ink-500" aria-live="polite">
              {text.length.toLocaleString("vi-VN")}/{profileMaxChars.toLocaleString("vi-VN")} ký tự
              {!text && (
                <button type="button" className="focus-ring ml-3 rounded font-semibold text-indigo-600 hover:underline" onClick={() => setText(profileSampleText)}>
                  Dùng ví dụ mẫu
                </button>
              )}
            </span>
            <button type="button" className="btn-primary" onClick={extract} disabled={!text.trim() || extracting}>
              {extracting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Wand2 className="h-4 w-4" aria-hidden />}
              {extracting ? "Đang trích hồ sơ…" : "Trích hồ sơ"}
            </button>
          </div>
        </section>
      )}

      {step === 1 && (
        <section aria-labelledby="s1">
          <h2 id="s1" className="text-xl font-semibold text-ink-900">
            Kiểm tra 12 trường hồ sơ
          </h2>
          <p className="mt-1 text-[15px] text-ink-500">Sửa trường nào chưa đúng. Hồ sơ chỉ được lưu khi bạn xác nhận ở bước cuối.</p>
          <div className="mt-4">
            <ProvenanceLegend />
          </div>
          {conflict && <p className="mt-3 rounded-lg border-l-4 border-amber-500 bg-amber-50 px-4 py-2 text-sm text-ink-900">{conflict}</p>}
          <dl className="card mt-4 divide-y divide-line">
            {fields.filter((f) => f.value).map((f) => (
              <FieldRow key={`${f.key}-${f.value}`} field={f} onChange={(v) => update(f.key, v)} />
            ))}
          </dl>
        </section>
      )}

      {step === 2 && (
        <section aria-labelledby="s2">
          <h2 id="s2" className="text-xl font-semibold text-ink-900">
            {missing.length > 0 ? `${missing.length} câu hỏi bổ sung` : "Không còn trường trống"}
          </h2>
          <p className="mt-1 text-[15px] text-ink-500">Tối đa 3 câu, chỉ cho trường còn thiếu. Bạn có thể trả lời sau.</p>
          <dl className="card mt-4 divide-y divide-line">
            {fields
              .filter((f) => f.question)
              .map((f) => (
                <FieldRow key={`${f.key}-${f.value ?? ""}`} field={f} onChange={(v) => update(f.key, v)} />
              ))}
          </dl>
        </section>
      )}

      {step === 3 && (
        <section aria-labelledby="s3">
          <h2 id="s3" className="text-xl font-semibold text-ink-900">
            {saved ? "Hồ sơ đã được lưu" : "Xác nhận hồ sơ"}
          </h2>
          <p className="mt-1 text-[15px] text-ink-500">
            {saved ? "Bước tiếp theo: thêm môn học, hạn chót và tài liệu (4 câu hỏi cho mỗi môn)." : "Kiểm tra lần cuối. Mỗi lần sửa sau này tạo một phiên bản hồ sơ mới."}
          </p>
          <dl className="card mt-4 grid gap-x-6 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key} className="border-b border-line px-5 py-3">
                <dt className="text-xs text-ink-500">{f.label}</dt>
                <dd className={`text-sm font-semibold ${f.value ? "text-ink-900" : "italic text-ink-400"}`}>{f.value ?? "Để trống"}</dd>
              </div>
            ))}
          </dl>
          {saved && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link href="/mon-hoc" className="btn-primary">
                Thêm môn học
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/" className="btn-ghost">
                Về trang Hôm nay
              </Link>
            </div>
          )}
        </section>
      )}

      {step > 0 && !saved && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <button type="button" className="btn-ghost" onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Quay lại
          </button>
          {step < 3 ? (
            <button type="button" className="btn-primary" onClick={() => setStep((s) => s + 1)}>
              Tiếp tục
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          ) : (
            <button type="button" className="btn-primary" onClick={confirm}>
              <Check className="h-4 w-4" aria-hidden />
              Xác nhận hồ sơ
            </button>
          )}
        </div>
      )}
    </div>
  );
}
