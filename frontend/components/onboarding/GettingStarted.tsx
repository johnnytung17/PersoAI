"use client";

import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { setupSteps, useDemo } from "@/lib/demo";
import { todayLabel } from "@/lib/mock";

// Trang Hôm nay của người dùng mới: danh sách 4 bước thiết lập theo vòng học (SRS 2.3, bước 1–5).
export function GettingStarted() {
  const { user, setup, nextStep } = useDemo();
  const done = setupSteps.filter((s) => setup[s.key]).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Chào {user.name}, còn {setupSteps.length - done} bước để bắt đầu học</h1>
        <p className="mt-1 text-[15px] text-ink-500">{todayLabel} · Thiết lập một lần cho mỗi mục tiêu, sau đó PersoAI giao nhiệm vụ mỗi ngày.</p>
      </div>

      <section aria-labelledby="gs-heading" className="card max-w-3xl overflow-hidden">
        <div className="border-b border-line px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <h2 id="gs-heading" className="text-lg font-semibold text-ink-900">
              Bắt đầu
            </h2>
            <span className="text-sm font-semibold text-ink-500">
              {done}/{setupSteps.length} bước
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={setupSteps.length} aria-label="Tiến độ thiết lập">
            <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${(done / setupSteps.length) * 100}%` }} />
          </div>
        </div>
        <ol className="divide-y divide-line">
          {setupSteps.map((s, i) => {
            const isDone = setup[s.key];
            const isNext = nextStep?.key === s.key;
            return (
              <li key={s.key} className={`flex items-start gap-4 px-5 py-4 sm:px-6 ${isNext ? "bg-indigo-50/60" : ""}`}>
                {isDone ? (
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" aria-label="Đã xong" />
                ) : (
                  <Circle className={`mt-0.5 h-6 w-6 shrink-0 ${isNext ? "text-indigo-600" : "text-ink-400"}`} aria-label="Chưa làm" />
                )}
                <div className="min-w-0 flex-1">
                  <p className={`font-semibold ${isDone ? "text-ink-500" : "text-ink-900"}`}>
                    {i + 1}. {s.label}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-500">{s.hint}</p>
                  {/* Màn hẹp: nút nằm dưới mô tả để chữ không bị ép thành cột hẹp. */}
                  {isNext && (
                    <Link href={s.href} className="btn-primary mt-3 px-3 py-2 sm:hidden">
                      {done === 0 ? "Bắt đầu" : "Tiếp tục"}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  )}
                </div>
                {isDone ? (
                  <span className="hidden text-sm font-semibold text-emerald-700 sm:inline">Đã xong</span>
                ) : isNext ? (
                  <Link href={s.href} className="btn-primary hidden shrink-0 px-3 py-2 sm:inline-flex">
                    {done === 0 ? "Bắt đầu" : "Tiếp tục"}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                ) : (
                  <Link href={s.href} className="hidden shrink-0 text-sm font-semibold text-indigo-600 hover:underline sm:inline">
                    Xem
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </section>
      <p className="mt-4 max-w-3xl text-sm text-ink-500">
        Mọi bản nháp do AI soạn (hồ sơ, lộ trình, kế hoạch) chỉ được lưu khi bạn xác nhận.
      </p>
    </div>
  );
}
