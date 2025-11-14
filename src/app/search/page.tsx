"use client";

import { FormEvent, useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { addFavorite, fetchWithToken, getFavorites } from "@/lib/api";
import { getStoredAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

type SearchFilters = {
  gender?: string;
  minAge?: string;
  maxAge?: string;
  city?: string;
  keyword?: string;
  memberId?: string;
};

type SearchResult = {
  user: {
    id: string;
    email: string;
    role: string;
    status: string;
    memberId: string;
  };
  profile: {
    id: string;
    firstName?: string;
    lastName?: string;
    gender?: string;
    nationality?: string;
    city?: string;
    education?: string;
    occupation?: string;
    maritalStatus?: string;
    about?: string;
    photoUrl?: string;
    religiosityLevel?: string;
  };
};

type FavoriteEntry = {
  target: { id: string };
};

const initialFilters: SearchFilters = {
  gender: "",
  minAge: "",
  maxAge: "",
  city: "",
  keyword: "",
  memberId: "",
};

export default function SearchPage() {
  const router = useRouter();
  const storedAuth = useMemo(() => getStoredAuth(), []);
  const token = storedAuth?.token ?? null;
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [favoritesIds, setFavoritesIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    if (!token) return;
    try {
      const favorites = await getFavorites(token);
      if (Array.isArray(favorites)) {
        setFavoritesIds(favorites.map((item: FavoriteEntry) => item.target.id));
      }
    } catch {
      // نتجاهل الخطأ هنا ونعتمد على طلبات لاحقة
    }
  }, [token]);

  const handleSearch = useCallback(
    async (customFilters?: SearchFilters) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const activeFilters = customFilters ?? filters;
        const query = Object.entries(activeFilters)
          .filter(([key, value]) => {
            if (typeof value !== "string" || value.trim().length === 0) return false;
            // التحقق من صحة قيم العمر
            if (key === "minAge" || key === "maxAge") {
              const ageValue = parseInt(value);
              return !isNaN(ageValue) && ageValue >= 18 && ageValue <= 80;
            }
            return true;
          })
          .map(
            ([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value ?? "")}`,
          )
          .join("&");
        const endpoint = query ? `/search?${query}` : "/search";
        const data = await fetchWithToken<SearchResult[]>(endpoint, token);
        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
      } finally {
        setLoading(false);
      }
    },
    [filters, token],
  );

  useEffect(() => {
    if (!token) {
      router.push("/auth/login");
    } else {
      void (async () => {
        await Promise.all([handleSearch(), loadFavorites()]);
      })();
    }
  }, [token, router, handleSearch, loadFavorites]);

  if (!token) {
    return null;
  }

  const updateFilter = (name: keyof SearchFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    void handleSearch(initialFilters);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleSearch();
  };

  const handleAddFavorite = async (targetUserId: string) => {
    if (!token) return;
    try {
      setFeedback(null);
      await addFavorite(token, targetUserId);
      setFavoritesIds((prev) => Array.from(new Set([...prev, targetUserId])));
      setFeedback("تمت إضافة العضو إلى المفضلة");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر إضافة العضو للمفضلة");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 via-white to-primary-50 py-12">
      <div className="section-container space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">🔍 البحث عن شريك الحياة</h1>
            <p className="mt-2 text-sm text-secondary-600">
              استخدم الفلاتر المتقدمة أدناه للعثور على الأعضاء المناسبين لتفضيلاتك. يمكنك البحث بالاسم، المدينة، أو رقم العضوية.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              href="/dashboard"
              className="rounded-full border border-slate-200 px-4 py-2 text-slate-600 transition-colors hover:bg-slate-50"
            >
              العودة للوحة التحكم
            </Link>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full border border-accent-200 px-4 py-2 text-accent-700 transition-colors hover:bg-accent-50"
            >
              🔄 إعادة تعيين الفلاتر
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-3xl border border-accent-100 bg-white p-6 shadow-lg md:grid-cols-2 lg:grid-cols-3"
        >
          {/* البحث الأساسي */}
          <label className="flex flex-col gap-2 text-sm text-slate-600 lg:col-span-3">
            <span className="font-medium text-secondary-700">🔍 البحث السريع</span>
            <input
              value={filters.keyword || filters.memberId || ""}
              onChange={(event) => {
                const value = event.target.value;
                if (value.startsWith("MAW-") || /^\d+$/.test(value)) {
                  updateFilter("memberId", value);
                  updateFilter("keyword", "");
                } else {
                  updateFilter("keyword", value);
                  updateFilter("memberId", "");
                }
              }}
              className="rounded-xl border border-accent-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
              placeholder="ابحث بالاسم، رقم العضوية (MAW-000123)، أو أي كلمة..."
            />
          </label>

          {/* الفلاتر الأساسية */}
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            الجنس
            <select
              value={filters.gender}
              onChange={(event) => updateFilter("gender", event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
            >
              <option value="">الكل</option>
              <option value="female">أنثى</option>
              <option value="male">ذكر</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-600">
            المدينة
            <input
              value={filters.city}
              onChange={(event) => updateFilter("city", event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
              placeholder="مثال: الرياض"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-600">
            العمر
            <div className="flex gap-2">
              <input
                type="number"
                min={18}
                max={80}
                value={filters.minAge}
                onChange={(event) => updateFilter("minAge", event.target.value)}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                placeholder="من"
              />
              <span className="self-center text-slate-400">-</span>
              <input
                type="number"
                min={18}
                max={80}
                value={filters.maxAge}
                onChange={(event) => updateFilter("maxAge", event.target.value)}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                placeholder="إلى"
              />
            </div>
          </label>

          <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-accent-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-accent-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "جارٍ البحث..." : "🔍 تنفيذ البحث"}
            </button>
          </div>
        </form>

        {feedback ? (
          <p className="rounded-3xl bg-emerald-50 px-6 py-4 text-sm text-emerald-600">{feedback}</p>
        ) : null}
        {error ? (
          <p className="rounded-3xl bg-rose-50 px-6 py-4 text-sm text-rose-600">{error}</p>
        ) : null}

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-secondary-800">
              🔍 نتائج البحث ({results.length})
            </h2>
            {results.length > 0 && (
              <span className="rounded-full bg-accent-100 px-3 py-1 text-xs font-medium text-accent-700">
                {results.length} عضو
              </span>
            )}
          </div>
          {loading ? (
            <div className="rounded-3xl border border-accent-100 bg-accent-50 p-6 text-sm text-accent-700 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent-600 border-t-transparent"></div>
                جارٍ البحث عن الأعضاء المناسبين...
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-lg font-medium text-slate-800 mb-2">لا توجد نتائج</h3>
              <p className="text-sm text-slate-600">
                لم نجد أعضاء يطابقون معايير البحث الحالية. جرب تعديل الفلاتر أو توسيع نطاق البحث.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {results.map((result) => {
                const isFavorite = favoritesIds.includes(result.user.id);
                return (
                  <div
                    key={result.profile.id}
                    className="rounded-3xl border border-accent-100 bg-white p-6 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-secondary-700">
                          {result.profile.firstName || result.profile.lastName
                            ? `${result.profile.firstName ?? ""} ${
                                result.profile.lastName ?? ""
                              }`.trim()
                            : "عضو بدون اسم معلن"}
                        </h3>
                        <p className="text-sm text-slate-500">
                          رقم العضوية:
                          <span className="font-medium text-accent-600"> {result.user.memberId}</span>
                        </p>
                        <p className="text-sm text-slate-500">
                          الجنسية: {result.profile.nationality ?? "غير محدد"}
                        </p>
                        <p className="text-sm text-slate-500">
                          المدينة: {result.profile.city ?? "غير محدد"}
                        </p>
                        <p className="text-sm text-slate-500">
                          الحالة الاجتماعية: {result.profile.maritalStatus ?? "غير محدد"}
                        </p>
                      </div>
                      {result.profile.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={result.profile.photoUrl}
                          alt="صورة العضو"
                          className="h-24 w-24 rounded-2xl object-cover shadow-inner"
                        />
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-100 text-xs text-slate-500">
                          لا توجد صورة
                        </div>
                      )}
                    </div>
                    {result.profile.about ? (
                      <p className="mt-3 text-sm leading-6 text-slate-600">{result.profile.about}</p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Link
                        href={`/matches?focus=${result.user.id}`}
                        className="rounded-full bg-accent-600 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-accent-700 hover:shadow-lg"
                      >
                        💌 إرسال طلب تعارف
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleAddFavorite(result.user.id)}
                        disabled={isFavorite}
                        className="rounded-full border border-accent-200 px-4 py-2 text-xs font-medium text-accent-600 transition-colors hover:bg-accent-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isFavorite ? "⭐ ضمن المفضلة" : "🤍 إضافة إلى المفضلة"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

