"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { login as loginRequest } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      setLoading(true);
      setError(null);
      const result = (await loginRequest(payload)) as {
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
        <div className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-8 shadow-soft">
          <h1 className="text-2xl font-bold text-slate-900">مرحبًا بعودتك</h1>
          <p className="mt-2 text-sm text-slate-600">
            أدخل بياناتك للمتابعة إلى لوحة التحكم الخاصة بك.
          </p>
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
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
              {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">
            مستخدم جديد؟{" "}
            <Link
              href="/auth/register"
              className="font-medium text-secondary-600 hover:text-secondary-500"
            >
              أنشئ حسابًا الآن
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

