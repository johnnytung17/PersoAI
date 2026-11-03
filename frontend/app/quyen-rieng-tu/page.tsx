import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { PrivacyView } from "./PrivacyView";

export const metadata: Metadata = { title: "Quyền riêng tư · PersoAI" };

export default function PrivacyPage() {
  return (
    <>
      <PageHeader title="Quyền riêng tư" description="Dữ liệu nào rời khỏi máy chủ PersoAI, và cách xoá dữ liệu của bạn." />
      <PrivacyView />
    </>
  );
}
