"use client";

import { FormEvent, useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { addFavorite, fetchWithToken, getFavorites } from "@/lib/api";
import { getStoredAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

import countriesData from "@/data/countries.json";
import citiesData from "@/data/cities.json";
import educationLevelsData from "@/data/education.json";
import maritalStatusData from "@/data/marital-status.json";
import marriageTypesData from "@/data/marriage-type.json";
import religiosityLevelsData from "@/data/religiosity-level.json";
import polygamyOptionsData from "@/data/polygamy.json";

type SearchFilters = {
  gender?: string;
  minAge?: string;
  maxAge?: string;
  city?: string;
  height?: string;
  countryOfResidence?: string;
  nationality?: string;
  education?: string;
  occupation?: string;
  maritalStatus?: string;
  religion?: string;
  religiosityLevel?: string;
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
    age?: number;
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
  occupation: "",
  maritalStatus: "",
  religion: "",
  religiosityLevel: "",
  marriageType: "",
  polygamyAcceptance: "",
  compatibilityTest: "",
  hasPhoto: "",
  keyword: "",
  memberId: "",
};

export default function SearchPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
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
      
      // Validate MANDATORY fields (gender and age are required)
      if (!activeFilters.gender || activeFilters.gender.trim().length === 0) {
        setError("يجب اختيار الجنس للبحث (مطلوب)");
        setLoading(false);
        setFeedback(null);
        return;
      }

      const minAgeValue = activeFilters.minAge ? parseInt(activeFilters.minAge) : undefined;
      const maxAgeValue = activeFilters.maxAge ? parseInt(activeFilters.maxAge) : undefined;

      // At least one age value (minAge or maxAge) is required
      if (!minAgeValue && !maxAgeValue) {
        setError("يجب إدخال العمر (من أو إلى) للبحث (مطلوب)");
        setLoading(false);
        setFeedback(null);
        return;
      }

      // Validate age range if both are provided
      if (minAgeValue !== undefined && maxAgeValue !== undefined) {
        if (isNaN(minAgeValue) || isNaN(maxAgeValue)) {
          setError("يجب إدخال أرقام صحيحة للعمر");
          setLoading(false);
          return;
        }
        if (minAgeValue < 18 || minAgeValue > 80 || maxAgeValue < 18 || maxAgeValue > 80) {
          setError("يجب أن يكون العمر بين 18 و 80 سنة");
          setLoading(false);
          return;
        }
        if (minAgeValue > maxAgeValue) {
          setError("العمر الأدنى لا يمكن أن يكون أكبر من العمر الأقصى");
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);
      setFeedback(null);
      
      try {
        console.log('\n========== FRONTEND SEARCH START ==========');
        console.log('Active filters before processing:', activeFilters);
        
        // Build payload object - only include defined values
        const payload: Record<string, string | number> = {};
        
        // Add required fields (MANDATORY)
        // Gender: backend will normalize Arabic/corrupted values
        if (activeFilters.gender) {
          // Trim whitespace - backend handles normalization of Arabic values
          payload.gender = activeFilters.gender.trim();
        }
        
        if (minAgeValue !== undefined && !isNaN(minAgeValue)) {
          payload.minAge = minAgeValue;
        }
        
        if (maxAgeValue !== undefined && !isNaN(maxAgeValue)) {
          payload.maxAge = maxAgeValue;
        }
        
        // Add optional fields only if they have valid values
        if (activeFilters.city && activeFilters.city.trim().length > 0 && activeFilters.city.trim().toLowerCase() !== 'all') {
          payload.city = activeFilters.city.trim();
        }
        
        if (activeFilters.nationality && activeFilters.nationality.trim().length > 0 && activeFilters.nationality.trim().toLowerCase() !== 'all') {
          payload.nationality = activeFilters.nationality.trim();
        }
        
        if (activeFilters.education && activeFilters.education.trim().length > 0 && activeFilters.education.trim().toLowerCase() !== 'all') {
          payload.education = activeFilters.education.trim();
        }

        if (activeFilters.occupation && activeFilters.occupation.trim().length > 0 && activeFilters.occupation.trim().toLowerCase() !== 'all') {
          payload.occupation = activeFilters.occupation.trim();
        }
        
        if (activeFilters.maritalStatus && activeFilters.maritalStatus.trim().length > 0 && activeFilters.maritalStatus.trim().toLowerCase() !== 'all') {
          payload.maritalStatus = activeFilters.maritalStatus.trim();
        }
        
        if (activeFilters.countryOfResidence && activeFilters.countryOfResidence.trim().length > 0 && activeFilters.countryOfResidence.trim().toLowerCase() !== 'all') {
          payload.countryOfResidence = activeFilters.countryOfResidence.trim();
        }
        
        if (activeFilters.height && activeFilters.height.trim().length > 0) {
          const heightValue = parseInt(activeFilters.height);
          if (!isNaN(heightValue) && heightValue >= 100 && heightValue <= 250) {
            payload.height = heightValue;
          }
        }
        
        if (activeFilters.religion && activeFilters.religion.trim().length > 0 && activeFilters.religion.trim().toLowerCase() !== 'all') {
          payload.religion = activeFilters.religion.trim();
        }

        if (activeFilters.religiosityLevel && activeFilters.religiosityLevel.trim().length > 0 && activeFilters.religiosityLevel.trim().toLowerCase() !== 'all') {
          payload.religiosityLevel = activeFilters.religiosityLevel.trim();
        }

        if (activeFilters.marriageType && activeFilters.marriageType.trim().length > 0 && activeFilters.marriageType.trim().toLowerCase() !== 'all') {
          payload.marriageType = activeFilters.marriageType.trim();
        }

        if (activeFilters.polygamyAcceptance && activeFilters.polygamyAcceptance.trim().length > 0 && activeFilters.polygamyAcceptance.trim().toLowerCase() !== 'all') {
          payload.polygamyAcceptance = activeFilters.polygamyAcceptance.trim();
        }

        if (activeFilters.compatibilityTest && activeFilters.compatibilityTest.trim().length > 0 && activeFilters.compatibilityTest.trim().toLowerCase() !== 'all') {
          payload.compatibilityTest = activeFilters.compatibilityTest.trim();
        }

        if (activeFilters.hasPhoto === 'true') {
          payload.hasPhoto = 'true';
        }
        
        if (activeFilters.keyword && activeFilters.keyword.trim().length > 0) {
          payload.keyword = activeFilters.keyword.trim();
        }
        
        if (activeFilters.memberId && activeFilters.memberId.trim().length > 0) {
          payload.memberId = activeFilters.memberId.trim();
        }
        
        // Build query string from payload
        const queryParams = new URLSearchParams();
        Object.entries(payload).forEach(([key, value]) => {
          queryParams.append(key, String(value));
        });
        
        const queryString = queryParams.toString();
        const endpoint = `/search?${queryString}`;
        
        // ==================== DEBUG LOGGING ====================
        console.log('SEARCH PAYLOAD:', JSON.stringify(payload, null, 2));
        console.log('Search endpoint:', endpoint);
        console.log('Query string:', queryString);
        console.log('Query params object:', Object.fromEntries(queryParams.entries()));
        // ==================== END DEBUG ====================
        
        const data = await fetchWithToken<SearchResult[]>(endpoint, token);
        console.log('Search response:', data);
        console.log('Response type:', Array.isArray(data) ? 'array' : typeof data);
        console.log('Response length:', Array.isArray(data) ? data.length : 'N/A');
        console.log('========== FRONTEND SEARCH END ==========\n');
        
        if (Array.isArray(data)) {
          setResults(data);
          setError(null); // Clear any previous errors
          
          if (data.length === 0) {
            setFeedback("لم يتم العثور على نتائج مطابقة لمعايير البحث. جرب معايير مختلفة أو قم بإزالة بعض الفلاتر الاختيارية.");
          } else {
            setFeedback(`✅ تم العثور على ${data.length} ${data.length === 1 ? 'نتيجة' : 'نتائج'}`);
          }
        } else {
          setResults([]);
          setError("استجابة غير صحيحة من الخادم. يرجى المحاولة مرة أخرى.");
          setFeedback(null);
        }
        
      } catch (err) {
        console.error("Search error:", err);
        
        // Handle API errors with better error messages
        // Backend throws BadRequestException with messages like:
        // - "Gender is required for search"
        // - "Age range (minAge or maxAge) is required for search"
        // - "Minimum age cannot be greater than maximum age"
        // - "Invalid gender value: ..."
        let errorMessage = "حدث خطأ غير متوقع";
        
        if (err instanceof Error) {
          const message = err.message;
          errorMessage = message;
          
          // Map backend error messages to user-friendly Arabic messages
          if (message.includes("Gender is required") || message.includes("الجنس مطلوب")) {
            errorMessage = "يجب اختيار الجنس للبحث (مطلوب)";
          } else if (message.includes("Age range") || message.includes("العمر مطلوب")) {
            errorMessage = "يجب إدخال العمر (من أو إلى) للبحث (مطلوب)";
          } else if (message.includes("Minimum age cannot be greater") || message.includes("العمر الأدنى")) {
            errorMessage = "العمر الأدنى لا يمكن أن يكون أكبر من العمر الأقصى";
          } else if (message.includes("Invalid gender value")) {
            errorMessage = "قيمة الجنس غير صحيحة. يجب أن تكون \"male\" أو \"female\" أو \"ذكر\" أو \"أنثى\"";
          }
        }
        
        setError(`خطأ في البحث: ${errorMessage}`);
        setResults([]);
        setFeedback(null);
      } finally {
        setLoading(false);
      }
    },
    [filters, token],
  );

  // Load token from localStorage on mount (client-side only)
  useEffect(() => {
    const storedAuth = getStoredAuth();
    const authToken = storedAuth?.token ?? null;
    setToken(authToken);
    
    if (!authToken) {
      router.push("/auth/login");
    }
  }, [router]);

  // Load favorites when token is available
  useEffect(() => {
    if (token) {
      void loadFavorites();
    }
  }, [token, loadFavorites]);

  // Helper function to check if required fields are filled
  const isSearchButtonEnabled = (): boolean => {
    const hasGender = Boolean(filters.gender && filters.gender.trim().length > 0);
    const minAgeValue = filters.minAge ? parseInt(filters.minAge) : undefined;
    const maxAgeValue = filters.maxAge ? parseInt(filters.maxAge) : undefined;
    const hasAge = (minAgeValue !== undefined && !isNaN(minAgeValue)) || 
                   (maxAgeValue !== undefined && !isNaN(maxAgeValue));
    
    return hasGender && hasAge && !loading;
  };

  const updateFilter = (name: keyof SearchFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setError(null);
    setFeedback(null);
    setResults([]);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Validate MANDATORY fields before submitting
    if (!filters.gender || filters.gender.trim().length === 0) {
      setError("يجب اختيار الجنس للبحث (مطلوب)");
      setFeedback(null);
      return;
    }

    const minAgeValue = filters.minAge ? parseInt(filters.minAge) : undefined;
    const maxAgeValue = filters.maxAge ? parseInt(filters.maxAge) : undefined;

    // At least one age value (minAge or maxAge) is required
    if (!minAgeValue && !maxAgeValue) {
      setError("يجب إدخال العمر (من أو إلى) للبحث (مطلوب)");
      setFeedback(null);
      return;
    }

    // Validate age range if both are provided
    if (minAgeValue !== undefined && maxAgeValue !== undefined) {
      if (isNaN(minAgeValue) || isNaN(maxAgeValue)) {
        setError("يجب إدخال أرقام صحيحة للعمر");
        setFeedback(null);
        return;
      }
      if (minAgeValue < 18 || minAgeValue > 80 || maxAgeValue < 18 || maxAgeValue > 80) {
        setError("يجب أن يكون العمر بين 18 و 80 سنة");
        setFeedback(null);
        return;
      }
      if (minAgeValue > maxAgeValue) {
        setError("العمر الأدنى لا يمكن أن يكون أكبر من العمر الأقصى");
        setFeedback(null);
        return;
      }
    }

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

  if (!token) {
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
              className="rounded-full bg-accent-600 px 6 py-3 text-sm font-medium text-white hover:bg-accent-700 transition"
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
            {!isSearchButtonEnabled() && !loading && (
              <p className="mb-2 text-sm text-amber-600 text-center">
                ⚠️ يجب اختيار الجنس وإدخال العمر للبحث (حقول مطلوبة)
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

