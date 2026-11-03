"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, FileText, Globe, Lightbulb, SendHorizontal, ShieldAlert, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { askQuestion } from "@/lib/api";
import { gotoPage, onViewing, type Viewing } from "@/lib/assistant";
import { useDemo } from "@/lib/demo";
import { chatSources, course, expandedAnswer, pageTitles, sampleAnswer, todayTaskId, type ChatSource, type Source, type StructuredAnswer } from "@/lib/mock";

// Trợ lý học tập (CHAT-01..10): nút nổi góc phải, chỉ mở khung khi bấm. Hỏi đáp của buổi học chỉ nằm ở đây.
// Re-ranking chạy ngầm (luôn bật); không có công tắc trên giao diện.
type Mode = "rag" | "agent" | "fallback" | "refusal";

type Msg =
  | { id: string; role: "user"; text: string }
  | {
      id: string;
      role: "assistant";
      mode: Mode;
      answer?: StructuredAnswer;
      raw?: string;
      sources: ChatSource[];
      expanded?: string;
      web?: { title: string; url: string }[];
      diff?: { from: string; to: string; state: "pending" | "accepted" | "rejected" };
      rating?: number;
    };

const OUT_OF_SCOPE = /(thời tiết|bóng đá|phim|nấu ăn|giá vàng|chứng khoán)/i;
const PLAN_INTENT = /(tuần này|kế hoạch|còn gì|lịch học|dời|chuyển nhiệm vụ)/i;

// Nguồn từ API (trang dạng "tr.12") → nguồn có số trang để mở đúng trang slide.
function toChatSource(s: Source): ChatSource {
  const n = Number(s.page?.match(/\d+/)?.[0] ?? 0);
  return { id: s.id, file: s.file, page: n, pageLabel: s.page ? s.page.replace(/^tr\./, "trang ") : s.section, quote: s.quote };
}

function CiteChip({ id, active, onClick }: { id: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`Xem nguồn ${id}`}
      className={`focus-ring mx-0.5 inline-flex items-center rounded px-1.5 py-px align-baseline text-[11px] font-bold transition-colors ${
        active ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
      }`}
    >
      {id}
    </button>
  );
}

