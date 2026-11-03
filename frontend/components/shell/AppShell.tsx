"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ChevronDown, Database, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { api } from "@/lib/api";
import { useDemo } from "@/lib/demo";
import { accountItems, course, navItems, todayIso, todayLabel } from "@/lib/mock";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function Logo() {
  return (
    <Link href="/" className="focus-ring shrink-0 rounded" aria-label="PersoAI — về trang Hôm nay">
      <span className="text-[22px] font-bold tracking-tight text-indigo-600">
        perso<span className="text-ink-900">AI</span>
      </span>
    </Link>
  );
}

// Menu avatar: hồ sơ, khảo sát lại, quyền riêng tư, đăng xuất.
function AccountMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { user, logout } = useDemo();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="focus-ring flex items-center gap-1.5 rounded-full p-0.5 pr-1.5 hover:bg-slate-50"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-indigo-600 text-sm font-semibold text-white" aria-hidden>
          {user.initials}
        </span>
        <span className="sr-only">Tài khoản {user.name}</span>
        <ChevronDown className="h-4 w-4 text-ink-500" aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-lg border border-line bg-white py-1 shadow-lift">
          <div className="border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-ink-900">
              {user.name} · {user.className}
            </p>
            <p className="text-xs text-ink-500">Sinh viên</p>
          </div>
          {accountItems.map((item) => (
            <Link key={item.href} role="menuitem" href={item.href} className="focus-ring block px-4 py-2.5 text-sm text-ink-700 hover:bg-indigo-50 hover:text-indigo-700">
              {item.label}
            </Link>
          ))}
          <Link role="menuitem" href="/dang-nhap" onClick={logout} className="focus-ring flex items-center gap-2 border-t border-line px-4 py-2.5 text-sm text-ink-700 hover:bg-rose-50 hover:text-rose-700">
            <LogOut className="h-4 w-4" aria-hidden />
            Đăng xuất
          </Link>
        </div>
      )}
    </div>
  );
}

function CourseAndStatus({ dbOnline }: { dbOnline: boolean | null }) {
  const [courseValue, setCourseValue] = useState("csdl");
  const { setup } = useDemo();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor="course-select" className="sr-only">
        Chọn môn học
      </label>
      {!setup.course ? (
        <Link href="/mon-hoc" className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line-strong px-3 py-1.5 text-sm font-semibold text-indigo-600 hover:border-indigo-600">
          <BookOpen className="h-4 w-4" aria-hidden />
          Chưa có môn · Thêm môn học
        </Link>
      ) : (
      <div className="relative">
        <BookOpen className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-600" aria-hidden />
        <select
          id="course-select"
          value={courseValue}
          onChange={(e) => setCourseValue(e.target.value)}
          className="focus-ring cursor-pointer appearance-none rounded-lg border border-line-strong bg-white py-1.5 pl-8 pr-8 text-sm font-semibold text-ink-900 hover:border-ink-500"
        >
          <option value="csdl">{course.label}</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" aria-hidden />
      </div>
      )}
      <time dateTime={todayIso} className="text-sm text-ink-500">
        {todayLabel}
      </time>
      {dbOnline !== null && (
        <span
          className={`pill ${dbOnline ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-ink-500"}`}
          title={dbOnline ? "Dữ liệu đọc/ghi từ PostgreSQL qua NestJS" : "Chưa kết nối PostgreSQL, đang hiển thị dữ liệu mẫu"}
        >
          <Database className="h-3.5 w-3.5" aria-hidden />
          {dbOnline ? "PostgreSQL" : "Dữ liệu mẫu"}
        </span>
      )}
    </div>
  );
}

function Header({ pathname }: { pathname: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dbOnline, setDbOnline] = useState<boolean | null>(null);
  const { logout } = useDemo();

  useEffect(() => {
    api<{ database: string }>("/health").then((h) => setDbOnline(h ? h.database.includes("connected") : false));
  }, []);
  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-page items-center gap-6 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          className="focus-ring -ml-1 rounded-lg p-2 text-ink-700 hover:bg-slate-50 lg:hidden"
          aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        </button>
        <Logo />
        <nav aria-label="Điều hướng chính" className="hidden h-full lg:block">
          <ul className="flex h-full items-stretch gap-1">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href} className="relative flex">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`focus-ring flex items-center whitespace-nowrap px-3 text-sm font-semibold transition-colors ${
                      active ? "text-indigo-600" : "text-ink-700 hover:text-indigo-600"
                    }`}
                  >
                    {item.label}
                  </Link>
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-3 bottom-0 h-[3px] rounded-t bg-indigo-600"
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      aria-hidden
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <div className="hidden 2xl:block">
            <CourseAndStatus dbOnline={dbOnline} />
          </div>
          <AccountMenu />
        </div>
      </div>

      <div className="hidden border-t border-line bg-white lg:block 2xl:hidden">
        <div className="mx-auto max-w-page px-4 py-2 sm:px-6 lg:px-8">
          <CourseAndStatus dbOnline={dbOnline} />
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            aria-label="Điều hướng chính"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-line bg-white lg:hidden"
          >
            <div className="space-y-4 px-4 py-4 sm:px-6">
              <CourseAndStatus dbOnline={dbOnline} />
              <ul className="space-y-1">
                {[...navItems, ...accountItems].map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`focus-ring block rounded-lg px-3 py-2.5 text-[15px] font-semibold ${
                          active ? "bg-indigo-50 text-indigo-700" : "text-ink-700 hover:bg-slate-50"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
                <li>
                  <Link href="/dang-nhap" onClick={logout} className="focus-ring flex items-center gap-2 rounded-lg px-3 py-2.5 text-[15px] font-semibold text-ink-700 hover:bg-rose-50 hover:text-rose-700">
                    <LogOut className="h-4 w-4" aria-hidden />
                    Đăng xuất
                  </Link>
                </li>
              </ul>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

const AUTH_ROUTES = ["/dang-nhap", "/dang-ky"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) return <>{children}</>;
  return (
    <div className="min-h-screen bg-white">
      <a
        href="#main"
        className="sr-only z-[70] rounded-lg bg-white px-4 py-2 font-semibold text-indigo-700 shadow-lift focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Bỏ qua tới nội dung chính
      </a>
      <Header pathname={pathname} />
      <motion.main
        id="main"
        key={pathname}
        tabIndex={-1}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="mx-auto max-w-page px-4 pb-28 pt-6 outline-none sm:px-6 lg:px-8"
      >
        {children}
      </motion.main>
      <ChatWidget pathname={pathname} />
    </div>
  );
}
