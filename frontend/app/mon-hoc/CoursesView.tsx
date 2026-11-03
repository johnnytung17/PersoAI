"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Database,
  FileText,
  FileType2,
  Loader2,
  Plus,
  Target,
  Trash2,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api, apiOrError } from "@/lib/api";
import { FadeUp } from "@/components/ui/FadeUp";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useDemo } from "@/lib/demo";
import {
  course,
  docKinds,
  documents,
  goals as initialGoals,
  scannedError,
  uploadHint,
  type Doc,
  type DocKind,
  type Goal,
  type Priority,
} from "@/lib/mock";

const MAX_BYTES = 20 * 1024 * 1024;

const kindStyle: Record<DocKind, string> = {
  "Tài liệu môn": "bg-indigo-50 text-indigo-700",
  "Bài làm của tôi": "bg-violet-50 text-violet-700",
  "Tham khảo": "bg-cyan-50 text-cyan-700",
};

const kindHelp: Record<DocKind, string> = {
  "Tài liệu môn": "Slide, giáo trình. Nguồn tin cậy, được ưu tiên khi trả lời.",
  "Tham khảo": "Tài liệu thêm ngoài chương trình.",
  "Bài làm của tôi": "Bài bạn tự làm. Dùng để góp ý, không xem là nguồn đúng.",
};

const priorityStyle: Record<Priority, string> = {
  Cao: "bg-rose-50 text-rose-700",
  "Trung bình": "bg-amber-50 text-amber-700",
  Thấp: "bg-slate-100 text-ink-500",
};

function StatusPill({ doc }: { doc: Doc }) {
  if (doc.status === "Đã lập chỉ mục")
    return (
      <span className="pill bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
        {doc.status}
      </span>
    );
  if (doc.status === "Lỗi")
    return (
      <span className="pill bg-rose-50 text-rose-700 ring-1 ring-rose-200">
        <AlertCircle className="h-3.5 w-3.5" aria-hidden />
        Lỗi
      </span>
    );
  return (
    <span className="pill bg-amber-50 text-amber-700 ring-1 ring-amber-200">
      <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
      {doc.status}
    </span>
  );
}

