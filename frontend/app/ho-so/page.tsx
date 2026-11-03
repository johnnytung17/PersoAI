import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProfileView } from "./ProfileView";

export const metadata: Metadata = { title: "Hồ sơ · PersoAI" };

export default function ProfilePage() {
  return (
    <>
      <PageHeader title="Hồ sơ học tập" description="12 trường PersoAI dùng để lập kế hoạch và chọn cách giải thích. Mỗi lần sửa là một phiên bản mới." />
      <Suspense>
        <ProfileView />
      </Suspense>
    </>
  );
}
