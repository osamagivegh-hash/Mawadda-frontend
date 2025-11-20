"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useSearchStore, type SearchFilters } from "@/store/search-store";
import { useFavoritesStore } from "@/store/favorites-store";
import { useProfileStore } from "@/store/profile-store";
import {
  EDUCATION_LEVELS,
  OCCUPATIONS,
  RELIGIOSITY_LEVELS,
  MARRIAGE_TYPES,
  POLYGAMY_OPTIONS,
  COMPATIBILITY_OPTIONS,
  getMaritalStatusesForSearch,
} from "@/lib/profile-constants";

import countriesData from "@/data/countries.json";
import citiesData from "@/data/cities.json";

export default function SearchPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuthStore();
  const {
    filters,
    results,
    loading,
    error,
    meta,
    setFilter,
    resetFilters,
    performSearch,
  } = useSearchStore();
  const { profile, loadProfile, loading: profileLoading } = useProfileStore();
  const [currentPage, setCurrentPage] = useState(1);
  const {
    favorites,
    loadFavorites,
    toggleFavorite,
    isFavorite,
  } = useFavoritesStore();
  const [feedback, setFeedback] = useState<string | null>(null);
  
  // Track previous loading state to detect when search completes
  // MUST be declared before any conditional returns to maintain hooks order
  const prevLoadingRef = useRef<boolean>(false);

  // Load favorites and profile when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      void loadFavorites();
      // Force reload profile to ensure we have latest data from backend
      void loadProfile().catch((err) => {
        console.error("Failed to load profile:", err);
      });
    }
  }, [isAuthenticated, loadFavorites, loadProfile]);

  // Log profile state for debugging
  useEffect(() => {
    console.log(">>> SEARCH PAGE: Profile state:", {
      hasProfile: !!profile,
      profileId: profile?.id,
      gender: profile?.gender,
      profileLoading: profileLoading,
      isAuthenticated,
    });
  }, [profile, profileLoading, isAuthenticated]);

  // Clear invalid marital status when profile loads
  useEffect(() => {
    if (profile?.gender && filters.maritalStatus) {
      const validStatuses = getMaritalStatusesForSearch(profile.gender);
      
      // If current selection is not in valid list, clear it
      if (!validStatuses.includes(filters.maritalStatus)) {
        console.log(`Clearing invalid marital status "${filters.maritalStatus}" for ${profile.gender} user`);
        setFilter('maritalStatus', '');
      }
    }
  }, [profile?.gender, filters.maritalStatus, setFilter]);

  // Debug: Log results changes
  useEffect(() => {
    console.log(">>> FRONTEND: SEARCH PAGE: Results changed:", {
      resultsCount: results.length,
      results: results,
      meta: meta,
      loading: loading,
      error: error,
    });
  }, [results, meta, loading, error]);

  // Reactively update feedback when search completes
  // MUST be before conditional returns to maintain hooks order
  useEffect(() => {
    // Detect when loading changes from true to false (search just completed)
    if (prevLoadingRef.current === true && loading === false) {
      // Search has just completed - use reactive values from hook
      const totalResults = meta?.total ?? results.length;

      if (error) {
        setFeedback(`❌ خطأ: ${error}`);
      } else if (totalResults > 0) {
        setFeedback(`✅ تم العثور على ${totalResults} ${totalResults === 1 ? 'نتيجة' : 'نتائج'}`);
      } else {
        setFeedback("⚠️ لم يتم العثور على نتائج مطابقة لمعايير البحث. جرب معايير مختلفة أو قم بإزالة بعض الفلاتر الاختيارية.");
      }
    }
    prevLoadingRef.current = loading;
  }, [loading, error, results, meta]);

  // Structured data options
  const COUNTRY_OPTIONS = useMemo(
    () => countriesData as { code: string; name: string }[],
    [],
  );
  const CITY_OPTIONS = useMemo(
    () => citiesData as { countryCode: string; name: string }[],
    [],
  );
  // Use unified constants for all options
  const EDUCATION_OPTIONS = useMemo(() => EDUCATION_LEVELS, []);
  const OCCUPATION_OPTIONS = useMemo(() => OCCUPATIONS, []);
  
  // Gender-filtered marital status options using unified constants
  const MARITAL_STATUS_OPTIONS = useMemo(() => {
    return getMaritalStatusesForSearch(profile?.gender);
  }, [profile?.gender]);
  
  const MARRIAGE_TYPE_OPTIONS = useMemo(() => MARRIAGE_TYPES, []);
  const RELIGIOSITY_OPTIONS = useMemo(() => RELIGIOSITY_LEVELS, []);
  const POLYGAMY_OPTIONS_MEMO = useMemo(() => POLYGAMY_OPTIONS, []);
  const COMPATIBILITY_OPTIONS_MEMO = useMemo(() => COMPATIBILITY_OPTIONS, []);

  const availableCities = useMemo(() => {
    if (!filters.countryOfResidence) {
      return CITY_OPTIONS;
    }
    const country = COUNTRY_OPTIONS.find(
      (c) => c.name === filters.countryOfResidence,
    );
    if (!country) return CITY_OPTIONS;
    return CITY_OPTIONS.filter((c) => c.countryCode === country.code);
  }, [CITY_OPTIONS, COUNTRY_OPTIONS, filters.countryOfResidence]);

  // Show loading screen while auth is hydrating or profile is loading
  if (authLoading || (isAuthenticated && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent-50 via-white to-primary-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-slate-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Check if profile exists and has gender before allowing search
  // Only show this if profile has finished loading (not loading state)
  if (isAuthenticated && !profileLoading && (!profile || !profile.gender)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent-50 via-white to-primary-50 px-4">
        <div className="max-w-md w-full rounded-3xl border border-slate-100 bg-white p-8 shadow-lg text-center">
          <h1 className="text-2xl font-bold text-secondary-900 mb-4">
            يجب إكمال ملفك الشخصي أولاً
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            {!profile
              ? "لم يتم العثور على ملفك الشخصي في قاعدة البيانات. يرجى إنشاء ملفك الشخصي أولاً وحفظه."
              : !profile.gender
              ? "يجب إضافة الجنس في ملفك الشخصي قبل استخدام البحث. يرجى الذهاب إلى صفحة الملف الشخصي وإضافة الجنس ثم حفظ الملف."
              : "يجب إكمال ملفك الشخصي قبل استخدام البحث."}
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/profile"
              className="rounded-full bg-accent-600 px-6 py-3 text-sm font-medium text-white hover:bg-accent-700 transition"
            >
              اذهب إلى صفحة الملف الشخصي
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-secondary-600 hover:text-secondary-500"
            >
              العودة إلى لوحة التحكم
            </Link>
          </div>
          {/* Debug info */}
          <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-left">
            <p className="font-semibold mb-1">معلومات التصحيح:</p>
            <p>الملف الشخصي موجود: {profile ? "نعم" : "لا"}</p>
            <p>الجنس موجود: {profile?.gender ? "نعم (" + profile.gender + ")" : "لا"}</p>
            <p>معرف الملف: {profile?.id || "غير موجود"}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show login required if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent-50 via-white to-primary-50 px-4">
        <div className="max-w-md w-full rounded-3xl border border-slate-100 bg-white p-8 shadow-lg text-center">
          <h1 className="text-2xl font-bold text-secondary-900 mb-4">
            تحتاج إلى تسجيل الدخول لاستخدام البحث
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            يرجى تسجيل الدخول للوصول إلى صفحة البحث عن الشريك والاستفادة من جميع المزايا.
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

  // Helper function to check if required fields are filled
  // Gender is now automatically determined from user profile, so we only check age
  const isSearchButtonEnabled = (): boolean => {
    // Ensure profile and gender exist
    if (!profile || !profile.gender) {
      return false;
    }
    
    const minAgeValue = filters.minAge ? parseInt(filters.minAge) : undefined;
    const maxAgeValue = filters.maxAge ? parseInt(filters.maxAge) : undefined;
    const hasAge = (minAgeValue !== undefined && !isNaN(minAgeValue)) || 
                   (maxAgeValue !== undefined && !isNaN(maxAgeValue));
    
    return hasAge && !loading && !profileLoading;
  };

  const updateFilter = (name: keyof SearchFilters, value: string) => {
    setFilter(name, value);
  };

  const clearFilters = () => {
    resetFilters();
    setFeedback(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setCurrentPage(1);
    
    console.log(">>> FRONTEND: SEARCH PAGE: Form submitted");
    console.log(">>> FRONTEND: FILTERS:", filters);
    console.log(">>> FRONTEND: CURRENT STATE BEFORE SEARCH:", {
      resultsCount: results.length,
      loading: loading,
      error: error,
    });
    
    // performSearch will update the store via set(), which triggers React re-render
    // The useEffect above will handle updating feedback reactively when loading becomes false
    await performSearch(1);
  };

  const handlePageChange = async (page: number) => {
    console.log(">>> FRONTEND: SEARCH PAGE: Page change to", page);
    setCurrentPage(page);
    await performSearch(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
                <select
                  value={filters.city}
                  onChange={(event) => updateFilter("city", event.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                >
                  <option value="">كل الخيارات</option>
                  {availableCities.map((city) => (
                    <option key={`${city.countryCode}-${city.name}`} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </label>

              {/* الطول */}
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-2 text-sm text-slate-600">
                  الطول من (سم)
                  <input
                    type="number"
                    min={100}
                    max={250}
                    value={filters.minHeight}
                    onChange={(event) => updateFilter("minHeight", event.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                    placeholder="160"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-slate-600">
                  الطول الى (سم)
                  <input
                    type="number"
                    min={100}
                    max={250}
                    value={filters.maxHeight}
                    onChange={(event) => updateFilter("maxHeight", event.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                    placeholder="190"
                  />
                </label>
              </div>

              {/* بلد الإقامة */}
              <label className="flex flex-col gap-2 text-sm text-slate-600">
                بلد الإقامة
                <select
                  value={filters.countryOfResidence}
                  onChange={(event) => updateFilter("countryOfResidence", event.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                >
                  <option value="">كل الخيارات</option>
                  {COUNTRY_OPTIONS.map((country) => (
                    <option key={country.code} value={country.name}>
                      {country.name}
                    </option>
                  ))}
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
                  {EDUCATION_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
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
                  {COMPATIBILITY_OPTIONS_MEMO.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
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
                  {POLYGAMY_OPTIONS_MEMO.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* العمود الأيمن */}
            <div className="space-y-4">
              {/* Gender is automatically determined from logged-in user's profile */}
              {/* Male users search for females, female users search for males */}
              
              {/* الجنسية */}
              <label className="flex flex-col gap-2 text-sm text-slate-600">
                الجنسية
                <select
                  value={filters.nationality}
                  onChange={(event) => updateFilter("nationality", event.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                >
                  <option value="">كل الخيارات</option>
                  {COUNTRY_OPTIONS.map((country) => (
                    <option key={country.code} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </label>

              {/* الحالة الاجتماعية */}
              <label className="flex flex-col gap-2 text-sm text-slate-600">
                الحالة الاجتماعية
                <select
                  value={filters.maritalStatus}
                  onChange={(event) => updateFilter("maritalStatus", event.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                  disabled={MARITAL_STATUS_OPTIONS.length === 0}
                >
                  <option value="">
                    {MARITAL_STATUS_OPTIONS.length === 0 
                      ? "جاري تحميل الخيارات..." 
                      : "كل الخيارات"}
                  </option>
                  {MARITAL_STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
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

              {/* درجة الالتزام */}
              <label className="flex flex-col gap-2 text-sm text-slate-600">
                درجة الالتزام
                <select
                  value={filters.religiosityLevel}
                  onChange={(event) => updateFilter("religiosityLevel", event.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                >
                  <option value="">كل الخيارات</option>
                  {RELIGIOSITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
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
                  {MARRIAGE_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
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
            {!isSearchButtonEnabled() && !loading && (
              <p className="mb-2 text-sm text-amber-600 text-center">
                ⚠️ يجب إدخال العمر للبحث (حقل مطلوب)
              </p>
            )}
            <button
              type="submit"
              disabled={!isSearchButtonEnabled()}
              className="w-full rounded-lg bg-red-600 px-6 py-3 text-base font-medium text-white transition-all hover:bg-red-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-400"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  جارٍ البحث...
                </span>
              ) : (
                "بحث في البيانات"
              )}
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
          <div className="rounded-3xl bg-rose-50 px-6 py-4 text-sm text-rose-600">
            <p className="mb-3">{error}</p>
            {(error.includes("ملفك الشخصي") || error.includes("الجنس") || error.includes("profile") || error.includes("gender")) && (
              <Link
                href="/profile"
                className="inline-block rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 mt-2"
              >
                اذهب إلى صفحة الملف الشخصي لإكمال البيانات
              </Link>
            )}
          </div>
        ) : null}

        {/* Debug Panel - Remove this after fixing */}
        <div className="rounded-3xl border-2 border-blue-300 bg-blue-50 p-4 text-xs font-mono">
          <div className="mb-2 font-bold text-blue-900">🔍 DEBUG INFO:</div>
          <div className="space-y-1 text-blue-800">
            <div>Loading: {loading ? "✅ Yes" : "❌ No"}</div>
            <div>Profile Loading: {profileLoading ? "✅ Yes" : "❌ No"}</div>
            <div>Has Profile: {profile ? "✅ Yes" : "❌ No"}</div>
            <div>Profile Gender: {profile?.gender || "❌ Missing"}</div>
            <div>Profile ID: {profile?.id || "❌ Missing"}</div>
            <div>Error: {error || "None"}</div>
            <div>Results Count: {results.length}</div>
            <div>Meta Total: {meta?.total ?? "N/A"}</div>
            <div>Current Page: {meta?.current_page ?? "N/A"}</div>
            <div>Last Page: {meta?.last_page ?? "N/A"}</div>
            {results.length > 0 && (
              <div className="mt-2">
                <div className="font-bold">First Result:</div>
                <pre className="mt-1 overflow-auto text-[10px]">
                  {JSON.stringify(results[0], null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-secondary-800">
              🔍 نتائج البحث ({meta?.total || results.length})
            </h2>
            {results.length > 0 && (
              <span className="rounded-full bg-accent-100 px-3 py-1 text-xs font-medium text-accent-700">
                {meta?.total || results.length} عضو
              </span>
            )}
            {meta && (
              <span className="text-sm text-slate-500">
                (صفحة {meta.current_page} من {meta.last_page})
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
                const isUserFavorite = isFavorite(result.user.id);
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
                        {result.profile.age && (
                          <p className="text-sm text-slate-500">
                            العمر: <span className="font-medium">{result.profile.age} سنة</span>
                          </p>
                        )}
                        {result.profile.gender && (
                          <p className="text-sm text-slate-500">
                            الجنس: <span className="font-medium">{result.profile.gender === 'female' ? 'أنثى' : result.profile.gender === 'male' ? 'ذكر' : result.profile.gender}</span>
                          </p>
                        )}
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
                        onClick={() => toggleFavorite(result.user.id)}
                        disabled={false}
                        className="rounded-full border border-accent-200 px-4 py-2 text-xs font-medium text-accent-600 transition-colors hover:bg-accent-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isUserFavorite ? "⭐ ضمن المفضلة" : "🤍 إضافة إلى المفضلة"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              
              {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                .filter(page => {
                  // Show first page, last page, current page, and pages around current
                  return (
                    page === 1 ||
                    page === meta.last_page ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                  );
                })
                .map((page, index, array) => {
                  // Add ellipsis if there's a gap
                  const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                  
                  return (
                    <div key={page} className="flex items-center gap-2">
                      {showEllipsisBefore && (
                        <span className="px-2 text-slate-500">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        disabled={loading}
                        className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                          currentPage === page
                            ? "border-accent-600 bg-accent-600 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {page}
                      </button>
                    </div>
                  );
                })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === meta.last_page || loading}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}