import type { Metadata } from "next";
import { RoadmapView } from "@/components/roadmap/RoadmapView";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Lộ trình · PersoAI" };

export default function RoadmapPage() {
  return (
    <>
      <PageHeader title="Lộ trình" description="Chọn một hướng học, rồi theo các cột mốc mỗi tuần tới hạn chót. AI đề xuất, bạn xác nhận." />
      <RoadmapView />
    </>
  );
}
