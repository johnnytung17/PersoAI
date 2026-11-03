import type { Metadata } from "next";
import { SurveyView } from "@/components/onboarding/SurveyView";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Khảo sát · PersoAI" };

export default function SurveyPage() {
  return (
    <>
      <PageHeader title="Khảo sát" description="Khoảng 5 phút. PersoAI dùng thông tin này để lập kế hoạch vừa thời gian thật của bạn." />
      <SurveyView />
    </>
  );
}
