import type { Metadata } from "next";
import { ReportView } from "@/components/report/ReportView";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Báo cáo tuần · PersoAI" };

export default function ReportPage() {
  return (
    <>
      <PageHeader title="Báo cáo tuần" description="Số liệu 7 ngày tính từ nhật ký và lượt làm bài; AI chỉ diễn giải và đề xuất tối đa 3 thay đổi." />
      <ReportView />
    </>
  );
}
