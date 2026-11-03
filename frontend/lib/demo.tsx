"use client";

// Trạng thái tài khoản mẫu khi chưa có đăng nhập thật: Tùng (đang học) và Lan (người mới, persona SRS 4.1).
// Lưu tạm ở localStorage; khi có backend auth thì thay bằng dữ liệu từ PostgreSQL.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type AccountId = "tung" | "lan";
export type SetupStep = "survey" | "course" | "roadmap" | "plan";
export type Setup = Record<SetupStep, boolean>;

export const setupSteps: { key: SetupStep; label: string; hint: string; href: string }[] = [
  { key: "survey", label: "Khảo sát hồ sơ học tập", hint: "Kể về thói quen, giờ bận, điểm mạnh/yếu; xác nhận 12 trường", href: "/khao-sat" },
  { key: "course", label: "Thêm môn học và tài liệu", hint: "Mục tiêu, hạn chót và ít nhất một tài liệu đã lập chỉ mục", href: "/mon-hoc" },
  { key: "roadmap", label: "Chọn hướng học và xác nhận lộ trình", hint: "Chọn 1 trong 2–3 hướng, lộ trình qua kiểm tra R1–R6", href: "/lo-trinh" },
  { key: "plan", label: "Xác nhận kế hoạch tuần", hint: "Nhiệm vụ theo ngày cho tuần kế tiếp, qua kiểm tra V1–V10", href: "/ke-hoach" },
];

export const accounts: Record<AccountId, { name: string; className: string; initials: string; email: string }> = {
  tung: { name: "Tùng", className: "IT250", initials: "T", email: "tung@persoai.demo" },
  lan: { name: "Lan", className: "Năm 2", initials: "L", email: "lan@persoai.demo" },
};

const DONE: Setup = { survey: true, course: true, roadmap: true, plan: true };
const EMPTY: Setup = { survey: false, course: false, roadmap: false, plan: false };
const KEY = "persoai.demo";

type State = { account: AccountId; setup: Setup };
type Ctx = State & {
  ready: boolean;
  user: (typeof accounts)[AccountId];
  /** Lan đã xong thiết lập nhưng chưa học buổi nào. */
  firstWeek: boolean;
  setupDone: boolean;
  nextStep: (typeof setupSteps)[number] | null;
  login: (account: AccountId, fresh?: boolean) => State;
  logout: () => void;
  complete: (step: SetupStep) => void;
};

const DemoCtx = createContext<Ctx | null>(null);

function read(): State | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as State) : null;
  } catch {
    return null;
  }
}

function write(s: State | null) {
  try {
    if (s) window.localStorage.setItem(KEY, JSON.stringify(s));
    else window.localStorage.removeItem(KEY);
  } catch {
    /* trình duyệt chặn lưu trữ: vẫn chạy với trạng thái trong bộ nhớ */
  }
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>({ account: "tung", setup: DONE });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = read();
    if (saved) setState(saved);
    setReady(true);
  }, []);

  const login = useCallback((account: AccountId, fresh = false) => {
    const prev = read();
    const next: State = {
      account,
      setup: account === "tung" ? DONE : !fresh && prev?.account === "lan" ? prev.setup : EMPTY,
    };
    setState(next);
    write(next);
    return next;
  }, []);

  const logout = useCallback(() => {
    write(null);
    setState({ account: "tung", setup: DONE });
  }, []);

  const complete = useCallback((step: SetupStep) => {
    setState((s) => {
      if (s.setup[step]) return s;
      const next = { ...s, setup: { ...s.setup, [step]: true } };
      write(next);
      return next;
    });
  }, []);

  const value = useMemo<Ctx>(() => {
    const nextStep = setupSteps.find((s) => !state.setup[s.key]) ?? null;
    return {
      ...state,
      ready,
      user: accounts[state.account],
      setupDone: nextStep === null,
      firstWeek: state.account === "lan" && nextStep === null,
      nextStep,
      login,
      logout,
      complete,
    };
  }, [state, ready, login, logout, complete]);

  return <DemoCtx.Provider value={value}>{children}</DemoCtx.Provider>;
}

export function useDemo() {
  const c = useContext(DemoCtx);
  if (!c) throw new Error("useDemo must be used inside DemoProvider");
  return c;
}
