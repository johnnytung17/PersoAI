"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { onGotoPage, reportViewing } from "@/lib/assistant";
import { keyPoints, slideDeck } from "@/lib/mock";

// Góc học tập: đọc slide ngay trên trang (không mở tab khác). Lối vào hỏi đáp duy nhất là nút nổi "Hỏi Trợ lý";
// Trợ lý vẫn biết trang đang xem qua reportViewing.
export function StudyCorner() {
  const [page, setPage] = useState(slideDeck.startPage);
  const [draft, setDraft] = useState(String(slideDeck.startPage));
  const slide = slideDeck.pages[page];

  useEffect(() => {
    setDraft(String(page));
    reportViewing({ file: slideDeck.file, page });
  }, [page]);
  useEffect(() => () => reportViewing(null), []);
  useEffect(() => onGotoPage((p) => setPage(Math.min(Math.max(1, p), slideDeck.total))), []);

  function go(p: number) {
    setPage(Math.min(Math.max(1, p), slideDeck.total));
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
      <section aria-label={`Tài liệu ${slideDeck.file}`} className="min-w-0 overflow-hidden rounded-lg border border-line">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-line bg-white px-4 py-3">
          <span className="min-w-0 basis-full break-all text-sm font-semibold text-indigo-600 sm:flex-1 sm:basis-auto">{slideDeck.file}</span>
          <div className="flex items-center gap-1.5 text-sm text-ink-500">
            <button type="button" className="focus-ring grid h-7 w-7 place-items-center rounded border border-line-strong hover:bg-slate-50 disabled:opacity-40" onClick={() => go(page - 1)} disabled={page <= 1} aria-label="Trang trước">
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <label htmlFor="slide-page">Trang</label>
            <input
              id="slide-page"
              inputMode="numeric"
              value={draft}
              onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
              onBlur={() => go(Number(draft) || page)}
              onKeyDown={(e) => e.key === "Enter" && go(Number(draft) || page)}
              className="focus-ring h-7 w-9 rounded border border-line-strong text-center text-ink-900"
            />
            <span>/ {slideDeck.total}</span>
            <button type="button" className="focus-ring grid h-7 w-7 place-items-center rounded border border-line-strong hover:bg-slate-50 disabled:opacity-40" onClick={() => go(page + 1)} disabled={page >= slideDeck.total} aria-label="Trang sau">
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        <div className="bg-slate-200/70 p-3 sm:p-6">
          {/* Màn hẹp: slide cao theo nội dung để không cắt chữ; từ sm giữ tỉ lệ 16:10. */}
          <article className="relative mx-auto min-h-[200px] w-full max-w-[680px] overflow-hidden rounded bg-white p-4 pb-7 shadow-lift sm:aspect-[16/10] sm:min-h-0 sm:p-[5%]" aria-label={`Trang ${page}`}>
            {slide ? (
              <>
                <h3 className="text-[clamp(15px,3.6vw,26px)] font-bold text-indigo-700">{slide.title}</h3>
                {slide.bullets && (
                  <ul className="mt-[3%] list-disc space-y-1 pl-5 text-[clamp(11px,2.2vw,16px)] text-ink-900">
                    {slide.bullets.map((b) => (
                      <li key={b.text}>
                        <span className={b.cite ? "bg-amber-100 px-0.5" : ""}>{b.text}</span>
                        {b.cite && <span className="ml-1.5 inline-block rounded bg-indigo-600 px-1 text-[0.7em] font-bold leading-snug text-white">{b.cite}</span>}
                      </li>
                    ))}
                  </ul>
                )}
                {slide.code && (
                  <pre className="mt-[3%] overflow-hidden rounded bg-slate-50 px-[3%] py-[2%] font-mono text-[clamp(9px,1.8vw,13px)] leading-relaxed text-ink-900">
                    {slide.code.map((line, i) => (
                      <span key={i} className={`block ${slide.highlight?.includes(i) ? "bg-amber-100" : ""}`}>
                        {line}
                      </span>
                    ))}
                  </pre>
                )}
              </>
            ) : (
              <div className="grid h-full place-items-center text-center text-[clamp(11px,2.2vw,15px)] text-ink-400">Trang {page} của tài liệu</div>
            )}
            <span className="absolute bottom-[3%] right-[3%] text-[10px] text-ink-400">{page}</span>
          </article>
        </div>
      </section>

      <aside>
        <section aria-labelledby="key-points" className="rounded-lg border border-line p-4 sm:p-5">
          <h3 id="key-points" className="text-base font-semibold text-ink-900">
            Ý chính cần nắm
          </h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-ink-700">
            {keyPoints.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}
