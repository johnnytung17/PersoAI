"use client";

import { CheckCircle2, ChevronDown, Circle, Database, Eye, Lightbulb, Loader2, Play, Send, XCircle } from "lucide-react";
import { useState } from "react";
import { exercises as seed, runInner, runLeft, sandboxSchema, type Exercise } from "@/lib/mock";

type Result =
  | { kind: "rows"; columns: string[]; rows: string[][]; ms: number }
  | { kind: "error"; message: string }
  | { kind: "pass" }
  | { kind: "fail"; diff: string; examples: string[][] };

const BLOCKED = /\b(create|alter|drop|truncate|copy|grant|revoke|pg_sleep|pg_read_file|dblink)\b|set\s+role/i;
const PASS_RATE = 0.8;

// Kiểm tra giống parser phía NestJS: một lệnh, không DDL/hàm hệ thống (HND-02, HND-09).
function precheck(sql: string): string | null {
  const body = sql.trim().replace(/;\s*$/, "");
  if (!body) return "Chưa có câu lệnh.";
  if (body.includes(";")) return `Chỉ được chạy một câu lệnh (gặp “;” ở ký tự ${body.indexOf(";") + 1}).`;
  const m = body.match(BLOCKED);
  if (m) return `Lệnh “${m[0].toUpperCase()}” không được phép trong sandbox (vị trí ${(m.index ?? 0) + 1}).`;
  if (!/^\s*(select|insert|update|delete|with)\b/i.test(body)) return "Chỉ chấp nhận SELECT, INSERT, UPDATE hoặc DELETE.";
  return null;
}

function ResultTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="scrollbar-thin max-h-64 overflow-auto rounded-lg border border-line">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-muted">
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col" className="border-b border-line px-3 py-2 font-semibold text-ink-700">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line last:border-0">
              {r.map((v, j) => (
                <td key={j} className={`px-3 py-1.5 font-mono text-[13px] ${v === "NULL" ? "italic text-ink-400" : "text-ink-900"}`}>
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PracticePanel({ onPassedChange, fresh = false }: { onPassedChange?: (passed: number, total: number) => void; fresh?: boolean }) {
  // fresh: buổi đầu tiên của người mới, chưa làm bài nào.
  const [list, setList] = useState<Exercise[]>(fresh ? seed.map((e) => ({ ...e, status: "Chưa làm" as const, attempts: 0 })) : seed);
  const [currentId, setCurrentId] = useState("e4");
  const [sql, setSql] = useState(seed.find((e) => e.id === "e4")!.starter);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState<"run" | "submit" | null>(null);
  const [hintLevel, setHintLevel] = useState(1); // bậc 1 = chênh lệch, luôn hiện khi nộp sai
  const [showSolution, setShowSolution] = useState(false);
  const [schemaOpen, setSchemaOpen] = useState(true);

  const ex = list.find((e) => e.id === currentId)!;
  const passed = list.filter((e) => e.status === "Đạt").length;
  const failedSubmits = ex.status === "Chưa đạt" ? ex.attempts : 0;

  function select(id: string) {
    const e = list.find((x) => x.id === id)!;
    setCurrentId(id);
    setSql(e.starter || "SELECT ");
    setResult(null);
    setHintLevel(1);
    setShowSolution(false);
  }

  function run(action: "run" | "submit") {
    const err = precheck(sql);
    if (err) return setResult({ kind: "error", message: err });
    setBusy(action);
    window.setTimeout(() => {
      const left = /left\s+(outer\s+)?join/i.test(sql);
      if (action === "run") {
        const data = left ? runLeft : runInner;
        setResult({ kind: "rows", columns: data.columns, rows: data.rows, ms: left ? 38 : 31 });
      } else {
        // Chấm bằng so tập kết quả với đáp án, không do AI (BR-13).
        const ok = left;
        const updated = list.map((e) =>
          e.id === ex.id ? { ...e, attempts: e.attempts + 1, status: ok ? ("Đạt" as const) : ("Chưa đạt" as const) } : e,
        );
        setList(updated);
        onPassedChange?.(updated.filter((e) => e.status === "Đạt").length, updated.length);
        setResult(
          ok
            ? { kind: "pass" }
            : {
                kind: "fail",
                diff: "Thiếu 3 dòng so với đáp án · số cột đúng (3/3)",
                examples: [
                  ["SV03", "Đỗ Hà", "NULL"],
                  ["SV06", "Bùi Khánh", "NULL"],
                  ["SV08", "Hồ Lan", "NULL"],
                ],
              },
        );
      }
      setBusy(null);
    }, 450);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ol className="flex flex-wrap gap-2" aria-label="Bài thực hành của nhiệm vụ">
          {list.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => select(e.id)}
                aria-current={e.id === currentId ? "step" : undefined}
                className={`focus-ring inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                  e.id === currentId ? "border-indigo-600 bg-indigo-600 text-white" : "border-line-strong text-ink-700 hover:border-ink-500"
                }`}
              >
                {e.status === "Đạt" ? (
                  <CheckCircle2 className={`h-4 w-4 ${e.id === currentId ? "text-white" : "text-emerald-600"}`} aria-label="Đạt" />
                ) : e.status === "Chưa đạt" ? (
                  <XCircle className={`h-4 w-4 ${e.id === currentId ? "text-white" : "text-rose-600"}`} aria-label="Chưa đạt" />
                ) : (
                  <Circle className="h-4 w-4" aria-label="Chưa làm" />
                )}
                {e.title}
              </button>
            </li>
          ))}
        </ol>
        <p className="text-sm text-ink-500">
          Hoàn thành khi đạt ≥ {Math.ceil(list.length * PASS_RATE)}/{list.length} bài ·{" "}
          <span className="font-semibold text-ink-900">
            đang đạt {passed}/{list.length}
          </span>
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-ink-900">
                {ex.title} · {ex.topic}
              </h3>
              {ex.generated && <span className="pill bg-amber-50 text-amber-800">AI tạo</span>}
              {ex.attempts > 0 && <span className="text-xs text-ink-500">{ex.attempts} lần nộp</span>}
            </div>
            <p className="mt-1 text-[15px] text-ink-700">{ex.prompt}</p>
          </div>

          <div>
            <label htmlFor="sql-editor" className="text-sm font-semibold text-ink-700">
              Câu SQL của bạn
            </label>
            <textarea
              id="sql-editor"
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              spellCheck={false}
              rows={6}
              className="focus-ring mt-1.5 w-full resize-y rounded-lg border border-line-strong bg-muted px-3 py-2.5 font-mono text-[13px] leading-6 text-ink-900"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button type="button" className="btn-secondary" onClick={() => run("run")} disabled={busy !== null}>
                {busy === "run" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
                Chạy
              </button>
              <button type="button" className="btn-primary" onClick={() => run("submit")} disabled={busy !== null || ex.status === "Đạt"}>
                {busy === "submit" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
                Nộp
              </button>
              <span className="ml-auto text-xs text-ink-400">1 lệnh · tối đa 2 giây, 200 dòng · luôn ROLLBACK</span>
            </div>
          </div>

          <div aria-live="polite" className="space-y-3">
            {result?.kind === "rows" && (
              <>
                <p className="text-xs text-ink-500">
                  {result.rows.length} dòng · {result.ms} ms · đã hoàn tác (ROLLBACK)
                </p>
                <ResultTable columns={result.columns} rows={result.rows} />
              </>
            )}
            {result?.kind === "error" && (
              <p className="rounded-lg border-l-4 border-rose-600 bg-rose-50 px-4 py-3 text-sm text-rose-900">{result.message}</p>
            )}
            {result?.kind === "pass" && (
              <p className="flex items-center gap-2 rounded-lg border-l-4 border-emerald-600 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
                <CheckCircle2 className="h-5 w-5" aria-hidden />
                Đạt — kết quả khớp đáp án. Bài được tính vào tiêu chí của nhiệm vụ.
              </p>
            )}
            {result?.kind === "fail" && (
              <div className="rounded-lg border-l-4 border-rose-600 bg-rose-50 px-4 py-3 text-sm">
                <p className="font-semibold text-rose-900">Chưa đạt · {result.diff}</p>
                <p className="mt-2 text-xs font-semibold text-ink-500">Ví dụ dòng còn thiếu</p>
                <div className="mt-1">
                  <ResultTable columns={["MaSV", "HoTen", "Diem"]} rows={result.examples} />
                </div>
              </div>
            )}

            {(result?.kind === "fail" || ex.status === "Chưa đạt") && !showSolution && (
              <div className="rounded-lg border border-line p-4">
                <p className="text-sm font-semibold text-ink-900">Gợi ý theo bậc</p>
                {hintLevel >= 2 && (
                  <p className="mt-2 flex gap-2 text-sm text-ink-700">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
                    <span>
                      <span className="font-semibold">Khái niệm: </span>
                      {ex.conceptHint}
                    </span>
                  </p>
                )}
                {hintLevel >= 3 && (
                  <p className="mt-2 flex gap-2 text-sm text-ink-700">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
                    <span>
                      <span className="font-semibold">Gợi ý AI (không chứa đáp án): </span>
                      {ex.aiHint}
                    </span>
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {hintLevel < 3 && (
                    <button type="button" className="btn-ghost px-3 py-1.5" onClick={() => setHintLevel((l) => l + 1)}>
                      <Lightbulb className="h-4 w-4" aria-hidden />
                      {hintLevel === 1 ? "Gợi ý" : "Gợi ý thêm"}
                    </button>
                  )}
                  <button type="button" className="btn-ghost px-3 py-1.5 text-ink-500" onClick={() => setShowSolution(true)}>
                    <Eye className="h-4 w-4" aria-hidden />
                    Xem lời giải{failedSubmits < 3 ? " (tính chưa đạt)" : ""}
                  </button>
                </div>
              </div>
            )}

            {showSolution && (
              <div className="rounded-lg border border-line p-4">
                <p className="text-sm font-semibold text-ink-900">Lời giải tham khảo</p>
                <pre className="mt-2 overflow-x-auto rounded bg-ink-900 px-3 py-2 font-mono text-[12.5px] leading-5 text-white">{ex.solution}</pre>
                <p className="mt-2 text-xs text-ink-500">Bài đã xem lời giải được tính chưa đạt và vào hàng đợi làm lại.</p>
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-lg border border-line" aria-labelledby="schema-heading">
          <button
            type="button"
            onClick={() => setSchemaOpen((v) => !v)}
            aria-expanded={schemaOpen}
            className="focus-ring flex w-full items-center gap-2 px-4 py-3 text-left"
          >
            <Database className="h-4 w-4 text-indigo-600" aria-hidden />
            <span id="schema-heading" className="flex-1 text-sm font-semibold text-ink-900">
              Lược đồ CSDL mẫu
            </span>
            <ChevronDown className={`h-4 w-4 text-ink-500 transition-transform ${schemaOpen ? "rotate-180" : ""}`} aria-hidden />
          </button>
          {schemaOpen && (
            <ul className="space-y-3 border-t border-line px-4 py-3">
              {sandboxSchema.map((t) => (
                <li key={t.name}>
                  <p className="font-mono text-sm font-semibold text-ink-900">{t.name}</p>
                  <ul className="mt-1 space-y-0.5">
                    {t.columns.map((c) => (
                      <li key={c} className="font-mono text-xs text-ink-500">
                        {c}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
