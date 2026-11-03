import type { Metadata } from "next";
import { PlanView } from "@/components/plan/PlanView";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Kế hoạch tuần · PersoAI" };

export default function PlanPage() {
  return (
    <>
      <PageHeader title="Kế hoạch tuần" description="Nhiệm vụ theo ngày cho tuần kế tiếp, kiểm tra theo quy tắc V1–V10 trước khi xác nhận." />
      <PlanView />
    </>
  );
}
