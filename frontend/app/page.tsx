"use client";

import { GettingStarted } from "@/components/onboarding/GettingStarted";
import { TodayView } from "@/components/today/TodayView";
import { useDemo } from "@/lib/demo";

export default function TodayPage() {
  const { ready, setupDone, account } = useDemo();
  if (!ready) return null;
  // key theo tài khoản để buổi học khởi tạo lại khi đổi người dùng mẫu.
  return setupDone ? <TodayView key={account} /> : <GettingStarted />;
}
