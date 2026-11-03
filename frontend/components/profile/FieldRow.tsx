"use client";

import { BadgeCheck, Check, CircleHelp, PenLine, ScanText, X } from "lucide-react";
import { useState } from "react";
import type { ProfileField, Provenance } from "@/lib/mock";

// Nguồn gốc từng trường hồ sơ (ONB-05): gõ tay, trích xuất, đã xác nhận.
export const provStyle: Record<Provenance, { cls: string; icon: React.ReactNode }> = {
  "Đã xác nhận": { cls: "bg-emerald-50 text-emerald-700", icon: <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> },
  "Trích xuất": { cls: "bg-indigo-50 text-indigo-700", icon: <ScanText className="h-3.5 w-3.5" aria-hidden /> },
  "Tự nhập": { cls: "bg-amber-50 text-amber-800", icon: <PenLine className="h-3.5 w-3.5" aria-hidden /> },
};

export function ProvenanceLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
      <span className="font-semibold">Nguồn gốc:</span>
      {(Object.keys(provStyle) as Provenance[]).map((p) => (
        <span key={p} className={`pill ${provStyle[p].cls}`}>
          {provStyle[p].icon}
          {p}
        </span>
      ))}
    </div>
  );
}

export function FieldRow({ field, onChange }: { field: ProfileField; onChange: (value: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(field.value ?? "");
  const inputId = `pf-${field.key}`;

  function save() {
    if (!draft.trim()) return;
    onChange(draft.trim());
    setEditing(false);
  }

  return (
    <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:gap-4">
      <dt className="pt-1 text-sm font-semibold text-ink-500 sm:w-60 sm:shrink-0">
        <label htmlFor={inputId}>{field.label}</label>
      </dt>
      <dd className="min-w-0 flex-1">
        {editing || (!field.value && field.question) ? (
          <div className="space-y-2">
            {!field.value && field.question && (
              <p className="flex items-start gap-2 text-sm text-ink-700">
                <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                <span>
                  <span className="font-semibold">PersoAI hỏi lại: </span>
                  {field.question}
                </span>
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id={inputId}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                placeholder="Nhập câu trả lời…"
                className="field min-w-0 flex-1 py-2"
              />
              <div className="flex gap-2">
                <button type="button" className="btn-primary px-3 py-2" onClick={save} disabled={!draft.trim()}>
                  <Check className="h-4 w-4" aria-hidden />
                  Lưu
                </button>
                {editing && (
                  <button
                    type="button"
                    className="btn-ghost px-3 py-2"
                    onClick={() => {
                      setDraft(field.value ?? "");
                      setEditing(false);
                    }}
                  >
                    <X className="h-4 w-4" aria-hidden />
                    Huỷ
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span id={inputId} className="text-[15px] font-semibold text-ink-900">
              {field.value}
            </span>
            <span className="flex items-center gap-2">
              {field.source && (
                <span className={`pill ${provStyle[field.source].cls}`}>
                  {provStyle[field.source].icon}
                  <span className="sr-only">Nguồn gốc: </span>
                  {field.source}
                </span>
              )}
              <button
                type="button"
                className="focus-ring rounded px-2 py-1 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
                onClick={() => setEditing(true)}
                aria-label={`Sửa ${field.label}`}
              >
                Sửa
              </button>
            </span>
          </div>
        )}
      </dd>
    </div>
  );
}
