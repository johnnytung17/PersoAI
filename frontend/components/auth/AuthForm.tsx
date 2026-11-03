"use client";

import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { accounts, useDemo, type AccountId } from "@/lib/demo";

// Bản mẫu: không có backend. Mật khẩu mẫu sai sẽ hiện lỗi để minh hoạ AUTH-01.
const WRONG_PASSWORD = "sai123";

function Field({
  id,
  label,
  type,
  value,
  onChange,
  icon,
  autoComplete,
  hint,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
  autoComplete: string;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-ink-700">
        {label}
      </label>
      <div className="relative mt-1.5">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" aria-hidden>
          {icon}
        </span>
        <input
          id={id}
          type={isPassword && show ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
          className="field pl-10 pr-11"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="focus-ring absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-400 hover:text-ink-700"
            aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {show ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          </button>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLogin = mode === "login";
  const demo = useDemo();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (isLogin && password === WRONG_PASSWORD) {
      setError("Email hoặc mật khẩu không đúng.");
      return;
    }
    if (!isLogin && password.length < 8) {
      setError("Mật khẩu cần ít nhất 8 ký tự.");
      return;
    }
    if (!isLogin && password !== confirm) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }
    if (!isLogin && !consent) {
      setError("Bạn cần đồng ý với điều khoản dữ liệu để tiếp tục.");
      return;
    }
    setError(null);
    // Đăng ký = người dùng mới (Lan, bắt đầu trống). Đăng nhập: chưa xác nhận hồ sơ thì về Khảo sát (activity 4.2).
    const s = isLogin ? demo.login(email.trim().toLowerCase() === accounts.lan.email ? "lan" : "tung") : demo.login("lan", true);
    router.push(s.setup.survey ? "/" : "/khao-sat");
  }

  function fillDemo(id: AccountId) {
    setEmail(accounts[id].email);
    setPassword("demo1234");
    setError(null);
  }

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="hidden flex-col justify-between bg-indigo-50 p-12 lg:flex">
        <span className="text-[26px] font-bold tracking-tight text-indigo-600">
          perso<span className="text-ink-900">AI</span>
        </span>
        <div className="max-w-md">
          <h2 className="text-[34px] font-semibold leading-tight text-ink-900">Một tuần bạn thật sự học xong, với câu trả lời từ chính tài liệu môn học.</h2>
          <ul className="mt-8 space-y-3 text-[15px] text-ink-700">
            {[
              "Kế hoạch kiểm tra theo giờ rảnh và hạn chót thật",
              "Hỏi đáp ngắn gọn, trích nguồn từ tài liệu môn",
              "Thực hành SQL chạy thật và bài luyện sau mỗi buổi",
              "Báo cáo tuần từ nhật ký bạn đã ghi",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-ink-500">Đồ án tốt nghiệp · Kỹ thuật phần mềm · JIT</p>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <span className="mb-8 block text-[24px] font-bold tracking-tight text-indigo-600 lg:hidden">
            perso<span className="text-ink-900">AI</span>
          </span>
          <h1 className="text-[28px] font-semibold tracking-tight text-ink-900">{isLogin ? "Đăng nhập" : "Tạo tài khoản"}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {isLogin ? "Chào mừng bạn quay lại. Đăng nhập để tiếp tục kế hoạch tuần." : "Chỉ cần email và mật khẩu. Hồ sơ học tập sẽ tạo ở bước sau."}
          </p>

          <form onSubmit={submit} className="card mt-6 space-y-4 p-6" noValidate>
            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 ring-1 ring-rose-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {error}
              </p>
            )}
            <Field id="email" label="Email" type="email" value={email} onChange={setEmail} icon={<Mail className="h-4 w-4" />} autoComplete="email" />
            <Field
              id="password"
              label="Mật khẩu"
              type="password"
              value={password}
              onChange={setPassword}
              icon={<Lock className="h-4 w-4" />}
              autoComplete={isLogin ? "current-password" : "new-password"}
              hint={isLogin ? undefined : "Ít nhất 8 ký tự. Mật khẩu được lưu dạng băm, không lưu bản gốc."}
            />
            {!isLogin && (
              <>
                <Field
                  id="confirm"
                  label="Nhập lại mật khẩu"
                  type="password"
                  value={confirm}
                  onChange={setConfirm}
                  icon={<Lock className="h-4 w-4" />}
                  autoComplete="new-password"
                />
                <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-slate-50 p-3 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-600"
                  />
                  <span>
                    Tôi từ 18 tuổi trở lên và đồng ý để PersoAI gửi các đoạn cần thiết tới dịch vụ LLM bên ngoài (gói không dùng dữ liệu để huấn luyện).
                  </span>
                </label>
              </>
            )}
            <button type="submit" className="btn-primary w-full">
              {isLogin ? "Đăng nhập" : "Tạo tài khoản"}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
            {isLogin && (
              <div className="border-t border-line pt-4">
                <p className="text-xs font-semibold text-ink-500">Tài khoản mẫu để demo</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => fillDemo("lan")}>
                    Người mới · Lan
                  </button>
                  <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => fillDemo("tung")}>
                    Đang học · Tùng
                  </button>
                </div>
              </div>
            )}
            {isLogin && (
              <p className="flex items-center justify-center gap-1.5 text-xs text-ink-400">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                Phiên đăng nhập tự hết hạn sau 8 giờ không hoạt động.
              </p>
            )}
          </form>

          <p className="mt-5 text-center text-sm text-ink-500">
            {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
            <Link href={isLogin ? "/dang-ky" : "/dang-nhap"} className="focus-ring rounded font-semibold text-indigo-600 hover:underline">
              {isLogin ? "Đăng ký" : "Đăng nhập"}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
