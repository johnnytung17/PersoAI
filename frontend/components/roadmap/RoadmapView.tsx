"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Loader2, Target, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useDemo } from "@/lib/demo";
import { directions, lanMilestones, lanRoadmapRules, milestones, roadmapRules } from "@/lib/mock";

const BUDGET = 180;

const stateStyle = {
  done: { label: "Đã xong", cls: "bg-emerald-50 text-emerald-700" },
  current: { label: "Tuần này", cls: "bg-indigo-600 text-white" },
  next: { label: "Sắp tới", cls: "bg-slate-100 text-ink-500" },
  behind: { label: "Chậm", cls: "bg-rose-50 text-rose-700" },
} as const;

// Hướng học → lộ trình (UC-05, UC-06): chọn đúng 1 hướng; lộ trình qua R1–R6 và chỉ lưu khi xác nhận.
export function RoadmapView() {
  const { ready, setup, account, complete } = useDemo();
  if (!ready) return null;
  if (!setup.survey || !setup.course)
    return (
      <EmptyState
        icon={<Target className="h-8 w-8" />}
        title={!setup.survey ? "Cần hồ sơ học tập trước" : "Cần mục tiêu môn và tài liệu trước"}
        text="Hướng học được đề xuất từ hồ sơ (quỹ giờ, điểm yếu) và mục tiêu môn (hạn chót); nội dung môn lấy từ tài liệu đã lập chỉ mục."
        href={!setup.survey ? "/khao-sat" : "/mon-hoc"}
        action={!setup.survey ? "Làm khảo sát" : "Thêm môn học"}
      />
    );
  const isNew = account === "lan";
  return <RoadmapBody key={account} isNew={isNew} hasRoadmap={setup.roadmap} onConfirmed={() => complete("roadmap")} />;
}

