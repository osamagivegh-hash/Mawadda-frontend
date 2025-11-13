"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { register as registerRequest } from "@/lib/api";

const roles = [
  { value: "female", label: "عضوة" },
  { value: "male", label: "عضو" },
  { value: "consultant", label: "مستشار" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rawEntries = Object.fromEntries(formData.entries());
    const payload = Object.fromEntries(
      Object.entries(rawEntries).filter(
        ([, value]) =>
          typeof value === "string" && value.trim().length > 0,
      ),
    );

    try {
      setLoading(true);
      setError(null);
      const result = (await registerRequest(payload)) as {
        token?: string;
        user?: Record<string, unknown>;
      };
      const token = result.token;
      if (token) {
        window.localStorage.setItem("mawaddahToken", token);
      }
      if (result.user) {
        window.localStorage.setItem(
          "mawaddahUser",
          JSON.stringify(result.user),
        );
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <div className="section-container flex flex-1 flex-col items-center justify-center py-16">
        <div className="w-full max-w-2xl rounded-3xl border border-slate-100 bg-white p-8 shadow-soft">
          <h1 className="text-2xl font-bold text-slate-900">
            إنشاء حساب جديد في مَوَدَّة
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            املأ البيانات التالية لإتمام عملية التسجيل. جميع المعلومات محفوظة
            بسرية تامة.
          </p>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-slate-600">
                البريد الإلكتروني
                <input
                  name="email"
                  type="email"
                  required
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-600">
                كلمة المرور
                <input
                  name="password"
                  type="password"
                  minLength={8}
                  required
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-600">
                نوع الحساب
                <select
                  name="role"
                  defaultValue="female"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-600">
                الاسم الأول
                <input
                  name="firstName"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-600">
                الاسم الأخير
                <input
                  name="lastName"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
                />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-slate-600">
                اسم ولي الأمر (اختياري)
                <input
                  name="guardianName"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-600">
                تواصل ولي الأمر
                <input
                  name="guardianContact"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
                />
              </label>
            </div>
            {error ? (
              <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-secondary-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-secondary-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "جاري إنشاء الحساب..." : "تأكيد التسجيل"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">
            لديك حساب بالفعل؟{" "}
            <Link
              href="/auth/login"
              className="font-medium text-secondary-600 hover:text-secondary-500"
            >
              سجل الدخول هنا
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

