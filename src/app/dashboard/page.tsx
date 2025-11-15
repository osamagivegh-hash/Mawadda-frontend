"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getConsultantHighlight,
  getDashboardSummary,
  getFavorites,
} from "@/lib/api";

import {
  clearStoredAuth,
  getStoredAuth,
  type StoredAuth,
} from "@/lib/auth";

type SummaryResponse = {
  profileCompletion: number;
  profileChecklist: { key: string; label: string; completed: boolean }[];
  stats: {
    matches: { total: number; pending: number; approved: number; declined: number };
    consultations: { total: number; upcoming: number };
    favorites: number;
  };
  membership: {
    planId: string;
    expiresAt: string | null;
    planDetails: {
      id: string;
      name: string;
      subtitle?: string;
      description: string;
      price: number;
      currency: string;
      durationDays: number | null;
      features: string[];
      highlight?: string;
    };
  };
};

type ConsultantHighlight = {
  _id: string;
  name: string;
  title?: string;
  specialization?: string;
  bio?: string;
  avatarUrl?: string;
  rating?: number;
  yearsExperience?: number;
};

export default function DashboardPage() {
  const router = useRouter();

  // ============================
  // 1) AUTH STATE (محسّنة)
  // ============================
  const [authLoaded, setAuthLoaded] = useState(false); // لتحديد وقت اكتمال قراءة localStorage
  const [auth, setAuth] = useState<StoredAuth | null>(null);
  const token = auth?.token ?? null;

  // ============================
  // 2) DATA STATES (يجب أن تكون قبل أي return)
  // ============================
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [consultants, setConsultants] = useState<ConsultantHighlight[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // قراءة التوكن فور تحميل الصفحة فقط
  useEffect(() => {
    const stored = getStoredAuth();
    setAuth(stored);
    setAuthLoaded(true);

    // التحديث إذا تغيّر auth من Tab آخر
    const sync = () => setAuth(getStoredAuth());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  // حماية الصفحة – لكن فقط بعد اكتمال التحميل
  useEffect(() => {
    if (!authLoaded) return;
    if (!token) {
      router.replace("/auth/login");
    }
  }, [authLoaded, token, router]);

  // ============================
  // 3) LOAD DASHBOARD DATA (يجب أن يكون قبل أي return)
  // ============================
  useEffect(() => {
    if (!token) return;
    
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [summaryRes, consultantsRes, favoritesRes] = await Promise.all([
          getDashboardSummary(token),
          getConsultantHighlight(token, 3),
          getFavorites(token),
        ]);

        setSummary(summaryRes as SummaryResponse);
        setConsultants(Array.isArray(consultantsRes) ? (consultantsRes as ConsultantHighlight[]) : []);
        setFavoritesCount(Array.isArray(favoritesRes) ? favoritesRes.length : 0);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "حدث خطأ أثناء تحميل البيانات."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  // ============================
  // 4) QUICK LINKS (يجب أن يكون قبل أي return)
  // ============================
  const quickLinks = useMemo(
    () => [
      { href: "/", label: "الرئيسية" },
      { href: "/search", label: "ابحث عن شريك" },
      { href: "/exams", label: "الاختبارات" },
      { href: "/services", label: "خدماتنا" },
      { href: "/contact", label: "تواصل معنا" },
    ],
    []
  );

  // ============================
  // 5) EARLY RETURNS (بعد جميع الـ hooks)
  // ============================
  // إذا لم يتم تحميل auth بعد → لا نعرض أي شيء
  if (!authLoaded) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-secondary-600">
        جاري التحميل...
      </div>
    );
  }

  // إذا authLoaded == true لكن token غير موجود → إعادة التوجيه ستعمل بالأعلى
  if (!token) {
    return null;
  }

  // ============================
  // 6) SUMMARY CARDS
  // ============================
  const summaryCards = [
    {
      title: "إكتمال ملفك",
      value: summary ? `${summary.profileCompletion}%` : "—",
      description: "أكمل ملفك للحصول على شارة التميّز.",
      cta: "تحديث الملف الشخصي",
      href: "/profile",
      color: "from-secondary-500 to-secondary-600",
    },
    {
      title: "طلبات التوافق",
      value: summary ? summary.stats.matches.pending.toString() : "—",
      description: "طلبات تنتظر قرارك.",
      cta: "إدارة الطلبات",
      href: "/matches",
      color: "from-primary-500 to-primary-600",
    },
    {
      title: "جلسات الرؤية",
      value: summary ? summary.stats.consultations.upcoming.toString() : "—",
      description: "استعد للجلسات القادمة.",
      cta: "جدولة الجلسات",
      href: "/consultations",
      color: "from-emerald-500 to-emerald-600",
    },
  ];

  const displayName = auth?.user?.email ?? "عضو مَوَدّة";

  // ============================
  // 7) RETURN UI
  // ============================
  return (
    <div className="min-h-screen bg-slate-50 pb-16">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-rose-100 bg-white/95 backdrop-blur">
        <div className="section-container flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              prefetch={false}
              className="flex items-center gap-3 text-xl font-bold text-secondary-700"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-secondary-500 text-white font-display">
                م
              </span>
              <span className="leading-tight">
                مَوَدَّة
                <span className="block text-xs font-normal text-slate-500">
                  منصة زواج آمنة
                </span>
              </span>
            </Link>

            {/* LINKS */}
            <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={false}
                  className="rounded-full border border-transparent px-3 py-1.5 transition hover:border-secondary-200 hover:text-secondary-600"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* LOGOUT */}
          <button
            type="button"
            onClick={() => {
              clearStoredAuth();
              window.dispatchEvent(new Event("storage"));
              router.push("/");
            }}
            className="rounded-full bg-gradient-to-r from-rose-500 to-secondary-500 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
          >
            تسجيل الخروج
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-secondary-600 via-secondary-500 to-rose-400 pb-16 pt-12 text-white">
        <div className="section-container relative z-10 space-y-8">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm text-white/80">مرحباً من جديد</p>
            <h1 className="text-3xl font-bold">لوحتك الرئيسية، {displayName}</h1>
            <p className="text-sm leading-7 text-white/75">
              تابع مؤشرات التقدم، واكتشف الخدمات المخصصة لك.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                label: "إدارة طلبات التوافق",
                description: "اطلع على الطلبات المرسلة والمستلمة.",
                href: "/matches",
              },
              {
                label: "جدولة جلسة رؤية",
                description: "حدد موعد جلستك القادمة.",
                href: "/consultations",
              },
              {
                label: "إدارة المفضلة",
                description: "احتفظ بالأعضاء المميزين.",
                href: "/favorites",
              },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex flex-col gap-2 rounded-2xl bg-white/15 px-6 py-5 text-right shadow-lg transition hover:bg-white/25"
              >
                <span className="text-sm font-semibold text-white">{action.label}</span>
                <span className="text-xs leading-6 text-white/80">{action.description}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="absolute inset-0 bg-[url('/patterns/hero-shape.svg')] bg-cover bg-center opacity-10" />
      </section>

      {/* DASHBOARD CONTENT */}
      <div className="section-container -mt-12 space-y-10">

        {error && (
          <div className="rounded-3xl bg-rose-50 px-6 py-4 text-sm text-rose-600">
            {error}
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-xl md:p-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {summaryCards.map((card) => (
              <div
                key={card.title}
                className="rounded-3xl border border-slate-100 bg-slate-50 p-6 shadow-sm transition hover:-translate-y-1"
              >
                <div
                  className={`inline-flex w-max items-center justify-center rounded-full bg-gradient-to-br ${card.color} px-4 py-2 text-xs font-semibold text-white`}
                >
                  {card.title}
                </div>

                <div className="mt-5 text-3xl font-bold text-slate-900">
                  {card.value}
                </div>
                <p className="mt-2 text-sm text-slate-600">{card.description}</p>

                <Link
                  href={card.href}
                  prefetch={false}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-secondary-600 hover:text-secondary-500"
                >
                  {card.cta}
                  <span aria-hidden>↗</span>
                </Link>
              </div>
            ))}
          </div>

          {/* Checklist + Sidebar */}
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">

            {/* Checklist */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800">
                اكتمال ملفك خطوة بخطوة
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                أكمل العناصر التالية لتحصل على بطاقة العضوية الموثقة.
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {(summary?.profileChecklist ?? []).map((item) => (
                  <div
                    key={item.key}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
                      item.completed
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        item.completed
                          ? "bg-emerald-200 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {item.completed ? "✓" : "•"}
                    </span>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  عضويتك الحالية
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  تعرف على مزايا خطتك الحالية.
                </p>

                <div className="mt-4 rounded-2xl border border-secondary-200 bg-secondary-50 p-5">
                  <p className="text-sm font-semibold text-secondary-700">
                    {summary?.membership.planDetails.name ?? "عضوية مجانية"}
                  </p>

                  <p className="mt-2 text-xs leading-6 text-slate-600">
                    {summary?.membership.planDetails.description}
                  </p>

                  <Link
                    href="/membership"
                    prefetch={false}
                    className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-secondary-700 hover:text-secondary-500"
                  >
                    استعراض خيارات الترقية ↗
                  </Link>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  أعضاء ضمن المفضلة: {favoritesCount}
                </h3>

                <p className="text-xs text-slate-600">
                  قم بإدارة قائمة المفضلة بسهولة.
                </p>

                <Link
                  href="/favorites"
                  prefetch={false}
                  className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-secondary-600 hover:text-secondary-500"
                >
                  إدارة المفضلة ↗
                </Link>
              </div>
            </aside>
          </div>
        </div>

        {/* Consultants */}
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                مستشارونا المميزون
              </h2>
              <p className="text-sm text-slate-500">
                اختر المستشار الأنسب لك.
              </p>
            </div>
            <Link
              href="/consultations"
              prefetch={false}
              className="rounded-full border border-secondary-200 px-4 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-secondary-50"
            >
              حجز جلسة رؤية
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {consultants.map((consultant) => (
              <div
                key={consultant._id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-5"
              >
                <img
                  src={
                    consultant.avatarUrl ??
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      consultant.name
                    )}`
                  }
                  alt={consultant.name}
                  className="h-14 w-14 rounded-full object-cover"
                />

                <div>
                  <p className="text-sm font-semibold text-secondary-700">
                    {consultant.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {consultant.title ??
                      consultant.specialization ??
                      "مستشار مَوَدّة"}
                  </p>
                </div>

                <p className="text-xs leading-6 text-slate-600">
                  {consultant.bio ??
                    "يقدم إرشاداً متخصصاً لدعمك في اتخاذ قرار زواج متوازن."}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>الخبرة: {consultant.yearsExperience ?? 0} سنة</span>
                  <span>التقييم: {consultant.rating ?? 5}/5</span>
                </div>
              </div>
            ))}

            {!loading && consultants.length === 0 && (
              <div className="rounded-2xl border border-dashed border-secondary-200 bg-white p-6 text-center text-sm text-secondary-700">
                لا توجد استشارات بارزة حالياً.
              </div>
            )}
          </div>
        </section>
      </div>

    </div>
  );
}
