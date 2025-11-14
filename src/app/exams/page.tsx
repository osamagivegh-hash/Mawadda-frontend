"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAvailableExams,
  getUserPurchasedExams,
  purchaseExam,
} from "@/lib/api";
import { clearStoredAuth, getStoredAuth } from "@/lib/auth";

type Exam = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  duration: number;
};

export default function ExamsPage() {
  const router = useRouter();
  const storedAuth = useMemo(() => getStoredAuth(), []);
  const token = storedAuth?.token ?? null;
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [purchasedExams, setPurchasedExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const quickLinks = useMemo(
    () => [
      { href: "/", label: "الرئيسية" },
      { href: "/dashboard", label: "لوحة التحكم" },
      { href: "/membership", label: "العضوية" },
      { href: "/profile", label: "الملف الشخصي" },
    ],
    [],
  );

  useEffect(() => {
    if (!token) {
      router.push("/auth/login");
      return;
    }

    const loadExams = async () => {
      try {
        const [available, purchased] = await Promise.all([
          getAvailableExams(token),
          getUserPurchasedExams(token),
        ]);
        setAvailableExams((available as Exam[]) ?? []);
        setPurchasedExams((purchased as Exam[]) ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "حدث خطأ في تحميل الاختبارات");
      } finally {
        setLoading(false);
      }
    };

    void loadExams();
  }, [token, router]);

  const handlePurchaseExam = async (examId: string) => {
    if (!token) {
      router.push("/auth/login");
      return;
    }

    try {
      setPurchasing(examId);
      setError(null);
      setSuccess(null);

      const response = (await purchaseExam(token, examId)) as {
        message?: string;
        paymentUrl?: string;
        exam?: Exam;
      };

      if (response.paymentUrl) {
        setSuccess(response.message || "يجب إكمال الدفع للوصول إلى الاختبار.");
        
        // Redirect to payment URL after a short delay
        setTimeout(() => {
          window.open(response.paymentUrl, '_blank');
        }, 2000);
      } else {
        setSuccess("تم شراء الاختبار بنجاح!");
        // Refresh the page to update purchased exams
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر شراء الاختبار");
    } finally {
      setPurchasing(null);
    }
  };

  const isExamPurchased = (examId: string) => {
    return purchasedExams.some(exam => exam.id === examId);
  };

  if (!token) return null;

  const displayName = storedAuth?.user.email ?? "عضو مَوَدّة";

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-rose-100 bg-white/95 backdrop-blur">
        <div className="section-container flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
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

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-secondary-600 via-secondary-500 to-rose-400 pb-16 pt-12 text-white">
        <div className="section-container relative z-10 space-y-8">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm text-white/80">مرحباً بك في مَوَدَّة</p>
            <h1 className="text-3xl font-bold">الاختبارات والتقييمات</h1>
            <p className="text-sm leading-7 text-white/75">
              اكتشف شخصيتك وقم بتقييم مستوى التوافق من خلال اختباراتنا المتخصصة
            </p>
          </div>
        </div>
        <div className="absolute inset-0 bg-[url('/patterns/hero-shape.svg')] bg-cover bg-center opacity-10" />
      </section>

      {/* Content */}
      <div className="section-container -mt-12 space-y-8">
        {error && (
          <div className="rounded-3xl bg-rose-50 px-6 py-4 text-sm text-rose-600">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-3xl bg-emerald-50 px-6 py-4 text-sm text-emerald-600">
            {success}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-white/60 bg-white p-8 shadow-xl text-center">
            <p className="text-slate-600">جاري تحميل الاختبارات...</p>
          </div>
        ) : (
          <>
            {/* Purchased Exams */}
            {purchasedExams.length > 0 && (
              <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-xl md:p-8">
                <h2 className="text-xl font-semibold text-secondary-700 mb-6">
                  اختباراتي المشتراة
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {purchasedExams.map((exam) => (
                    <div
                      key={exam.id}
                      className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6"
                    >
                      <h3 className="text-lg font-semibold text-emerald-800 mb-2">
                        {exam.title}
                      </h3>
                      <p className="text-sm text-emerald-600 mb-4">
                        {exam.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-emerald-600 mb-4">
                        <span>المدة: {exam.duration} دقيقة</span>
                        <span className="font-semibold">مشترى ✓</span>
                      </div>
                      <Link
                        href={`/exams/${exam.id}`}
                        className="block w-full rounded-full bg-emerald-600 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-emerald-500"
                      >
                        بدء الاختبار
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Exams */}
            <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-xl md:p-8">
              <h2 className="text-xl font-semibold text-secondary-700 mb-6">
                الاختبارات المتاحة
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableExams.map((exam) => {
                  const isPurchased = isExamPurchased(exam.id);
                  const isPurchasing = purchasing === exam.id;
                  
                  return (
                    <div
                      key={exam.id}
                      className={`rounded-2xl border p-6 ${
                        isPurchased 
                          ? 'border-emerald-200 bg-emerald-50' 
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <h3 className={`text-lg font-semibold mb-2 ${
                        isPurchased ? 'text-emerald-800' : 'text-slate-800'
                      }`}>
                        {exam.title}
                      </h3>
                      <p className={`text-sm mb-4 ${
                        isPurchased ? 'text-emerald-600' : 'text-slate-600'
                      }`}>
                        {exam.description}
                      </p>
                      <div className={`flex items-center justify-between text-xs mb-4 ${
                        isPurchased ? 'text-emerald-600' : 'text-slate-600'
                      }`}>
                        <span>المدة: {exam.duration} دقيقة</span>
                        <span className="font-semibold">
                          {exam.price} {exam.currency}
                        </span>
                      </div>
                      
                      {isPurchased ? (
                        <Link
                          href={`/exams/${exam.id}`}
                          className="block w-full rounded-full bg-emerald-600 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-emerald-500"
                        >
                          بدء الاختبار
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePurchaseExam(exam.id)}
                          disabled={isPurchasing}
                          className="w-full rounded-full bg-secondary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-secondary-500 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {isPurchasing ? "جاري الشراء..." : "شراء الاختبار"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {availableExams.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-slate-600">لا توجد اختبارات متاحة حالياً</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
