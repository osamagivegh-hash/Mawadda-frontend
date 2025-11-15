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
  height?: string;
  countryOfResidence?: string;
  nationality?: string;
  education?: string;
  maritalStatus?: string;
  religion?: string;
  marriageType?: string;
  polygamyAcceptance?: string;
  compatibilityTest?: string;
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
    memberId: string;
  };
  profile: {
    id: string;
    firstName?: string;
    lastName?: string;
    gender?: string;
    nationality?: string;
    city?: string;
    countryOfResidence?: string;
    education?: string;
    occupation?: string;
    maritalStatus?: string;
    marriageType?: string;
    polygamyAcceptance?: string;
    compatibilityTest?: string;
    religion?: string;
    religiosityLevel?: string;
    about?: string;
    photoUrl?: string;
    dateOfBirth?: string;
    height?: number;
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
  height: "",
  countryOfResidence: "",
  nationality: "",
  education: "",
  maritalStatus: "",
  religion: "",
  marriageType: "",
  polygamyAcceptance: "",
  compatibilityTest: "",
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
      
      const activeFilters = customFilters ?? filters;
      
      // Validate age range if both are provided
      if (activeFilters.minAge && activeFilters.maxAge) {
        const minAge = parseInt(activeFilters.minAge);
        const maxAge = parseInt(activeFilters.maxAge);
        if (!isNaN(minAge) && !isNaN(maxAge) && minAge > maxAge) {
          setError("العمر الأدنى لا يمكن أن يكون أكبر من العمر الأقصى");
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);
      setFeedback(null);
      
      try {
        console.log("Active filters before processing:", activeFilters);
        
        // Build query parameters
        const queryParams = new URLSearchParams();
        
        // Add all filters that have values
        Object.entries(activeFilters).forEach(([key, value]) => {
          if (!value) return;
          
          const stringValue = String(value).trim();
          if (stringValue.length === 0) return;
          if (stringValue.toLowerCase() === "all") return;
          
          // Handle special cases
          if (key === "minAge" || key === "maxAge") {
            const ageValue = parseInt(stringValue);
            if (!isNaN(ageValue) && ageValue >= 18 && ageValue <= 80) {
              queryParams.append(key, String(ageValue));
            }
            return;
          }
          
          if (key === "height") {
            const heightValue = parseInt(stringValue);
            if (!isNaN(heightValue) && heightValue >= 100 && heightValue <= 250) {
              queryParams.append(key, String(heightValue));
            }
            return;
          }
          
          // Add other filters
          queryParams.append(key, stringValue);
        });
        
        const queryString = queryParams.toString();
        const endpoint = queryString ? `/search?${queryString}` : "/search";
        
        console.log("Search endpoint:", endpoint);
        console.log("Query params:", Object.fromEntries(queryParams.entries()));
        
        const data = await fetchWithToken<SearchResult[]>(endpoint, token);
        console.log("Search response:", data);
        
        if (Array.isArray(data)) {
          setResults(data);
          if (data.length === 0) {
            setFeedback("لم يتم العثور على نتائج مطابقة لمعايير البحث. جرب معايير مختلفة أو قم بإزالة بعض الفلاتر.");
          } else {
            setFeedback(`تم العثور على ${data.length} نتيجة`);
          }
        } else {
          setResults([]);
          setError("استجابة غير صحيحة من الخادم");
        }
        
      } catch (err) {
        console.error("Search error:", err);
        const errorMessage = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
        setError(`خطأ في البحث: ${errorMessage}`);
        setResults([]);
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
      // Only load favorites on initial load, don't auto-search
      void loadFavorites();
    }
  }, [token, router, loadFavorites]);

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
          className="rounded-3xl border border-accent-100 bg-white p-6 shadow-lg"
        >
          <div className="grid gap-4 md:grid-cols-2">
            {/* العمود الأيسر */}
            <div className="space-y-4">
              {/* العمر */}
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-2 text-sm text-slate-600">
                  العمر من
                  <input
                    type="number"
                    min={18}
                    max={80}
                    value={filters.minAge}
                    onChange={(event) => updateFilter("minAge", event.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                    placeholder="28"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-slate-600">
                  العمر الى
                  <input
                    type="number"
                    min={18}
                    max={80}
                    value={filters.maxAge}
                    onChange={(event) => updateFilter("maxAge", event.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                    placeholder="42"
                  />
                </label>
              </div>

              {/* المدينة */}
              <label className="flex flex-col gap-2 text-sm text-slate-600">
                المدينة
                <input
                  type="text"
                  value={filters.city}
                  onChange={(event) => updateFilter("city", event.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                  placeholder="الرياض، جدة، دبي..."
                />
              </label>

              {/* الطول */}
              <label className="flex flex-col gap-2 text-sm text-slate-600">
                الطول (سم)
                <input
                  type="number"
                  min={100}
                  max={250}
                  value={filters.height}
                  onChange={(event) => updateFilter("height", event.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                  placeholder="170"
                />
              </label>

              {/* بلد الإقامة */}
              <label className="flex flex-col gap-2 text-sm text-slate-600">
                بلد الإقامة
                <select
                  value={filters.countryOfResidence}
                  onChange={(event) => updateFilter("countryOfResidence", event.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                >
                  <option value="">كل الخيارات</option>
                  <option value="السعودية">السعودية</option>
                  <option value="الإمارات">الإمارات</option>
                  <option value="الكويت">الكويت</option>
                  <option value="قطر">قطر</option>
                  <option value="البحرين">البحرين</option>
                  <option value="عمان">عمان</option>
                  <option value="الأردن">الأردن</option>
                  <option value="لبنان">لبنان</option>
                  <option value="سوريا">سوريا</option>
                  <option value="مصر">مصر</option>
                  <option value="فلسطين المحتلة">فلسطين المحتلة</option>
                  <option value="العراق">العراق</option>
                  <option value="اليمن">اليمن</option>
                  <option value="السودان">السودان</option>
                  <option value="المغرب">المغرب</option>
                  <option value="تونس">تونس</option>
                  <option value="الجزائر">الجزائر</option>
                  <option value="ليبيا">ليبيا</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </label>

              {/* المستوى التعليمي */}
              <label className="flex flex-col gap-2 text-sm text-slate-600">
                المستوى التعليمي
                <select
                  value={filters.education}
                  onChange={(event) => updateFilter("education", event.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                >
                  <option value="">كل الخيارات</option>
                  <option value="غير متعلم">غير متعلم</option>
                  <option value="ابتدائي">ابتدائي</option>
                  <option value="متوسط">متوسط</option>
                  <option value="ثانوي">ثانوي</option>
                  <option value="دبلوم">دبلوم</option>
                  <option value="بكالوريوس">بكالوريوس</option>
                  <option value="ماجستير">ماجستير</option>
                  <option value="دكتوراه">دكتوراه</option>
                </select>
              </label>

              {/* إختبار التوافق */}
              <label className="flex flex-col gap-2 text-sm text-slate-600">
                إختبار التوافق
                <select
                  value={filters.compatibilityTest}
                  onChange={(event) => updateFilter("compatibilityTest", event.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                >
                  <option value="">كل الخيارات</option>
                  <option value="نعم">نعم</option>
                  <option value="لا">لا</option>
                </select>
              </label>

              {/* تقبل/تقبلين بالتعدد */}
              <label className="flex flex-col gap-2 text-sm text-slate-600">
                تقبل/تقبلين بالتعدد
                <select
                  value={filters.polygamyAcceptance}
                  onChange={(event) => updateFilter("polygamyAcceptance", event.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                >
                  <option value="">كل الخيارات</option>
                  <option value="اقبل بالتعدد">اقبل بالتعدد</option>
                  <option value="لا اقبل بالتعدد">لا اقبل بالتعدد</option>
                </select>
              </label>
            </div>

            {/* العمود الأيمن */}
            <div className="space-y-4">
              {/* الجنس */}
              <label className="flex flex-col gap-2 text-sm text-slate-600">
                أنا {filters.gender === "male" ? "رجل" : filters.gender === "female" ? "امرأة" : ""} أبحث عن
                <select
                  value={filters.gender}
                  onChange={(event) => updateFilter("gender", event.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                >
                  <option value="">اختر الجنس</option>
                  <option value="female">أنثى</option>
                  <option value="male">ذكر</option>
                </select>
              </label>

              {/* الجنسية */}
              <label className="flex flex-col gap-2 text-sm text-slate-600">
                الجنسية
                <select
                  value={filters.nationality}
                  onChange={(event) => updateFilter("nationality", event.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                >
                  <option value="">كل الخيارات</option>
                  <option value="السعودية">السعودية</option>
                  <option value="فلسطين المحتلة">فلسطين المحتلة</option>
                  <option value="الأردن">الأردن</option>
                  <option value="سوريا">سوريا</option>
                  <option value="لبنان">لبنان</option>
                  <option value="مصر">مصر</option>
                  <option value="العراق">العراق</option>
                  <option value="اليمن">اليمن</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </label>

              {/* الحالة الاجتماعية */}
              <label className="flex flex-col gap-2 text-sm text-slate-600">
                الحالة الاجتماعية
                <select
                  value={filters.maritalStatus}
                  onChange={(event) => updateFilter("maritalStatus", event.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                >
                  <option value="">كل الخيارات</option>
                  <option value="أعزب">أعزب</option>
                  <option value="مطلق - بدون أولاد">مطلق - بدون أولاد</option>
                  <option value="مطلق - مع أولاد">مطلق - مع أولاد</option>
                  <option value="منفصل بدون طلاق">منفصل بدون طلاق</option>
                  <option value="أرمل - بدون أولاد">أرمل - بدون أولاد</option>
                  <option value="أرمل - مع أولاد">أرمل - مع أولاد</option>
                </select>
              </label>

              {/* الديانة */}
              <label className="flex flex-col gap-2 text-sm text-slate-600">
                الديانة
                <select
                  value={filters.religion}
                  onChange={(event) => updateFilter("religion", event.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                >
                  <option value="">كل الخيارات</option>
                  <option value="الإسلام">الإسلام</option>
                  <option value="المسيحية">المسيحية</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </label>

              {/* نوع الزواج */}
              <label className="flex flex-col gap-2 text-sm text-slate-600">
                نوع الزواج
                <select
                  value={filters.marriageType}
                  onChange={(event) => updateFilter("marriageType", event.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                >
                  <option value="">كل الخيارات</option>
                  <option value="زواج تقليدي">زواج تقليدي</option>
                  <option value="زواج بشروط خاصة">زواج بشروط خاصة</option>
                </select>
              </label>

              {/* الأعضاء لديهم صور فقط */}
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={filters.hasPhoto === "true"}
                  onChange={(event) => updateFilter("hasPhoto", event.target.checked ? "true" : "")}
                  className="h-4 w-4 rounded border-slate-300 text-accent-600 focus:ring-accent-500"
                />
                <span>الأعضاء لديهم صور فقط</span>
              </label>
            </div>
          </div>

          {/* زر البحث */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-red-600 px-6 py-3 text-base font-medium text-white transition-all hover:bg-red-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "جارٍ البحث..." : "بحث في البيانات"}
            </button>
          </div>

          {/* البحث برقم العضو أو الإسم */}
          <div className="mt-6 border-t border-slate-200 pt-6">
            <h3 className="mb-4 text-sm font-medium text-secondary-700">
              البحث برقم العضو أو الإسم
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-slate-600">
                إسم العضو
                <input
                  value={filters.keyword}
                  onChange={(event) => updateFilter("keyword", event.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                  placeholder="أدخل اسم العضو"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-600">
                أو رقم العضو
                <input
                  value={filters.memberId}
                  onChange={(event) => updateFilter("memberId", event.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                  placeholder="مثال: MAW-000123"
                />
              </label>
            </div>
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
                        {result.profile.countryOfResidence && (
                          <p className="text-sm text-slate-500">
                            بلد الإقامة: {result.profile.countryOfResidence}
                          </p>
                        )}
                        <p className="text-sm text-slate-500">
                          المدينة: {result.profile.city ?? "غير محدد"}
                        </p>
                        <p className="text-sm text-slate-500">
                          الحالة الاجتماعية: {result.profile.maritalStatus ?? "غير محدد"}
                        </p>
                        {result.profile.marriageType && (
                          <p className="text-sm text-slate-500">
                            نوع الزواج: {result.profile.marriageType}
                          </p>
                        )}
                        {(result.profile.religion || result.profile.religiosityLevel) && (
                          <p className="text-sm text-slate-500">
                            الديانة: {result.profile.religion || result.profile.religiosityLevel || "غير محدد"}
                          </p>
                        )}
                        {result.profile.education && (
                          <p className="text-sm text-slate-500">
                            التعليم: {result.profile.education}
                          </p>
                        )}
                        {result.profile.height && (
                          <p className="text-sm text-slate-500">
                            الطول: {result.profile.height} سم
                          </p>
                        )}
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

