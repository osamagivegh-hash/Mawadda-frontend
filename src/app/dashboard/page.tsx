"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getConsultantHighlight,
  getDashboardSummary,
  getFavorites,
} from "@/lib/api";
import { clearStoredAuth, getStoredAuth } from "@/lib/auth";

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
  // Read auth fresh from localStorage on each render to ensure we have the latest token
  // This prevents stale auth data after logout/login cycles
  const [storedAuth, setStoredAuth] = useState<ReturnType<typeof getStoredAuth>>(null);
  const token = storedAuth?.token ?? null;
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [consultants, setConsultants] = useState<ConsultantHighlight[]>([]);
  const [favoritesCount, setFavoritesCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Read auth on mount and when storage changes (e.g., after login/logout)
  useEffect(() => {
    const updateAuth = () => {
      setStoredAuth(getStoredAuth());
    };
    updateAuth();
    
    // Listen for storage events (e.g., when auth changes in another tab or after login)
    window.addEventListener("storage", updateAuth);
    return () => window.removeEventListener("storage", updateAuth);
  }, []);

  const quickLinks = useMemo(
    () => [
      { href: "/", label: "الرئيسية" },
      { href: "/search", label: "ابحث عن شريك" },
      { href: "/exams", label: "الاختبارات" },
      { href: "/services", label: "خدماتنا" },
      { href: "/contact", label: "تواصل معنا" },
    ],
    [],
  );

  const actionButtons = useMemo(
    () => [
      {
        label: "إدارة طلبات التوافق",
        description: "اطلع على الطلبات المرسلة والمستلمة وحدد قرارك.",
        href: "/matches",
      },
      {
        label: "جدولة جلسة رؤية",
        description: "رتب موعدك القادم مع المستشارين المعتمدين.",
        href: "/consultations",
      },
      {
        label: "إضافة مرشح للمفضلة",
        description: "احتفظ بالأعضاء المميزين للرجوع لهم بسرعة.",
        href: "/favorites",
      },
    ],
    [],
  );

  useEffect(() => {
    if (!token) {
      router.push("/auth/login");
      return;
    }

    // Reset state before loading to ensure fresh data
    setLoading(true);
    setError(null);
    setSummary(null);
    setConsultants([]);
    setFavoritesCount(0);

    const load = async () => {
      try {
        // Fetch all data with fresh requests (no cache due to cache: "no-store" in fetchWithToken)
        const [summaryRes, consultantsRes, favoritesRes] = await Promise.all([
          getDashboardSummary(token),
          getConsultantHighlight(token, 3),
          getFavorites(token),
        ]);
        setSummary(summaryRes as SummaryResponse);
        setConsultants((consultantsRes as ConsultantHighlight[]) ?? []);
        setFavoritesCount(Array.isArray(favoritesRes) ? favoritesRes.length : 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token, router]);

  if (!token) {
    return null;
  }

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

  const displayName = storedAuth?.user.email ?? "عضو مَوَدّة";

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
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
          <button
            type="button"
            onClick={() => {
              clearStoredAuth();
              if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("storage"));
              }
              router.push("/");
            }}
            className="rounded-full bg-gradient-to-r from-rose-500 to-secondary-500 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
          >
            تسجيل الخروج
          </button>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-secondary-600 via-secondary-500 to-rose-400 pb-16 pt-12 text-white">
        <div className="section-container relative z-10 space-y-8">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm text-white/80">مرحباً من جديد</p>
            <h1 className="text-3xl font-bold">لوحتك الرئيسية، {displayName}</h1>
            <p className="text-sm leading-7 text-white/75">
              تابع مؤشرات التقدم، اكتشف الخدمات المخصصة لك، وأكمل رحلتك نحو تعارف ناجح بخطوات واضحة وبسيطة.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {actionButtons.map((action) => (
              <Link
                key={action.label}
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

      <div className="section-container -mt-12 space-y-10">
        {error ? (
          <p className="rounded-3xl bg-rose-50 px-6 py-4 text-sm text-rose-600">{error}</p>
        ) : null}

        <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-xl md:p-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {summaryCards.map((card) => (
              <div
                key={card.title}
                className="rounded-3xl border border-slate-100 bg-slate-50 p-6 shadow-sm transition hover:-translate-y-1"
              >
                <div className={`inline-flex w-max items-center justify-center rounded-full bg-gradient-to-br ${card.color} px-4 py-2 text-xs font-semibold text-white`}>
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

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800">اكتمال ملفك خطوة بخطوة</h2>
              <p className="mt-1 text-sm text-slate-500">
                أكمل العناصر التالية لتحصل على بطاقة العضوية الموثقة باللون الوردي.
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

            <aside className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">عضويتك الحالية</h2>
                <p className="mt-1 text-sm text-slate-500">
                  استكشف مزايا خطتك الحالية وقم بالترقية عند الحاجة.
                </p>
                <div className="mt-4 rounded-2xl border border-secondary-200 bg-secondary-50 p-5">
                  <p className="text-sm font-semibold text-secondary-700">
                    {summary?.membership.planDetails.name ?? "عضوية مجانية"}
                  </p>
                  {summary?.membership.planDetails.subtitle ? (
                    <p className="mt-1 text-xs text-secondary-600">
                      {summary.membership.planDetails.subtitle}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs leading-6 text-slate-600">
                    {summary?.membership.planDetails.description}
                  </p>
                  {summary?.membership.planDetails.highlight ? (
                    <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs text-secondary-600">
                      {summary.membership.planDetails.highlight}
                    </p>
                  ) : null}
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
                  أعضاء ضمن قائمتك المفضلة: {favoritesCount}
                </h3>
                <p className="text-xs text-slate-600">
                  يمكنك إدارة قائمة المفضلة لإرسال الدعوات أو حذف الأعضاء الذين لا يناسبونك.
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

        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">مستشارونا المميزون</h2>
              <p className="text-sm text-slate-500">
                اختر المستشار الأنسب لخطوتك القادمة في جلسات الرؤية الشرعية.
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
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      consultant.avatarUrl ??
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                        consultant.name,
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
                      {consultant.title ?? consultant.specialization ?? "مستشار مَوَدّة"}
                    </p>
                  </div>
                </div>
                <p className="text-xs leading-6 text-slate-600">
                  {consultant.bio ??
                    "يقدم إرشاداً متخصصاً لدعمك في اتخاذ قرار زواج متوازن ومطمئن."}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>الخبرة: {consultant.yearsExperience ?? 0} سنة</span>
                  <span>التقييم: {consultant.rating ?? 5}/5</span>
                </div>
              </div>
            ))}
            {!loading && consultants.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-secondary-200 bg-white p-6 text-center text-sm text-secondary-700">
                لا توجد استشارات بارزة حالياً، تابع باستمرار لمستجدات الفريق.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

