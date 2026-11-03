// Gọi API NestJS. Frontend vẫn chạy được khi backend tắt: các hàm trả null để màn hình dùng dữ liệu cục bộ.
import type { Source } from "./mock";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");

type ApiSource = { tag: string; doc: string; page: string; section: string; quote: string; before: string; after: string };

export type AskResult = {
  answer: string;
  refusal: boolean;
  sources: Source[];
  config: string;
  candidates: number;
  latencyMs: number;
  fallback: boolean;
};

// App chỉ chạy một bản (re-ranking bật mặc định ở NestJS); so sánh A/B chạy riêng bằng experiments/run_ab.py.
export async function askQuestion(question: string, taskId: string): Promise<AskResult | null> {
  try {
    const res = await fetch(`${API_URL}/api/qa/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, taskId }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      answer: data.answer,
      refusal: data.refusal,
      config: data.config,
      candidates: data.rankingBefore?.length ?? 0,
      latencyMs: data.latencyMs,
      fallback: data.fallback,
      sources: (data.sources as ApiSource[]).map((s) => ({
        id: s.tag,
        file: s.doc,
        page: s.page || undefined,
        section: s.section,
        quote: s.quote,
        before: s.before ? `${s.before} ` : "",
        after: s.after ? ` ${s.after}` : "",
      })),
    };
  } catch {
    return null;
  }
}

export type RuleCheck = { id: string; ok: boolean; blocking: boolean; label: string; detail?: string };

export async function validatePlan(days: unknown, budget: number): Promise<RuleCheck[] | null> {
  try {
    const res = await fetch(`${API_URL}/api/plan/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days, budget }),
    });
    if (!res.ok) return null;
    return (await res.json()).checks as RuleCheck[];
  } catch {
    return null;
  }
}

/** Tách "… [S1] …" thành đoạn chữ và chip trích dẫn. */
export function toSegments(answer: string): ({ text: string } | { cite: string })[] {
  return answer
    .split(/(\[S\d+\])/)
    .filter(Boolean)
    .map((part) => {
      const m = part.match(/^\[(S\d+)\]$/);
      return m ? { cite: m[1] } : { text: part };
    });
}

/* ---------- Dữ liệu từ PostgreSQL qua NestJS ---------- */

/** Gọi API dữ liệu; trả null khi backend hoặc CSDL chưa sẵn sàng để màn hình dùng dữ liệu mẫu. */
export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}/api${path}`, {
      method: init?.method ?? "GET",
      headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Như api() nhưng trả thông báo lỗi của máy chủ (400/404) để hiển thị cho người dùng. */
export async function apiOrError<T>(path: string, init?: { method?: string; body?: unknown }): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(`${API_URL}/api${path}`, {
      method: init?.method ?? "GET",
      headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) return { data: null, error: (json && (json.message as string)) || `Lỗi ${res.status}` };
    return { data: json as T, error: null };
  } catch {
    return { data: null, error: "Không kết nối được máy chủ API." };
  }
}