/** Hiển thị **đậm**, `code` và thẻ [S1] trong câu trả lời. */
function Rich({ text, active, onCite }: { text: string; active: string | null; onCite: (id: string) => void }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[S\d+\])/).map((part, i) => {
        if (!part) return null;
        if (part.startsWith("**")) return <strong key={i} className="font-semibold text-ink-900">{part.slice(2, -2)}</strong>;
        if (part.startsWith("`")) return <code key={i} className="font-mono text-[0.92em] text-ink-900">{part.slice(1, -1)}</code>;
        const m = part.match(/^\[(S\d+)\]$/);
        if (m) return <CiteChip key={i} id={m[1]} active={active === m[1]} onClick={() => onCite(m[1])} />;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

const chip = "focus-ring rounded-full border px-3 py-1 text-xs font-semibold transition-colors";

export function ChatWidget({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [activeCite, setActiveCite] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Viewing | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pageName = pageTitles[pathname] ?? "PersoAI";
  // CHAT-02: chưa có môn thì không có tài liệu để trả lời; mời thêm môn trước.
  const { setup, firstWeek } = useDemo();
  const noCourse = !setup.course;

  useEffect(() => onViewing(setViewing), []);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);
  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  const onLesson = pathname === "/" && viewing !== null;

  function patch(id: string, fn: (m: Extract<Msg, { role: "assistant" }>) => Partial<Extract<Msg, { role: "assistant" }>>) {
    setMessages((ms) => ms.map((m) => (m.id === id && m.role === "assistant" ? { ...m, ...fn(m) } : m)));
  }

  function toggleCite(id: string, sources: ChatSource[]) {
    setActiveCite((a) => (a === id ? null : id));
    const s = sources.find((x) => x.id === id);
    if (s && s.page && onLesson) gotoPage(s.page);
  }

  async function ask(text: string) {
    if (!text.trim() || thinking || noCourse) return;
    setMessages((m) => [...m, { id: `u${Date.now()}`, role: "user", text }]);
    setDraft("");
    setThinking(true);
    const id = `a${Date.now()}`;
    const reply = (msg: Omit<Extract<Msg, { role: "assistant" }>, "id" | "role">) => setMessages((m) => [...m, { id, role: "assistant", ...msg }]);

    if (OUT_OF_SCOPE.test(text)) {
      reply({ mode: "refusal", raw: `Câu này nằm ngoài việc học môn ${course.name}. Bạn có thể hỏi, ví dụ: “Khi nào dùng LEFT JOIN?”`, sources: [] });
      setThinking(false);
      return;
    }
    if (PLAN_INTENT.test(text)) {
      // Agent: view_plan → propose_plan_change trả thẻ diff, chỉ lưu khi người dùng xác nhận.
      await new Promise((r) => window.setTimeout(r, 600));
      if (!setup.plan) reply({ mode: "agent", raw: "Bạn chưa có kế hoạch hoạt động. Hoàn tất chọn hướng học, lộ trình và xác nhận kế hoạch tuần ở trang Hôm nay.", sources: [] });
      else
        reply({
          mode: "agent",
          raw: "Tuần này còn 2 nhiệm vụ: GROUP BY (T6, 30 phút) và Bài tập JOIN (T7, 25 phút). Tối T6 bạn hay bỏ lỡ, có thể dời GROUP BY sang sáng CN.",
          sources: [],
          diff: { from: "T6 19:00 · GROUP BY 30 phút", to: "CN 09:00 · GROUP BY 30 phút", state: "pending" },
        });
      setThinking(false);
      return;
    }

    const result = await askQuestion(text, todayTaskId);
    if (result && !result.fallback) {
      reply({ mode: result.refusal ? "refusal" : "rag", raw: result.answer, sources: result.sources.map(toChatSource) });
    } else {
      // Backend chưa chạy: dùng câu trả lời mẫu theo lược đồ JSON của SDD Mục 4.1.
      await new Promise((r) => window.setTimeout(r, 600));
      reply({ mode: "fallback", answer: sampleAnswer, sources: chatSources });
    }
    setThinking(false);
  }

  const context = noCourse
    ? "Chưa có môn học"
    : pathname === "/" && setup.plan
      ? `Nhiệm vụ: JOIN và GROUP BY${firstWeek ? " · tuần 1" : ""}`
      : `${pageName} · ${course.code}`;
  const lastAnswer = [...messages].reverse().find((m) => m.role === "assistant");
  const followups =
    lastAnswer && lastAnswer.role === "assistant" && lastAnswer.answer ? lastAnswer.answer.followups.filter((q) => setup.plan || !PLAN_INTENT.test(q)) : [];

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            type="button"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="focus-ring fixed bottom-6 right-6 z-40 inline-flex h-14 min-w-14 items-center justify-center gap-2 rounded-full bg-indigo-600 px-0 text-white shadow-lift transition-colors hover:bg-indigo-700 sm:px-5"
            aria-label="Mở Trợ lý học tập"
          >
            <Sparkles className="h-5 w-5" aria-hidden />
            <span className="hidden text-[15px] font-semibold sm:inline">Hỏi Trợ lý</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.section
            role="dialog"
            aria-label="Trợ lý học tập"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 bottom-0 z-50 flex h-[72vh] flex-col rounded-t-2xl border border-line bg-white shadow-[0_-8px_24px_rgba(13,15,18,0.12)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[min(640px,calc(100vh-6rem))] sm:w-[380px] sm:rounded-xl sm:shadow-lift"
          >
            <header className="flex items-center gap-3 border-b border-line px-4 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-600 text-white" aria-hidden>
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-ink-900">Trợ lý học tập</h2>
                <p className="truncate text-xs text-ink-500" title={context}>
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-ink-500 align-middle" aria-hidden />
                  {context}
                </p>
              </div>
              <button type="button" className="focus-ring rounded p-1.5 text-ink-500 hover:bg-slate-50" onClick={() => setOpen(false)} aria-label="Đóng Trợ lý">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </header>

            <div ref={listRef} role="log" aria-live="polite" className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {onLesson && viewing && (
                <p className="flex items-center gap-1.5 rounded-lg border border-line bg-muted px-3 py-2 text-xs text-ink-500">
                  <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Đang xem:
                  <span className="truncate font-semibold text-ink-900">
                    {viewing.file} · trang {viewing.page}
                  </span>
                </p>
              )}

              {messages.length === 0 && noCourse && (
                <div className="rounded-lg border border-line p-4">
                  <p className="text-sm font-semibold text-ink-900">Chưa có môn học để hỏi</p>
                  <p className="mt-1 text-sm text-ink-500">Trợ lý chỉ trả lời từ tài liệu môn của bạn. Thêm một môn và tải tài liệu, sau đó bạn có thể hỏi ở đây.</p>
                  <Link href="/mon-hoc" onClick={() => setOpen(false)} className="btn-primary mt-3 px-3 py-1.5 text-xs">
                    Thêm môn học
                  </Link>
                </div>
              )}
              {messages.length === 0 && !noCourse && (
                <div className="pt-1">
                  <p className="text-sm text-ink-500">Hỏi về {onLesson ? "trang đang xem hoặc nhiệm vụ này" : course.name}. Câu trả lời ngắn, lấy từ tài liệu môn và có nguồn [S].</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["Khi nào dùng HAVING thay WHERE?", ...(setup.plan ? ["Tuần này tôi còn gì?"] : [])].map((q) => (
                      <button key={q} type="button" onClick={() => ask(q)} className={`${chip} border-indigo-600 text-indigo-600 hover:bg-indigo-50`}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <p className="max-w-[85%] rounded-lg bg-indigo-600 px-3.5 py-2 text-sm text-white">
                      <span className="sr-only">Bạn: </span>
                      {m.text}
                    </p>
                  </div>
                ) : (
                  <article key={m.id} className={`rounded-lg border p-3.5 text-sm leading-relaxed text-ink-700 ${m.mode === "refusal" ? "border-amber-300 bg-amber-50/40" : "border-line bg-muted"}`}>
                    <span className="sr-only">Trợ lý: </span>
                    {m.mode === "refusal" && (
                      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                        <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
                        Không đủ bằng chứng trong tài liệu
                      </p>
                    )}

                    {m.answer ? (
                      <>
                        {m.answer.direct && <p className="mb-1.5 font-semibold text-ink-900">{m.answer.direct}</p>}
                        <ul className="list-disc space-y-1.5 pl-5">
                          {m.answer.points.map((p, i) => (
                            <li key={i}>
                              <Rich text={p.text} active={activeCite} onCite={(c) => toggleCite(c, m.sources)} />
                              {p.cite.map((c) => (
                                <CiteChip key={c} id={c} active={activeCite === c} onClick={() => toggleCite(c, m.sources)} />
                              ))}
                            </li>
                          ))}
                        </ul>
                        {m.answer.example && (
                          <pre className="mt-2 whitespace-pre-wrap break-words rounded bg-ink-900 px-3 py-2 font-mono text-[12px] leading-5 text-white">{m.answer.example}</pre>
                        )}
                      </>
                    ) : (
                      <p>
                        <Rich text={m.raw ?? ""} active={activeCite} onCite={(c) => toggleCite(c, m.sources)} />
                      </p>
                    )}

                    {m.expanded && (
                      <div className="mt-3 border-t border-line pt-3">
                        <p className="mb-1 text-xs font-semibold text-ink-500">Giải thích kỹ hơn (cùng nguồn)</p>
                        <p>
                          <Rich text={m.expanded} active={activeCite} onCite={(c) => toggleCite(c, m.sources)} />
                        </p>
                      </div>
                    )}

                    {m.diff && (
                      <div className="mt-3 rounded-lg border border-line bg-white p-3">
                        <p className="text-xs font-semibold text-ink-500">Đề xuất đổi kế hoạch · chưa lưu</p>
                        <p className="mt-1.5 text-sm text-rose-700 line-through">{m.diff.from}</p>
                        <p className="text-sm font-semibold text-emerald-700">{m.diff.to}</p>
                        {m.diff.state === "pending" ? (
                          <div className="mt-2 flex gap-2">
                            <button type="button" className="btn-primary px-3 py-1.5 text-xs" onClick={() => patch(m.id, (x) => ({ diff: { ...x.diff!, state: "accepted" } }))}>
                              Xác nhận
                            </button>
                            <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={() => patch(m.id, (x) => ({ diff: { ...x.diff!, state: "rejected" } }))}>
                              Bỏ qua
                            </button>
                          </div>
                        ) : (
                          <p className="mt-2 text-xs font-semibold text-ink-500">
                            {m.diff.state === "accepted" ? "Đã gửi qua bộ kiểm tra V1–V10, tạo phiên bản kế hoạch mới." : "Đã bỏ qua, kế hoạch không đổi."}
                          </p>
                        )}
                      </div>
                    )}

                    {m.sources.length > 0 && (
                      <div className="mt-3 border-t border-dashed border-line-strong pt-2">
                        <p className="text-xs text-ink-500">Nguồn trong tài liệu</p>
                        <ul className="mt-1 space-y-0.5">
                          {m.sources.map((s) => (
                            <li key={s.id}>
                              <button
                                type="button"
                                onClick={() => toggleCite(s.id, m.sources)}
                                className={`focus-ring flex w-full flex-wrap items-baseline gap-x-2 rounded px-2 py-1.5 text-left text-xs ${activeCite === s.id ? "bg-indigo-50" : "hover:bg-white"}`}
                              >
                                <span className={`rounded px-1.5 font-bold ${activeCite === s.id ? "bg-indigo-600 text-white" : "text-indigo-700"}`}>{s.id}</span>
                                <span className="font-semibold text-indigo-600 underline-offset-2 hover:underline">{s.file}</span>
                                <span className="text-ink-500">· {s.pageLabel}</span>
                                {activeCite === s.id && <span className="mt-1 block w-full italic text-ink-700">“{s.quote}”</span>}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {m.web && (
                      <div className="mt-3 rounded-lg border border-dashed border-amber-400 bg-amber-50/50 p-3">
                        <p className="text-xs font-semibold text-amber-800">Nguồn ngoài – chưa kiểm chứng</p>
                        <ul className="mt-1.5 space-y-1">
                          {m.web.map((w) => (
                            <li key={w.url} className="flex items-center gap-1.5 text-xs text-ink-700">
                              <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                              <span className="truncate">{w.title}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(m.mode === "rag" || m.mode === "fallback" || m.mode === "refusal") && (
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        {m.mode !== "refusal" && !m.expanded && (
                          <>
                            <button type="button" className="focus-ring rounded font-semibold text-indigo-600 hover:underline" onClick={() => patch(m.id, () => ({ expanded: expandedAnswer }))}>
                              Giải thích kỹ hơn
                            </button>
                            <button type="button" className="focus-ring inline-flex items-center gap-1 rounded font-semibold text-indigo-600 hover:underline" onClick={() => ask("Cho ví dụ")}>
                              <Lightbulb className="h-3 w-3" aria-hidden />
                              Cho ví dụ
                            </button>
                          </>
                        )}
                        {!m.web && (
                          <button
                            type="button"
                            className="focus-ring inline-flex items-center gap-1 rounded font-semibold text-indigo-600 hover:underline"
                            onClick={() =>
                              patch(m.id, () => ({
                                web: [
                                  { title: "PostgreSQL docs — Aggregate functions & HAVING", url: "https://www.postgresql.org/docs/" },
                                  { title: "W3Schools — SQL HAVING Clause", url: "https://www.w3schools.com/sql/" },
                                ],
                              }))
                            }
                          >
                            <Globe className="h-3 w-3" aria-hidden />
                            Tìm thêm trên web
                          </button>
                        )}
                        {m.mode !== "refusal" && (
                          <span className="ml-auto flex items-center gap-0.5 text-[11px] text-ink-400" role="group" aria-label="Đánh giá câu trả lời 1 đến 3">
                            Hữu ích?
                            {[1, 2, 3].map((n) => (
                              <button
                                key={n}
                                type="button"
                                aria-pressed={m.rating === n}
                                onClick={() => patch(m.id, () => ({ rating: n }))}
                                className={`focus-ring grid h-5 w-5 place-items-center rounded text-[11px] font-semibold ${m.rating === n ? "bg-indigo-600 text-white" : "hover:bg-slate-100"}`}
                              >
                                {n}
                              </button>
                            ))}
                          </span>
                        )}
                      </div>
                    )}
                  </article>
                ),
              )}

              {followups.length > 0 && !thinking && (
                <div className="flex flex-col items-start gap-2">
                  {followups.map((q) => (
                    <button key={q} type="button" onClick={() => ask(q)} className={`${chip} border-indigo-600 text-indigo-600 hover:bg-indigo-50`}>
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {thinking && (
                <p className="flex items-center gap-2 text-xs text-ink-500">
                  <span className="flex gap-1" aria-hidden>
                    {[0, 1, 2].map((d) => (
                      <motion.span key={d} className="h-1.5 w-1.5 rounded-full bg-indigo-600" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15 }} />
                    ))}
                  </span>
                  Đang tìm trong tài liệu môn…
                </p>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void ask(draft);
              }}
              className="border-t border-line px-4 pb-3 pt-3"
            >
              <label htmlFor="chat-widget-input" className="sr-only">
                Câu hỏi
              </label>
              <div className="flex items-center gap-2 rounded-lg border-2 border-indigo-600/80 p-1.5 pl-3 focus-within:border-indigo-600">
                <textarea
                  id="chat-widget-input"
                  ref={inputRef}
                  rows={1}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void ask(draft);
                    }
                  }}
                  placeholder={noCourse ? "Thêm môn học để bắt đầu hỏi" : pathname === "/" ? "Hỏi về nhiệm vụ này…" : `Hỏi về ${course.name}…`}
                  disabled={noCourse}
                  className="max-h-28 min-w-0 flex-1 resize-none bg-transparent py-1.5 text-sm text-ink-900 outline-none placeholder:text-ink-400"
                />
                <button type="submit" className="btn-primary h-8 w-10 shrink-0 rounded-md p-0" disabled={!draft.trim() || thinking} aria-label="Gửi">
                  <SendHorizontal className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-ink-500">Trả lời ngắn, có nguồn. Thiếu bằng chứng thì Trợ lý nói rõ.</p>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
