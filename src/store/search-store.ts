import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "@/store/auth-store";

const API_BASE =
  process.env.NEXT_PUBLIC_API ??
  "http://localhost:3000/api";

export type SearchFilters = {
  minAge?: string;
  maxAge?: string;
  city?: string;
  minHeight?: string;
  maxHeight?: string;
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
  page?: string;
  per_page?: string;
};

export type SearchResult = {
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

export type SearchResponse = {
  status: string;
  filters_received: Record<string, unknown>;
  data: SearchResult[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

type SearchState = {
  filters: SearchFilters;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  } | null;
};

type SearchActions = {
  setFilter: (key: keyof SearchFilters, value: string) => void;
  resetFilters: () => void;
  performSearch: (page?: number) => Promise<void>;
  setResults: (results: SearchResult[]) => void;
  setError: (error: string | null) => void;
};

const initialFilters: SearchFilters = {
  minAge: "",
  maxAge: "",
  city: "",
  minHeight: "",
  maxHeight: "",
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

export const useSearchStore = create<SearchState & SearchActions>()(
  persist(
    (set, get) => ({
      filters: initialFilters,
      results: [],
      loading: false,
      error: null,
      meta: null,

      setFilter(key, value) {
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        }));
      },

      resetFilters() {
        console.log(">>> FRONTEND: SEARCH STORE: resetFilters");
        set({ filters: initialFilters, results: [], error: null, meta: null });
      },

      setResults(results) {
        console.log(">>> FRONTEND: SEARCH STORE: setResults", results.length, "items");
        set({ results });
      },

      setError(error) {
        console.log(">>> FRONTEND: SEARCH STORE: setError", error);
        set({ error });
      },

      async performSearch(page = 1) {
        const { token } = useAuthStore.getState();
        const { filters } = get();

        console.log(">>> FRONTEND: SEARCH STORE: performSearch called");
        console.log(">>> FRONTEND: FILTERS:", filters);
        console.log(">>> FRONTEND: PAGE:", page);

        if (!token) {
          set({ error: "يجب تسجيل الدخول لإجراء البحث" });
          return;
        }

        const minAgeValue = filters.minAge ? parseInt(filters.minAge) : undefined;
        const maxAgeValue = filters.maxAge ? parseInt(filters.maxAge) : undefined;

        // Validate required fields
        if (!minAgeValue && !maxAgeValue) {
          set({ error: "يجب إدخال العمر (من أو إلى) للبحث (مطلوب)" });
          return;
        }

        // Validate age range
        if (
          minAgeValue !== undefined &&
          maxAgeValue !== undefined &&
          (isNaN(minAgeValue) ||
            isNaN(maxAgeValue) ||
            minAgeValue < 18 ||
            minAgeValue > 80 ||
            maxAgeValue < 18 ||
            maxAgeValue > 80 ||
            minAgeValue > maxAgeValue)
        ) {
          set({
            error:
              "نطاق العمر غير صحيح. يجب أن يكون بين 18 و 80 ولا يكون الأدنى أكبر من الأعلى.",
          });
          return;
        }

        set({ loading: true, error: null });

        try {
          // Build query parameters
          const params = new URLSearchParams();

          if (minAgeValue !== undefined && !isNaN(minAgeValue)) {
            params.append("minAge", String(minAgeValue));
          }
          if (maxAgeValue !== undefined && !isNaN(maxAgeValue)) {
            params.append("maxAge", String(maxAgeValue));
          }

          // Helper to add non-empty optional filters
          const pushIfValue = (key: keyof SearchFilters) => {
            const val = filters[key];
            if (
              val &&
              val.trim().length > 0 &&
              val.trim().toLowerCase() !== "all"
            ) {
              params.append(key, val.trim());
            }
          };

          pushIfValue("city");
          pushIfValue("nationality");
          pushIfValue("education");
          pushIfValue("occupation");
          pushIfValue("maritalStatus");
          pushIfValue("countryOfResidence");
          pushIfValue("religion");
          pushIfValue("religiosityLevel");
          pushIfValue("marriageType");
          pushIfValue("polygamyAcceptance");
          pushIfValue("compatibilityTest");
          pushIfValue("keyword");
          pushIfValue("memberId");

          if (filters.minHeight && filters.minHeight.trim().length > 0) {
            const h = parseInt(filters.minHeight);
            if (!isNaN(h) && h >= 100 && h <= 250) {
              params.append("minHeight", String(h));
            }
          }

          if (filters.maxHeight && filters.maxHeight.trim().length > 0) {
            const h = parseInt(filters.maxHeight);
            if (!isNaN(h) && h >= 100 && h <= 250) {
              params.append("maxHeight", String(h));
            }
          }

          if (filters.hasPhoto === "true") {
            params.append("hasPhoto", "true");
          }

          // Pagination
          params.append("page", String(page));
          params.append("per_page", String(filters.per_page || 20));

          const url = `${API_BASE}/search?${params.toString()}`;
          console.log("SEARCH REQUEST:", Object.fromEntries(params.entries()));
          console.log(">>> FRONTEND: SENDING REQUEST TO:", url);
          console.log(">>> FRONTEND: FILTERS:", Object.fromEntries(params.entries()));

          const response = await fetch(url, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          });

          console.log(">>> FRONTEND: RESPONSE STATUS:", response.status);
          console.log(">>> FRONTEND: RESPONSE HEADERS:", Object.fromEntries(response.headers.entries()));

          if (!response.ok) {
            const errorText = await response.text();
            console.error(">>> FRONTEND: ERROR RESPONSE:", errorText);
            let errorData: { message?: string | string[]; error?: string } = {};
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { message: errorText || "حدث خطأ في البحث" };
            }
            const errorMessage = Array.isArray(errorData.message)
              ? errorData.message.join(", ")
              : errorData.message || errorData.error || "حدث خطأ في البحث";
            throw new Error(errorMessage);
          }

          const responseText = await response.text();
          console.log(">>> FRONTEND: RAW RESPONSE TEXT:", responseText);
          
          let data: SearchResponse;
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            console.error(">>> FRONTEND: JSON PARSE ERROR:", parseError);
            throw new Error("فشل في تحليل استجابة الخادم");
          }
          
          console.log(">>> FRONTEND: PARSED RESPONSE:", data);
          console.log(">>> FRONTEND: RESPONSE STATUS:", data.status);
          console.log(">>> FRONTEND: DATA ARRAY:", data.data);
          console.log(">>> FRONTEND: IS ARRAY:", Array.isArray(data.data));
          console.log(">>> FRONTEND: RESULTS COUNT:", data.data?.length || 0);
          console.log(">>> FRONTEND: PAGINATION META:", data.meta);

          // Validate response structure
          if (!data) {
            console.error(">>> FRONTEND: NO DATA IN RESPONSE");
            set({
              results: [],
              meta: null,
              error: "استجابة فارغة من الخادم",
            });
            return;
          }

          console.log(">>> FRONTEND: RESPONSE VALIDATION:", {
            hasStatus: !!data.status,
            status: data.status,
            hasData: !!data.data,
            dataType: typeof data.data,
            isArray: Array.isArray(data.data),
            dataLength: Array.isArray(data.data) ? data.data.length : "N/A",
            hasMeta: !!data.meta,
          });

          if (data.status === "success" && Array.isArray(data.data)) {
            console.log(">>> FRONTEND: SETTING RESULTS:", data.data.length, "items");
            console.log(">>> FRONTEND: FIRST RESULT:", JSON.stringify(data.data[0], null, 2));
            
            // Ensure we have valid results - check structure carefully
            // Log the raw data structure first
            console.log(">>> FRONTEND: RAW DATA STRUCTURE:", {
              dataLength: data.data.length,
              firstItemKeys: data.data[0] ? Object.keys(data.data[0]) : [],
              firstItem: data.data[0],
            });
            
            const validResults = data.data.filter((item: any, index: number) => {
              // Check if item exists and has required structure
              if (!item) {
                console.warn(`>>> FRONTEND: Result ${index} is null/undefined`);
                return false;
              }
              
              // Check for user and profile - they must exist
              const hasUser = !!item.user;
              const hasProfile = !!item.profile;
              
              if (!hasUser || !hasProfile) {
                console.warn(`>>> FRONTEND: Filtering out invalid result at index ${index}:`, {
                  hasItem: !!item,
                  hasUser: hasUser,
                  hasProfile: hasProfile,
                  itemKeys: Object.keys(item),
                  userKeys: item.user ? Object.keys(item.user) : [],
                  profileKeys: item.profile ? Object.keys(item.profile) : [],
                  fullItem: JSON.stringify(item, null, 2),
                });
                return false;
              }
              
              return true;
            });
            
            console.log(">>> FRONTEND: VALID RESULTS COUNT:", validResults.length);
            console.log(">>> FRONTEND: FILTERED OUT:", data.data.length - validResults.length, "invalid results");
            
            // If we filtered out results, log a warning
            if (validResults.length < data.data.length) {
              console.error(">>> FRONTEND: WARNING - Some results were filtered out!", {
                originalCount: data.data.length,
                validCount: validResults.length,
                filteredCount: data.data.length - validResults.length,
              });
            }
            
            // Use set() to update state - this triggers React re-renders automatically
            set({
              results: validResults,
              meta: data.meta ? {
                ...data.meta,
              } : {
                current_page: page,
                last_page: 1,
                per_page: filters.per_page ? parseInt(filters.per_page) : 20,
                total: validResults.length,
              },
              error: validResults.length === 0 && data.data.length > 0 
                ? "تم العثور على نتائج لكنها غير صالحة. يرجى التحقق من البيانات." 
                : null,
            });
            
              console.log(">>> FRONTEND: STATE UPDATED via set():", {
                resultsCount: validResults.length,
                originalDataCount: data.data.length,
                originalMetaTotal: data.meta?.total,
                finalMetaTotal: data.meta?.total ?? validResults.length,
              });
          } else {
            console.error(">>> FRONTEND: INVALID RESPONSE STRUCTURE:", {
              hasData: !!data,
              status: data?.status,
              isArray: Array.isArray(data?.data),
              dataType: typeof data?.data,
              actualData: data?.data,
            });
            set({
              results: [],
              meta: null,
              error: `استجابة غير صحيحة من الخادم. الحالة: ${data?.status || "غير معروف"}`,
            });
          }
        } catch (err) {
          console.error(">>> FRONTEND: SEARCH STORE performSearch error:", err);
          let errorMessage = "حدث خطأ في البحث، حاول مرة أخرى.";

          if (err instanceof Error) {
            const errorMsg = err.message.toLowerCase();
            if (
              errorMsg.includes("gender") ||
              errorMsg.includes("profile") ||
              errorMsg.includes("complete") ||
              errorMsg.includes("missing")
            ) {
              errorMessage =
                "يجب إكمال ملفك الشخصي أولاً. يرجى زيارة صفحة الملف الشخصي وإضافة جميع المعلومات المطلوبة (خاصة الجنس).";
            } else {
              errorMessage = err.message;
            }
          }

          set({
            results: [],
            meta: null,
            error: errorMessage,
          });
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "mawaddah-search",
      partialize: (state) => ({
        // Only persist filters, not results (results should be fresh on each search)
        filters: state.filters,
        // Don't persist results and meta to avoid stale data
      }),
    },
  ),
);
