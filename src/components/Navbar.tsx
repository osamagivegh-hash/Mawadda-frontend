"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearStoredAuth, getStoredAuth, StoredAuth } from "@/lib/auth";

const navLinks = [
  { href: "#why-us", label: "لماذا مَوَدَّة؟" },
  { href: "#services", label: "خدماتنا" },
  { href: "#journey", label: "كيف تعمل المنصة" },
  { href: "#consultants", label: "فريق الاستشاريين" },
  { href: "#contact", label: "تواصل معنا" },
];

export function Navbar() {
  const router = useRouter();
  const [auth, setAuth] = useState<StoredAuth | null>(null);

  useEffect(() => {
    setAuth(getStoredAuth());

    const syncAuth = () => {
      setAuth(getStoredAuth());
    };
    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  const handleLogout = () => {
    clearStoredAuth();
    setAuth(null);
    router.push("/");
  };

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="section-container flex flex-wrap items-center justify-between gap-4 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 text-xl font-bold text-secondary-700"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white font-display">
            م
          </span>
          <span>
            مَوَدَّة
            <span className="block text-xs font-normal text-slate-500">
              منصة زواج آمنة
            </span>
          </span>
        </Link>
        <nav className="flex flex-1 items-center justify-end gap-8 text-sm text-slate-600 max-lg:hidden">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-secondary-600"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {auth ? (
            <>
              <Link
                href="/search"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                البحث عن شريك
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                لوحة التحكم
              </Link>
              <Link
                href="/profile"
                className="rounded-full border border-secondary-200 px-4 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-secondary-50"
              >
                الملف الشخصي
              </Link>
              <Link
                href="/favorites"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                المفضلة
              </Link>
              <Link
                href="/membership"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                الاشتراك
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
              >
                تسجيل الخروج
              </button>
            </>
          ) : (
            <>
              <Link
                href="/search"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                البحث عن شريك
              </Link>
              <Link
                href="/auth/login"
                className="rounded-full border border-secondary-200 px-4 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-secondary-50"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/auth/register"
                className="rounded-full bg-secondary-600 px-4 py-2 text-sm font-medium text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-secondary-500"
              >
                إنشاء حساب
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

