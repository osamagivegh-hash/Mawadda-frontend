"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchWithToken, getConsultants } from "@/lib/api";
import { getStoredAuth } from "@/lib/auth";

type Consultant = {
  _id: string;
  name: string;
  title?: string;
  specialization?: string;
  avatarUrl?: string;
  bio?: string;
};

type Consultation = {
  id: string;
  consultant: { name: string; title?: string };
  scheduledAt: string;
  status: string;
};

export default function ConsultationsPage() {
  const router = useRouter();
  const storedAuth = useMemo(() => getStoredAuth(), []);
  const token = storedAuth?.token ?? null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);

  useEffect(() => {
    if (!token) {
      router.push("/auth/login");
      setError("يرجى تسجيل الدخول للاطلاع على مواعيدك.");
      return;
    }

    const load = async () => {
      try {
        const [consultationsData, consultantsData] = await Promise.all([
          fetchWithToken<Consultation[]>("/consultations", token),
          getConsultants(token, true),
        ]);
        setConsultations(Array.isArray(consultationsData) ? consultationsData : []);
        setConsultants((consultantsData as Consultant[]) ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "تعذر تحميل البيانات.");
      }
    };

    void load();
  }, [token, router]);

  if (!token) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setError("يرجى تسجيل الدخول قبل حجز الجلسة.");
      return;
    }
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      await fetchWithToken<Consultation>(
        "/consultations",
        token,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
      const updated = await fetchWithToken<Consultation[]>(
        "/consultations",
        token,
      );
      setConsultations(updated);
      setSuccess("تم حجز الجلسة بنجاح، سيتواصل معك فريقنا لتأكيد الموعد.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="section-container space-y-10">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold text-slate-900">خدمة الرؤية والاستشارات</h1>
          <p className="text-sm text-slate-600">
            اختر المستشار المناسب، وحدد موعد الرؤية الشرعية، واستفد من المتابعة العلمية التي يقدمها فريق مَوَدّة.
          </p>
        </header>

        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                مستشارونا المتخصصون في خدمة الرؤية
              </h2>
              <p className="text-sm text-slate-500">
                كوكبة من الخبراء يساعدونك في دراسة الحالة، وترتيب اللقاءات وفق منهجية علمية دقيقة.
              </p>
            </div>
            <Link
              href="/membership"
              className="rounded-full border border-secondary-200 px-4 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-secondary-50"
            >
              ترقية لعضوية التميّز
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {consultants.map((consultant) => (
              <div
                key={consultant._id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-5"
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
                      {consultant.title ?? consultant.specialization ?? "استشاري مَوَدّة"}
                    </p>
                  </div>
                </div>
                <p className="text-xs leading-6 text-slate-600">
                  {consultant.bio ??
                    "يساعدك في تحليل الحالة، تقييم التوافق، وتقديم التوصيات الشرعية والاجتماعية المناسبة."}
                </p>
              </div>
            ))}
            {consultants.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-secondary-200 bg-white p-6 text-center text-sm text-secondary-700">
                لا توجد بيانات مستشارين متاحة حالياً، سيتم تحديث القائمة قريباً.
              </div>
            ) : null}
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm lg:grid-cols-3"
        >
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            اختر المستشار
            <select
              name="consultantId"
              required
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
            >
              {consultants.map((consultant) => (
                <option key={consultant._id} value={consultant._id}>
                  {consultant.name} – {consultant.specialization ?? consultant.title ?? "استشاري"}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            تاريخ الجلسة
            <input
              type="datetime-local"
              name="scheduledAt"
              required
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            موضوع الجلسة
            <input
              type="text"
              name="topic"
              placeholder="مثال: تقييم جاهزية الزواج"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
            />
          </label>
          <label className="lg:col-span-3 flex flex-col gap-2 text-sm text-slate-600">
            ملاحظات إضافية
            <textarea
              name="notes"
              rows={3}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
            />
          </label>
          <div className="lg:col-span-3 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
            <p>خدمة الدعم متاحة من 9 صباحًا حتى 11 مساءً على مدار الأسبوع.</p>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-secondary-600 px-6 py-3 text-white transition-colors hover:bg-secondary-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "جاري الحجز..." : "إرسال طلب الحجز"}
            </button>
          </div>
        </form>

        {error ? (
          <p className="rounded-3xl bg-rose-50 px-6 py-4 text-center text-sm text-rose-600">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-3xl bg-emerald-50 px-6 py-4 text-center text-sm text-emerald-600">
            {success}
          </p>
        ) : null}

        {consultations.length > 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">جلساتك المجدولة</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {consultations.map((consultation) => (
                <div
                  key={consultation.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600"
                >
                  <p className="font-medium text-secondary-700">
                    {consultation.consultant.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(consultation.scheduledAt).toLocaleString("ar-SA")}
                  </p>
                  <span className="mt-2 inline-flex rounded-full bg-secondary-100 px-3 py-1 text-xs font-semibold text-secondary-700">
                    {consultation.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