function FileIcon({ name }: { name: string }) {
  const isDoc = name.endsWith(".docx") || name.endsWith(".txt");
  return (
    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${isDoc ? "bg-sky-50 text-sky-600" : "bg-rose-50 text-rose-500"}`} aria-hidden>
      {isDoc ? <FileType2 className="h-[18px] w-[18px]" /> : <FileText className="h-[18px] w-[18px]" />}
    </span>
  );
}

function DeleteButton({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-ring rounded-lg p-1.5 text-ink-400 transition hover:bg-rose-50 hover:text-rose-600"
      aria-label={`Xoá ${name}`}
      title="Xoá tài liệu"
    >
      <Trash2 className="h-4 w-4" aria-hidden />
    </button>
  );
}

type GoalForm = { output: string; deadline: string; priority: Priority };

export function CoursesView() {
  const { ready, setup, account, complete } = useDemo();
  if (!ready) return null;
  if (!setup.survey)
    return (
      <EmptyState
        icon={<Target className="h-8 w-8" />}
        title="Làm khảo sát trước khi thêm môn"
        text="PersoAI cần quỹ giờ và giờ bận trong hồ sơ để kiểm tra mục tiêu và hạn chót của môn có khả thi không."
        href="/khao-sat"
        action="Làm khảo sát"
      />
    );
  // Người mới bắt đầu với danh sách trống; có mục tiêu và ≥ 1 tài liệu đã lập chỉ mục thì xong bước 2.
  const fresh = account === "lan" && !setup.course;
  return (
    <CoursesBody
      key={account}
      initialDocs={fresh ? [] : documents}
      initialGoalList={fresh ? [] : initialGoals}
      onReady={() => complete("course")}
      showNext={account === "lan" && !setup.roadmap}
    />
  );
}

function CoursesBody({
  initialDocs,
  initialGoalList,
  onReady,
  showNext,
}: {
  initialDocs: Doc[];
  initialGoalList: Goal[];
  onReady: () => void;
  showNext: boolean;
}) {
  const toast = useToast();
  const [docs, setDocs] = useState<Doc[]>(initialDocs);
  const [goals, setGoals] = useState<Goal[]>(initialGoalList);

  useEffect(() => {
    if (goals.length > 0 && docs.some((d) => d.status === "Đã lập chỉ mục")) onReady();
  }, [goals, docs, onReady]);
  const [dragging, setDragging] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ name: string; size: number } | null>(null);
  const [pendingKind, setPendingKind] = useState<DocKind>("Tài liệu môn");
  const [toDelete, setToDelete] = useState<Doc | null>(null);
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalForm, setGoalForm] = useState<GoalForm>({ output: "", deadline: "", priority: "Trung bình" });
  const [goalError, setGoalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [live, setLive] = useState(false);

  // Mục tiêu và tài liệu đọc từ PostgreSQL; khi API chưa sẵn sàng thì dùng dữ liệu mẫu.
  useEffect(() => {
    Promise.all([api<Goal[]>("/goals"), api<Doc[]>("/documents")]).then(([g, d]) => {
      if (!g || !d) return;
      setGoals(g);
      setDocs(d);
      setLive(true);
    });
  }, []);

  async function uploadLive(name: string, size: number) {
    const d = await api<Doc[]>("/documents", { method: "POST", body: { name, kind: pendingKind, size } });
    if (!d) return toast.show("Không tải lên được tài liệu.");
    setDocs(d);
    toast.show(size > MAX_BYTES ? `"${name}" vượt quá 20 MB` : `Đang trích chữ và lập chỉ mục "${name}"`);
    window.setTimeout(() => api<Doc[]>("/documents").then((x) => x && setDocs(x)), 2600);
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const f = files[0];
    setPendingKind("Tài liệu môn");
    setPendingFile({ name: f.name, size: f.size });
  }

  function startUpload() {
    if (!pendingFile) return;
    const { name, size } = pendingFile;
    setPendingFile(null);
    if (live) return void uploadLive(name, size);
    if (size > MAX_BYTES) {
      setDocs((d) => [...d, { name, kind: pendingKind, status: "Lỗi", error: "File vượt quá 20 MB." }]);
      toast.show(`"${name}" vượt quá 20 MB`);
      return;
    }
    setDocs((d) => [...d, { name, kind: pendingKind, status: "Đang xử lý" }]);
    toast.show(`Đang trích chữ và lập chỉ mục "${name}"`);
    // Bản mẫu: file có chữ "scan" trong tên giả lập PDF quét không có lớp chữ.
    const scanned = /scan/i.test(name);
    window.setTimeout(() => {
      setDocs((d) =>
        d.map((x) =>
          x.name === name && x.status === "Đang xử lý"
            ? scanned
              ? { ...x, status: "Lỗi", error: scannedError }
              : { ...x, status: "Đã lập chỉ mục", pages: name.endsWith(".pdf") ? "12 trang" : undefined }
            : x,
        ),
      );
    }, 2200);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    if (live && toDelete.id) {
      const d = await api<Doc[]>(`/documents/${toDelete.id}`, { method: "DELETE" });
      if (!d) return toast.show("Không xoá được tài liệu.");
      setDocs(d);
    } else setDocs((d) => d.filter((x) => x.name !== toDelete.name));
    toast.show(`Đã xoá "${toDelete.name}" và các đoạn đã lập chỉ mục`);
    setToDelete(null);
  }

  async function saveGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!goalForm.output.trim()) return setGoalError("Hãy nhập đầu ra mong muốn.");
    if (!goalForm.deadline) return setGoalError("Mục tiêu cần có hạn chót.");
    if (live) {
      const { data, error } = await apiOrError<Goal[]>("/goals", { method: "POST", body: goalForm });
      if (error || !data) return setGoalError(error ?? "Không lưu được mục tiêu.");
      setGoals(data);
    } else {
      const [y, m, d] = goalForm.deadline.split("-");
      setGoals((g) => [
        ...g,
        { id: `g-${g.length + 1}`, output: goalForm.output.trim(), deadline: `${d}/${m}/${y}`, priority: goalForm.priority, status: "Đang theo đuổi" },
      ]);
    }
    setGoalOpen(false);
    setGoalForm({ output: "", deadline: "", priority: "Trung bình" });
    setGoalError(null);
    toast.show("Đã tạo mục tiêu mới");
  }

  const indexed = docs.filter((d) => d.status === "Đã lập chỉ mục").length;

  const ready = goals.length > 0 && indexed > 0;

  return (
    <>
    {showNext && (
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border-l-4 border-indigo-600 bg-indigo-50 px-4 py-3 text-sm" role="status">
        <span className="min-w-[220px] flex-1 text-ink-900">
          {ready
            ? "Đã có mục tiêu và tài liệu đã lập chỉ mục. Bước tiếp theo: chọn hướng học và xác nhận lộ trình."
            : `Bước 2/4: thêm ${goals.length === 0 ? "một mục tiêu (kết quả mong muốn và hạn chót)" : ""}${goals.length === 0 && indexed === 0 ? " và " : ""}${indexed === 0 ? "ít nhất một tài liệu môn học" : ""}.`}
        </span>
        {ready && (
          <Link href="/lo-trinh" className="btn-primary px-3 py-1.5">
            Chọn hướng học
          </Link>
        )}
      </div>
    )}
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <FadeUp className="min-w-0">
        <article className="card overflow-hidden">
          <div className="grid h-28 place-items-center bg-indigo-50" aria-hidden>
            <Database className="h-10 w-10 text-indigo-600" />
          </div>
          <div className="p-6">
            <p className="label-eyebrow">Môn học</p>
            <h2 className="mt-1 text-xl font-semibold text-ink-900">{course.label}</h2>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="pill bg-indigo-50 text-indigo-700">{docs.length} tài liệu</span>
              <span className="pill bg-emerald-50 text-emerald-700">{indexed} đã lập chỉ mục</span>
            </div>

            <div className="mt-6 flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-ink-900">Mục tiêu</h3>
              <button type="button" className="btn-secondary px-3 py-1.5 text-xs" onClick={() => setGoalOpen(true)}>
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Thêm mục tiêu
              </button>
            </div>
            {goals.length === 0 && <p className="mt-3 text-sm text-ink-500">Chưa có mục tiêu. Bấm “Thêm mục tiêu” để nhập kết quả mong muốn và hạn chót.</p>}
            <ul className="mt-3 space-y-2">
              {goals.map((g) => (
                <li key={g.id} className="rounded-2xl bg-slate-50 p-3">
                  <p className="flex items-start gap-2 text-sm font-semibold text-ink-900">
                    <Target className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" aria-hidden />
                    {g.output}
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-1.5 pl-6 text-xs text-ink-500">
                    <CalendarClock className="h-3.5 w-3.5 text-cyan-500" aria-hidden />
                    Hạn {g.deadline}
                    <span className={`pill ${priorityStyle[g.priority]}`}>Ưu tiên {g.priority.toLowerCase()}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </FadeUp>

      <div className="min-w-0 space-y-5">
        <FadeUp delay={0.06}>
          <section aria-labelledby="docs-heading" className="card overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
              <h2 id="docs-heading" className="text-base font-bold text-ink-900">
                Tài liệu
              </h2>
              <span className="text-xs font-medium text-ink-400">{docs.length} file</span>
            </div>

            <table className="hidden w-full text-left text-sm sm:table">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  <th scope="col" className="px-5 py-3 font-semibold">Tên file</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Loại</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Số trang</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Trạng thái</th>
                  <th scope="col" className="px-5 py-3"><span className="sr-only">Thao tác</span></th>
                </tr>
              </thead>
              <tbody>
                {docs.length === 0 && (
                  <tr className="border-t border-slate-100">
                    <td colSpan={5} className="px-5 py-6 text-center text-ink-500">
                      Chưa có tài liệu. Tải slide hoặc giáo trình ở ô bên dưới.
                    </td>
                  </tr>
                )}
                {docs.map((d) => (
                  <tr key={d.id ?? d.name} className="border-t border-slate-100 align-top transition-colors hover:bg-indigo-50/40">
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-3">
                        <FileIcon name={d.name} />
                        <span className="min-w-0">
                          <span className="block break-all font-semibold text-ink-900">{d.name}</span>
                          {d.error && <span className="mt-0.5 block text-xs font-medium text-rose-600">{d.error}</span>}
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`pill ${kindStyle[d.kind]}`}>{d.kind}</span>
                    </td>
                    <td className="px-3 py-3 text-ink-500">{d.pages ?? "—"}</td>
                    <td className="px-3 py-3">
                      <StatusPill doc={d} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <DeleteButton name={d.name} onClick={() => setToDelete(d)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-slate-100 sm:hidden">
              {docs.length === 0 && <li className="px-4 py-6 text-center text-sm text-ink-500">Chưa có tài liệu. Tải slide hoặc giáo trình ở ô bên dưới.</li>}
              {docs.map((d) => (
                <li key={d.id ?? d.name} className="flex gap-3 px-4 py-3">
                  <FileIcon name={d.name} />
                  <div className="min-w-0 flex-1">
                    <p className="break-all text-sm font-semibold text-ink-900">{d.name}</p>
                    {d.error && <p className="mt-0.5 text-xs font-medium text-rose-600">{d.error}</p>}
                    <p className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className={`pill ${kindStyle[d.kind]}`}>{d.kind}</span>
                      {d.pages && <span className="pill bg-slate-100 text-ink-500">{d.pages}</span>}
                      <StatusPill doc={d} />
                    </p>
                  </div>
                  <DeleteButton name={d.name} onClick={() => setToDelete(d)} />
                </li>
              ))}
            </ul>
          </section>
        </FadeUp>

        <FadeUp delay={0.12}>
          <section aria-labelledby="upload-heading">
            <h2 id="upload-heading" className="sr-only">
              Tải tài liệu lên
            </h2>
            <motion.label
              htmlFor="file-upload"
              onDragOver={(e: React.DragEvent) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e: React.DragEvent) => {
                e.preventDefault();
                setDragging(false);
                handleFiles(e.dataTransfer.files);
              }}
              animate={{ scale: dragging ? 1.01 : 1 }}
              className={`flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 ${
                dragging ? "border-indigo-600 bg-indigo-50" : "border-line-strong bg-white hover:border-indigo-600"
              }`}
            >
              <UploadCloud className="h-10 w-10 text-indigo-600" aria-hidden />
              <span className="text-base font-semibold text-ink-900">
                Kéo-thả file vào đây hoặc <span className="text-gradient">chọn file</span>
              </span>
              <span className="text-sm text-ink-500">{uploadHint}</span>
              <span className="text-xs text-ink-400">PDF quét (ảnh) chưa được hỗ trợ vì không có lớp chữ.</span>
              <input
                ref={inputRef}
                id="file-upload"
                type="file"
                accept=".pdf,.docx,.txt"
                className="sr-only"
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </motion.label>
          </section>
        </FadeUp>
      </div>

      <Modal
        open={pendingFile !== null}
        onClose={() => setPendingFile(null)}
        title="Tài liệu này thuộc loại nào?"
        description={pendingFile?.name}
        icon={<UploadCloud className="h-5 w-5" />}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setPendingFile(null)}>
              Huỷ
            </button>
            <button type="button" className="btn-primary" onClick={startUpload}>
              Tải lên và lập chỉ mục
            </button>
          </>
        }
      >
        <fieldset className="space-y-2">
          <legend className="sr-only">Loại tài liệu</legend>
          {docKinds.map((k) => (
            <label
              key={k}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition focus-within:ring-2 focus-within:ring-indigo-500 ${
                pendingKind === k ? "border-indigo-300 bg-indigo-50/60" : "border-slate-200 bg-white hover:border-indigo-200"
              }`}
            >
              <input type="radio" name="kind" checked={pendingKind === k} onChange={() => setPendingKind(k)} className="mt-0.5 h-4 w-4 accent-indigo-600" />
              <span>
                <span className="block text-sm font-semibold text-ink-900">{k}</span>
                <span className="text-xs text-ink-500">{kindHelp[k]}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </Modal>

      <Modal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title="Xoá tài liệu này?"
        description={toDelete?.name}
        tone="danger"
        icon={<Trash2 className="h-5 w-5" />}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setToDelete(null)} data-autofocus>
              Huỷ
            </button>
            <button type="button" className="btn-danger" onClick={confirmDelete}>
              Xoá tài liệu
            </button>
          </>
        }
      >
        <p className="text-sm text-ink-700">
          File và toàn bộ đoạn đã lập chỉ mục sẽ bị xoá. Sau khi xoá, hỏi đáp sẽ không trích dẫn từ tài liệu này nữa.
        </p>
      </Modal>

      <Modal
        open={goalOpen}
        onClose={() => setGoalOpen(false)}
        title="Thêm mục tiêu"
        description={`Môn ${course.label}`}
        icon={<Target className="h-5 w-5" />}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setGoalOpen(false)}>
              Huỷ
            </button>
            <button type="submit" form="goal-form" className="btn-primary">
              Lưu mục tiêu
            </button>
          </>
        }
      >
        <form id="goal-form" onSubmit={saveGoal} className="space-y-4" noValidate>
          {goalError && (
            <p role="alert" className="flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 ring-1 ring-rose-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {goalError}
            </p>
          )}
          <div>
            <label htmlFor="goal-output" className="text-sm font-semibold text-ink-700">
              Đầu ra mong muốn
            </label>
            <input
              id="goal-output"
              value={goalForm.output}
              onChange={(e) => setGoalForm({ ...goalForm, output: e.target.value })}
              placeholder="Ví dụ: Thi cuối kỳ CSDL đạt trên 8"
              className="focus-ring mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm placeholder:text-ink-400"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="goal-deadline" className="text-sm font-semibold text-ink-700">
                Hạn chót
              </label>
              <input
                id="goal-deadline"
                type="date"
                value={goalForm.deadline}
                onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
                className="focus-ring mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="goal-priority" className="text-sm font-semibold text-ink-700">
                Mức ưu tiên
              </label>
              <select
                id="goal-priority"
                value={goalForm.priority}
                onChange={(e) => setGoalForm({ ...goalForm, priority: e.target.value as Priority })}
                className="focus-ring mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              >
                <option>Cao</option>
                <option>Trung bình</option>
                <option>Thấp</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
    </>
  );
}
