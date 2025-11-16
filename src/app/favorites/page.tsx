"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useFavoritesStore } from "@/store/favorites-store";

export default function FavoritesPage() {
  const { isAuthenticated, loading: authLoading } = useAuthStore();
  const { favorites, loading, error, loadFavorites, toggleFavorite } =
    useFavoritesStore();

  useEffect(() => {
    if (isAuthenticated) {
      void loadFavorites();
    }
  }, [isAuthenticated, loadFavorites]);

  // Show loading screen while auth is hydrating
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-slate-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Show login required if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full rounded-3xl border border-slate-100 bg-white p-8 shadow-lg text-center">
          <h1 className="text-2xl font-bold text-secondary-900 mb-4">
            تحتاج إلى تسجيل الدخول للوصول إلى قائمة المفضلة
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            يرجى تسجيل الدخول لإدارة الأعضاء المفضلين لديك.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/auth/login"
              className="rounded-full bg-accent-600 px-6 py-3 text-sm font-medium text-white hover:bg-accent-700 transition"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/"
              className="text-sm text-secondary-600 hover:text-secondary-500"
            >
              العودة إلى الصفحة الرئيسية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="section-container space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold text-slate-900">قائمة المفضلة</h1>
          <p className="text-sm text-slate-600">
            يمكنك العودة سريعًا للأعضاء الذين نالوا إعجابك، ومتابعة إجراءات التوافق معهم.
          </p>
        </header>

        {error ? (
          <p className="rounded-3xl bg-rose-50 px-6 py-4 text-sm text-rose-600">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500">
            جار تحميل قائمة المفضلة...
          </div>
        ) : favorites.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500">
            لا توجد عناصر في المفضلة حتى الآن. تصفّح{" "}
            <Link
              href="/search"
              className="text-secondary-600 hover:text-secondary-500"
            >
              البحث عن شريك
            </Link>{" "}
            وأضف الأعضاء الذين يهمك أمرهم.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {favorites.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      item.target.profile?.photoUrl ??
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                        item.target.profile?.firstName ?? item.target.email,
                      )}`
                    }
                    alt={item.target.profile?.firstName ?? item.target.email}
                    className="h-16 w-16 rounded-2xl object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-secondary-700">
                      {(item.target.profile?.firstName ?? "عضو") +
                        " " +
                        (item.target.profile?.lastName ?? "")}
                    </p>
                    <p className="text-xs text-slate-500">
                      رقم العضو: {item.target.id}
                    </p>
                    <p className="text-xs text-slate-500">
                      المدينة: {item.target.profile?.city ?? "غير محدد"}
                    </p>
                  </div>
                </div>
                {item.target.profile?.about ? (
                  <p className="mt-3 text-xs leading-6 text-slate-600">
                    {item.target.profile.about}
                  </p>
                ) : null}
                <div className="mt-4 flex items-center gap-3">
                  <Link
                    href={`/matches?focus=${item.target.id}`}
                    className="rounded-full bg-secondary-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-secondary-500"
                  >
                    إرسال طلب تعارف
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(item.target.id)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50"
                  >
                    إزالة من المفضلة
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}