"use client";

import { FormEvent, useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { addFavorite, fetchWithToken, getFavorites } from "@/lib/api";
import { getStoredAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

type SearchFilters = {
  gender?: string;
  nationality?: string;
  minAge?: string;
  maxAge?: string;
  education?: string;
  maritalStatus?: string;
  city?: string;
  marriageType?: string;
  hasPhoto?: string;
  keyword?: string;
  memberId?: string;
};

type SearchResult = {
  user: {
    id: string;
    email: string;
    role: string;
    status: string;
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
  nationality: "",
  minAge: "",
  maxAge: "",
  education: "",
  maritalStatus: "",
  city: "",
  marriageType: "",
  hasPhoto: "",
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
          .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
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
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="section-container space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">البحث عن شريك</h1>
            <p className="mt-2 text-sm text-slate-600">
              استخدم الفلاتر أدناه لإيجاد الأعضاء المناسبين لتفضيلاتك.
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
              className="rounded-full border border-secondary-200 px-4 py-2 text-secondary-700 transition-colors hover:bg-secondary-50"
            >
              إعادة تعيين الفلاتر
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-soft md:grid-cols-2 lg:grid-cols-4"
        >
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            الجنس
            <select
              value={filters.gender}
              onChange={(event) => updateFilter("gender", event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
            >
              <option value="">الكل</option>
              <option value="female">أنثى</option>
              <option value="male">ذكر</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-600">
            الجنسية
            <input
              value={filters.nationality}
              onChange={(event) => updateFilter("nationality", event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
              placeholder="مثال: السعودية"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-600">
            الحد الأدنى للعمر
            <input
              type="number"
              min={18}
              max={80}
              value={filters.minAge}
              onChange={(event) => updateFilter("minAge", event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-600">
            الحد الأعلى للعمر
            <input
              type="number"
              min={18}
              max={80}
              value={filters.maxAge}
              onChange={(event) => updateFilter("maxAge", event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-600">
            المستوى التعليمي
            <input
              value={filters.education}
              onChange={(event) => updateFilter("education", event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-600">
            الحالة الاجتماعية
            <input
              value={filters.maritalStatus}
              onChange={(event) => updateFilter("maritalStatus", event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-600">
            المدينة
            <input
              value={filters.city}
              onChange={(event) => updateFilter("city", event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-600">
            البحث بالكلمات
            <input
              value={filters.keyword}
              onChange={(event) => updateFilter("keyword", event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
              placeholder="اسم، لقب، بريد..."
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-600">
            رقم العضو
            <input
              value={filters.memberId}
              onChange={(event) => updateFilter("memberId", event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-600">
            يوجد صورة
            <select
              value={filters.hasPhoto}
              onChange={(event) => updateFilter("hasPhoto", event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
            >
              <option value="">الكل</option>
              <option value="true">نعم</option>
            </select>
          </label>

          <div className="md:col-span-2 lg:col-span-4 flex justify-end gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-secondary-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-secondary-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "جارٍ البحث..." : "تنفيذ البحث"}
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
          <h2 className="text-lg font-semibold text-slate-800">النتائج ({results.length})</h2>
          {loading ? (
            <div className="rounded-3xl border border-slate-100 bg-white p-6 text-sm text-slate-600">
              جارٍ تحميل النتائج...
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-3xl border border-slate-100 bg-white p-6 text-sm text-slate-600">
              لا توجد نتائج مطابقة في الوقت الحالي. حاول تعديل الفلاتر.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {results.map((result) => {
                const isFavorite = favoritesIds.includes(result.user.id);
                return (
                  <div
                    key={result.profile.id}
                    className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
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
                          رقم العضو:
                          <span className="font-medium text-secondary-600"> {result.user.id}</span>
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
                        className="rounded-full bg-secondary-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-secondary-500"
                      >
                        إرسال طلب تعارف
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleAddFavorite(result.user.id)}
                        disabled={isFavorite}
                        className="rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isFavorite ? "ضمن المفضلة" : "إضافة إلى المفضلة"}
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

