"use client";

import { MotionConfig } from "framer-motion";
import { ToastProvider } from "@/components/ui/Toast";
import { DemoProvider } from "@/lib/demo";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <DemoProvider>
        <ToastProvider>{children}</ToastProvider>
      </DemoProvider>
    </MotionConfig>
  );
}
