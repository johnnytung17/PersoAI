import { ArrowRight } from "lucide-react";
import Link from "next/link";

// Trạng thái trống kèm bước tiếp theo (chặn mềm cho người dùng mới).
export function EmptyState({
  icon,
  title,
  text,
  href,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="text-indigo-600" aria-hidden>
        {icon}
      </span>
      <p className="text-lg font-semibold text-ink-900">{title}</p>
      <p className="max-w-md text-[15px] text-ink-500">{text}</p>
      {href && action && (
        <Link href={href} className="btn-primary mt-2">
          {action}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}