function RoadmapBody({ isNew, hasRoadmap, onConfirmed }: { isNew: boolean; hasRoadmap: boolean; onConfirmed: () => void }) {
  const toast = useToast();
  // Người mới chưa có lộ trình: chưa chọn hướng nào (BR-04: chọn đúng một hướng rồi mới lập lịch).
  const [active, setActive] = useState<string | null>(hasRoadmap ? "d1" : null);
  const [picked, setPicked] = useState<string | null>(hasRoadmap ? "d1" : null);
  const [phase, setPhase] = useState<"active" | "drafting" | "draft">("active");
  const [version, setVersion] = useState(hasRoadmap ? 1 : 0);
  const changed = picked !== null && picked !== active;
  // Lan bắt đầu tuần 02/11: 3 tuần tới hạn 20/11; Tùng theo lộ trình 4 tuần từ 26/10.
  const shownMilestones = isNew ? lanMilestones : milestones;
  const rules = isNew ? lanRoadmapRules : roadmapRules;
  const weeks = shownMilestones.length;

  function draft() {
    setPhase("drafting");
    window.setTimeout(() => setPhase("draft"), 900);
  }

  function confirm() {
    setActive(picked);
    setVersion((v) => v + 1);
    setPhase("active");
    onConfirmed();
    toast.show(version === 0 ? "Đã lưu lộ trình phiên bản 1" : `Đã lưu lộ trình phiên bản ${version + 1}; bản trước được giữ lại`);
  }

  const blocking = rules.filter((r) => !r.ok && !r.warn).length;

  return (
    <div className="space-y-10">
      <section aria-labelledby="goal-heading" className="card flex flex-wrap items-center gap-x-8 gap-y-3 p-5 sm:p-6">
        <div className="min-w-0 flex-1">
          <p className="label-eyebrow">Mục tiêu môn</p>
          <h2 id="goal-heading" className="mt-1 text-xl font-semibold text-ink-900">
            Giữa kỳ Cơ sở dữ liệu ≥ 8 điểm
          </h2>
        </div>
        <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div>
            <dt className="text-ink-500">Hạn chót</dt>
            <dd className="font-semibold text-ink-900">20/11/2026</dd>
          </div>
          <div>
            <dt className="text-ink-500">Chân trời</dt>
            <dd className="font-semibold text-ink-900">Ngắn hạn · {weeks} tuần</dd>
          </div>
          <div>
            <dt className="text-ink-500">Quỹ giờ</dt>
            <dd className="font-semibold text-ink-900">{BUDGET} phút/tuần</dd>
          </div>
          <div>
            <dt className="text-ink-500">Lộ trình</dt>
            <dd className="font-semibold text-ink-900">
              {version === 0 && phase !== "draft" ? "Chưa có" : `Phiên bản ${phase === "draft" ? version + 1 : version}`}{" "}
              {phase === "draft" && <span className="pill ml-1 bg-amber-50 text-amber-800">Bản nháp</span>}
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="dir-heading">
        <div className="mb-4">
          <h2 id="dir-heading" className="text-xl font-semibold text-ink-900">
            Hướng học
          </h2>
          <p className="mt-1 text-sm text-ink-500">PersoAI đã hỏi 2 câu làm rõ và đề xuất 3 hướng. Chọn đúng một hướng rồi mới lập lộ trình.</p>
        </div>
        <fieldset>
          <legend className="sr-only">Chọn hướng học</legend>
          <div className="grid gap-4 md:grid-cols-3">
            {directions.map((d) => {
              const selected = picked === d.id;
              return (
                <label
                  key={d.id}
                  className={`relative flex cursor-pointer flex-col rounded-lg border bg-white p-5 transition-shadow focus-within:ring-2 focus-within:ring-indigo-600 hover:shadow-lift ${
                    selected ? "border-indigo-600 ring-1 ring-indigo-600" : "border-line"
                  }`}
                >
                  <input type="radio" name="direction" value={d.id} checked={selected} onChange={() => setPicked(d.id)} className="sr-only" />
                  <div className="flex flex-wrap items-center gap-2">
                    {d.id === active && <span className="pill bg-indigo-50 text-indigo-700">Đang theo</span>}
                    {d.feasible ? (
                      <span className="pill bg-emerald-50 text-emerald-700">Khả thi</span>
                    ) : (
                      <span className="pill bg-rose-50 text-rose-700">Vượt quỹ giờ</span>
                    )}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-ink-900">{d.name}</h3>
                  <p className="mt-1 text-sm text-ink-700">{d.focus}</p>
                  <dl className="mt-4 space-y-1.5 text-sm">
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 text-ink-500">Khối lượng</dt>
                      <dd className={`font-semibold ${d.perWeek > BUDGET ? "text-rose-700" : "text-ink-900"}`}>{d.load.replace(/× \d+ tuần/, `× ${weeks} tuần`)}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 text-ink-500">Tiên quyết</dt>
                      <dd className="text-ink-900">{d.prereq}</dd>
                    </div>
                  </dl>
                  <p className="mt-4 border-t border-line pt-3 text-sm text-ink-700">{d.why}</p>
                  <p className="mt-2 flex gap-1.5 text-xs text-ink-500">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />
                    Rủi ro: {d.risk}
                  </p>
                  <span
                    className={`absolute right-4 top-4 grid h-5 w-5 place-items-center rounded-full border-2 ${selected ? "border-indigo-600" : "border-line-strong"}`}
                    aria-hidden
                  >
                    {selected && <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
        {active === null && picked === null && (
          <p className="mt-4 text-sm text-ink-500">Chọn một thẻ để PersoAI soạn lộ trình theo hướng đó.</p>
        )}
        {changed && phase !== "draft" && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border-l-4 border-indigo-600 bg-indigo-50 px-4 py-3 text-sm">
            <span className="min-w-[220px] flex-1 text-ink-900">
              {active === null
                ? "Lộ trình sẽ được soạn theo hướng này, mỗi tuần một cột mốc tới hạn chót, rồi kiểm tra R1–R6. Chỉ lưu khi bạn xác nhận."
                : "Bạn đã chọn hướng khác. Lộ trình mới sẽ được soạn và kiểm tra R1–R6; lộ trình hiện tại vẫn giữ đến khi bạn xác nhận."}
            </span>
            <button type="button" className="btn-primary" onClick={draft} disabled={phase === "drafting"}>
              {phase === "drafting" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Soạn lộ trình mới
            </button>
          </div>
        )}
      </section>

      {(active !== null || phase === "draft") && (
      <>
      <section aria-labelledby="ms-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="ms-heading" className="text-xl font-semibold text-ink-900">
              Cột mốc theo tuần
            </h2>
            <p className="mt-1 text-sm text-ink-500">Mỗi tuần một cột mốc; nhiệm vụ theo ngày chỉ được lập cho tuần kế tiếp.</p>
          </div>
        </div>
        <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {shownMilestones.map((m) => (
            <li key={m.week} className={`rounded-lg border p-4 ${m.state === "current" ? "border-indigo-600 bg-indigo-50/40" : "border-line bg-white"}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink-500">
                  Tuần {m.week} · {m.range}
                </p>
                <span className={`pill ${stateStyle[m.state].cls}`}>{stateStyle[m.state].label}</span>
              </div>
              <h3 className="mt-2 text-base font-semibold text-ink-900">{m.topic}</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-ink-700">
                <li className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-ink-500" aria-hidden />
                  {m.minutes} phút
                </li>
                <li className="flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-ink-500" aria-hidden />
                  {m.output}
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-ink-500" aria-hidden />
                  {m.check}
                </li>
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="rules-heading" className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="rules-heading" className="text-base font-semibold text-ink-900">
            Kiểm tra lộ trình R1–R6
          </h2>
          <span className="text-sm text-ink-500">{blocking === 0 ? "Mọi quy tắc chặn đều đạt" : `${blocking} quy tắc chặn chưa đạt`}</span>
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rules.map((r) => (
            <li key={r.id} className="flex items-start gap-2.5 text-sm">
              {r.ok ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-label="Đạt" />
              ) : r.warn ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-label="Cảnh báo" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-label="Không đạt" />
              )}
              <span>
                <span className="font-semibold text-ink-900">
                  {r.id} {r.label}
                </span>
                <span className="block text-ink-500">{r.detail}</span>
              </span>
            </li>
          ))}
        </ul>
        {phase === "draft" && (
          <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setPicked(active);
                setPhase("active");
              }}
            >
              Bỏ bản nháp
            </button>
            <button type="button" className="btn-primary" onClick={confirm} disabled={blocking > 0}>
              Xác nhận lộ trình
            </button>
          </div>
        )}
        {isNew && phase === "active" && active !== null && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="min-w-[220px] flex-1 text-sm text-ink-700">Lộ trình đã lưu. Bước cuối: xác nhận kế hoạch tuần kế tiếp.</p>
            <Link href="/ke-hoach" className="btn-primary">
              Soạn kế hoạch tuần
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        )}
      </section>
      </>
      )}
    </div>
  );
}
