import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { CoursesView } from "./CoursesView";

export const metadata: Metadata = { title: "Môn học & tài liệu · PersoAI" };

export default function CoursesPage() {
  return (
    <>
      <PageHeader title="Môn học & tài liệu" description="Mục tiêu, hạn chót và tài liệu của từng môn. PersoAI chỉ trả lời từ tài liệu đã lập chỉ mục." />
      <CoursesView />
    </>
  );
}
