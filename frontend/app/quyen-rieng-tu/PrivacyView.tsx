"use client";

import { AlertOctagon, CheckCircle2, Download, Send, ShieldCheck, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import { FadeUp } from "@/components/ui/FadeUp";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { privacyNotSent, privacySent } from "@/lib/mock";

export function PrivacyView() {
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <FadeUp>
        <div className="rounded-lg bg-indigo-50 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <ShieldCheck className="mt-0.5 h-7 w-7 shrink-0 text-indigo-600" aria-hidden />
            <div>
              <h2 className="text-xl font-semibold text-ink-900">Dữ liệu nào được gửi tới mô hình ngôn ngữ (LLM)?</h2>
              <p className="mt-1 text-sm leading-6 text-ink-700">
                PersoAI chỉ gửi phần tối thiểu cần thiết để trả lời câu hỏi và viết nhận xét. Kế hoạch và số liệu được tính
                bằng quy tắc và SQL, không cần gửi lịch của bạn cho LLM.
              </p>
            </div>
          </div>
        </div>
      </FadeUp>

      <div className="grid gap-4 md:grid-cols-2">
        <FadeUp delay={0.05}>
          <section aria-labelledby="sent-heading" className="card h-full p-5">
            <h3 id="sent-heading" className="flex items-center gap-2 text-sm font-bold text-ink-900">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-50 text-indigo-600" aria-hidden>
                <Send className="h-3.5 w-3.5" />
              </span>
              Được gửi
            </h3>
            <ul className="mt-3 space-y-2.5">
              {privacySent.map((t) => (
                <li key={t} className="flex gap-2.5 text-sm text-ink-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </section>
        </FadeUp>
        <FadeUp delay={0.1}>
          <section aria-labelledby="notsent-heading" className="card h-full p-5">
            <h3 id="notsent-heading" className="flex items-center gap-2 text-sm font-bold text-ink-900">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600" aria-hidden>
                <ShieldCheck className="h-3.5 w-3.5" />
              </span>
              Không bao giờ gửi
            </h3>
            <ul className="mt-3 space-y-2.5">
              {privacyNotSent.map((t) => (
                <li key={t} className="flex gap-2.5 text-sm text-ink-700">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </section>
        </FadeUp>
      </div>

      <FadeUp delay={0.15}>
        <section aria-labelledby="data-heading" className="card p-5 sm:p-6">
          <h3 id="data-heading" className="text-base font-bold text-ink-900">
            Dữ liệu của bạn
          </h3>
          <div className="mt-4 flex flex-col gap-4 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink-900">Tải bản sao dữ liệu</p>
              <p className="text-sm text-ink-500">Hồ sơ, kế hoạch, nhật ký học và lịch sử hỏi đáp.</p>
            </div>
            <button
              type="button"
              className="btn-secondary shrink-0"
              onClick={() => toast.show("Đang chuẩn bị bản sao dữ liệu (bản mẫu)")}
            >
              <Download className="h-4 w-4" aria-hidden />
              Tải dữ liệu của tôi
            </button>
          </div>
          <div className="mt-3 flex flex-col gap-4 rounded-2xl border border-rose-200 bg-rose-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-rose-800">Vùng nguy hiểm</p>
              <p className="text-sm text-rose-700/80">Xoá vĩnh viễn tài khoản, tài liệu, kế hoạch và nhật ký.</p>
            </div>
            <button type="button" className="btn-danger shrink-0" onClick={() => setConfirmOpen(true)}>
              <Trash2 className="h-4 w-4" aria-hidden />
              Xoá tài khoản và toàn bộ dữ liệu
            </button>
          </div>
        </section>
      </FadeUp>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Xoá tài khoản và toàn bộ dữ liệu?"
        description="Hành động này không thể hoàn tác."
        tone="danger"
        size="sm"
        icon={<AlertOctagon className="h-5 w-5" />}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setConfirmOpen(false)} data-autofocus>
              Huỷ
            </button>
            <button type="button" className="btn-danger" onClick={() => setConfirmOpen(false)}>
              <Trash2 className="h-4 w-4" aria-hidden />
              Xoá vĩnh viễn
            </button>
          </>
        }
      >
        <p className="text-sm leading-6 text-ink-700">
          Toàn bộ tài liệu đã tải lên, hồ sơ, các phiên bản kế hoạch, nhật ký học và lịch sử hỏi đáp sẽ bị xoá khỏi PersoAI.
        </p>
        <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-ink-500">
          Đây là bản giao diện mẫu — không có dữ liệu nào thực sự bị xoá.
        </p>
      </Modal>
    </div>
  );
}
