"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Shield, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiPost } from "@/lib/api";

interface NavbarProps {
  role?: "student" | "university_staff" | "super_admin" | null;
  userName?: string;
}

const NAV_LINKS: Record<string, { label: string; href: string }[]> = {
  student: [
    { label: "Мои дипломы", href: "/student" },
    { label: "Привязать диплом", href: "/student/claim" },
  ],
  university_staff: [
    { label: "Дипломы", href: "/university" },
    { label: "Профиль ВУЗа", href: "/university/profile" },
  ],
  super_admin: [{ label: "Управление платформой", href: "/admin" }],
};

const ROLE_LABEL: Record<string, string> = {
  student: "Студент",
  university_staff: "Оператор ВУЗа",
  super_admin: "Администратор",
};

export function Navbar({ role, userName }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const links = role ? NAV_LINKS[role] ?? [] : [];

  async function handleLogout() {
    try {
      await apiPost("/api/v1/logout");
    } catch {}
    router.push("/login");
    router.refresh();
  }

  const homeHref =
    role === "student"
      ? "/student"
      : role === "university_staff"
        ? "/university"
        : role === "super_admin"
          ? "/admin"
          : "/";

  return (
    <header className="sticky top-0 z-50 w-full bg-[#1c1917] border-b border-[#2a2622]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href={homeHref} className="flex items-center gap-2.5 flex-shrink-0">
            <div className="relative w-7 h-7">
              <Shield className="w-7 h-7 text-[#a05c20]" strokeWidth={1.5} />
              <span className="absolute inset-0 flex items-center justify-center text-[#f0d4a0] font-black text-[13px] leading-none">
                V
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[#f0d4a0] font-black tracking-[0.2em] text-[15px]">
                VERITAS
              </span>
              {role && (
                <span className="hidden sm:inline text-[#a05c20] text-[10px] font-semibold tracking-widest uppercase border-l border-[#2a2622] pl-2">
                  {ROLE_LABEL[role]}
                </span>
              )}
            </div>
          </Link>

          {/* Desktop nav — underline tabs */}
          <nav className="hidden md:flex items-stretch h-14">
            {links.map((link) => {
              const active =
                pathname === link.href ||
                (link.href !== "/" &&
                  pathname.startsWith(link.href) &&
                  link.href.length > 1);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center px-5 text-sm font-medium transition-colors border-b-2",
                    active
                      ? "text-[#f0d4a0] border-[#a05c20]"
                      : "text-stone-500 border-transparent hover:text-stone-300 hover:border-stone-600"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {userName && (
              <span className="hidden sm:block text-stone-500 text-xs font-medium truncate max-w-[120px]">
                {userName}
              </span>
            )}
            {role ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-stone-500 hover:text-stone-200 transition-colors text-xs font-medium"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:block">Выйти</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="text-[#f0d4a0] text-sm font-semibold hover:text-[#c8895a] transition-colors"
              >
                Войти
              </Link>
            )}
            <button
              className="md:hidden text-stone-500 hover:text-stone-200"
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && links.length > 0 && (
        <div className="md:hidden border-t border-[#2a2622] bg-[#1c1917]">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block px-6 py-3.5 text-sm text-stone-400 hover:text-[#f0d4a0] border-b border-[#2a2622] last:border-b-0"
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="w-full text-left px-6 py-3.5 text-sm text-stone-500 hover:text-stone-200"
          >
            Выйти
          </button>
        </div>
      )}
    </header>
  );
}
