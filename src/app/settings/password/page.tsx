"use client";

import { useState } from "react";
import Link from "next/link";

export default function PasswordSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 via-white to-primary-50 py-12">
      <div className="section-container max-w-2xl">
        <div className="mb-6">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-accent-600 hover:text-accent-700"
          >
            ← العودة للملف الشخصي
          </Link>
        </div>

        <div className="rounded-3xl border border-accent-100 bg-white p-8 shadow-lg">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-secondary-900">🔐 تغيير كلمة المرور</h1>
            <p className="mt-2 text-secondary-600">
              قم بتحديث كلمة المرور الخاصة بك لضمان أمان حسابك
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                كلمة المرور الحالية
              </label>
              <input
                type="password"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                placeholder="أدخل كلمة المرور الحالية"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                كلمة المرور الجديدة
              </label>
              <input
                type="password"
                required
                minLength={8}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                placeholder="أدخل كلمة المرور الجديدة"
              />
              <p className="mt-1 text-xs text-secondary-500">
                يجب أن تحتوي على 8 أحرف على الأقل
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                تأكيد كلمة المرور الجديدة
              </label>
              <input
                type="password"
                required
                minLength={8}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                placeholder="أعد إدخال كلمة المرور الجديدة"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-600">
                ✅ تم تحديث كلمة المرور بنجاح!
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-full bg-accent-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-accent-700 hover:shadow-lg disabled:opacity-70"
              >
                {loading ? "جاري التحديث..." : "🔄 تحديث كلمة المرور"}
              </button>
              
              <Link
                href="/profile"
                className="rounded-full border border-slate-200 px-6 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                إلغاء
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
