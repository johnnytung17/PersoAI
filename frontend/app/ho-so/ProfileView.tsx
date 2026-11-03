"use client";

import { History, RefreshCcw, UserRoundCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FieldRow, ProvenanceLegend } from "@/components/profile/FieldRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { useDemo } from "@/lib/demo";
import { profile12, profileVersion, type ProfileField } from "@/lib/mock";

type ProfileResponse = { version: number; confirmedAt: string | null; sourceText: string; fields: ProfileField[] };

const confirmedSeed: ProfileField[] = profile12.map((f) => (f.value && f.source === "Trích xuất" ? { ...f, source: "Đã xác nhận" } : f));

const allHistory = [
  { version: 2, date: "01/11/2026", note: "Sửa giờ bận Thứ Năm thành 18:00–22:00" },
  { version: 1, date: "26/10/2026", note: "Tạo từ khảo sát" },
];

// Hồ sơ (ONB-04, ONB-05): xem, sửa từng trường; mỗi lần xác nhận là một phiên bản mới.
export function ProfileView() {
  const { ready, setup, account } = useDemo();
  if (!ready) return null;
  if (!setup.survey)
    return (
      <EmptyState
        icon={<UserRoundCheck className="h-8 w-8" />}
        title="Chưa có hồ sơ học tập"
        text="Hồ sơ được tạo từ khảo sát: bạn kể về việc học, PersoAI trích 12 trường và chỉ lưu khi bạn xác nhận."
        href="/khao-sat"
        action="Làm khảo sát"
      />
    );
  return <ProfileFields key={account} isNew={account === "lan"} />;
}

function ProfileFields({ isNew }: { isNew: boolean }) {
  const toast = useToast();
  const { user } = useDemo();
  const history = isNew ? [{ version: 1, date: "05/11/2026", note: "Tạo từ khảo sát" }] : allHistory;
  const [fields, setFields] = useState<ProfileField[]>(confirmedSeed);
  const [pending, setPending] = useState(false);
  const [version, setVersion] = useState(isNew ? 1 : profileVersion.current);
  const [confirmedAt, setConfirmedAt] = useState<string | null>(isNew ? "05/11/2026" : profileVersion.confirmedAt);
  const [live, setLive] = useState(false);

  useEffect(() => {
    api<ProfileResponse>("/profile").then((p) => {
      if (!p) return;
      setLive(true);
      setVersion(p.version);
      setConfirmedAt(p.confirmedAt);
      setFields(p.fields);
    });
  }, []);

  function updateField(key: string, value: string) {
    setFields((fs) => fs.map((f) => (f.key === key ? { ...f, value, source: "Tự nhập" } : f)));
    setPending(true);
  }

  async function confirm() {
    if (live) {
      const p = await api<ProfileResponse>("/profile", { method: "POST", body: { fields } });
      if (!p) return toast.show("Không lưu được hồ sơ.");
      setFields(p.fields);
      setVersion(p.version);
      setConfirmedAt(p.confirmedAt);
      setPending(false);
      return toast.show(`Đã lưu hồ sơ phiên bản ${p.version}`);
    }
    setVersion((v) => v + 1);
    setPending(false);
    toast.show(`Đã lưu hồ sơ phiên bản ${version + 1}`);
  }

  const missing = fields.filter((f) => !f.value).length;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ProvenanceLegend />
          <Link href="/khao-sat" className="btn-ghost px-3 py-1.5">
            <RefreshCcw className="h-4 w-4" aria-hidden />
            Khảo sát lại
          </Link>
        </div>
        {pending && (
          <p className="rounded-lg border-l-4 border-indigo-600 bg-indigo-50 px-4 py-3 text-sm text-ink-900" role="status">
            Có thay đổi chưa lưu. Bấm Xác nhận hồ sơ để tạo phiên bản {version + 1}.
          </p>
        )}
        <dl className="card divide-y divide-line">
          {fields.map((f) => (
            <FieldRow key={`${f.key}-${f.value ?? ""}`} field={f} onChange={(v) => updateField(f.key, v)} />
          ))}
        </dl>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
          {missing > 0 && <p className="text-sm text-ink-500">Còn {missing} trường trống. PersoAI không tự đoán.</p>}
          <button type="button" className="btn-primary" disabled={!pending} onClick={confirm}>
            <UserRoundCheck className="h-4 w-4" aria-hidden />
            {pending ? "Xác nhận hồ sơ" : "Hồ sơ đã xác nhận"}
          </button>
        </div>
      </div>

      <aside className="space-y-5">
        <div className="card flex items-center gap-4 p-5">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-indigo-600 text-xl font-semibold text-white" aria-hidden>
            {user.initials}
          </span>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-ink-900">{user.name}</p>
            <p className="text-sm text-ink-500">{user.className} · Sinh viên</p>
          </div>
        </div>
        <section aria-labelledby="history-heading" className="card p-5">
          <h2 id="history-heading" className="flex items-center gap-2 text-base font-semibold text-ink-900">
            <History className="h-4 w-4 text-indigo-600" aria-hidden />
            Phiên bản hồ sơ
          </h2>
          <ol className="mt-3 space-y-3">
            {history.map((h) => (
              <li key={h.version} className="text-sm">
                <p className="font-semibold text-ink-900">
                  Phiên bản {h.version}
                  {h.version === version && !pending && <span className="pill ml-2 bg-emerald-50 text-emerald-700">Đang dùng</span>}
                </p>
                <p className="text-ink-500">
                  {h.version === version && confirmedAt ? confirmedAt : h.date} · {h.note}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </aside>
    </div>
  );
}
