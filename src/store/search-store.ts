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
    id: number;
    email: string;
    role: string;
    status: string;
    memberId: string;
  };
  profile: {
    id: number;
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

          const data: SearchResponse = await response.json();
          console.log("API RESPONSE:", data);
          console.log(">>> FRONTEND: RESPONSE DATA:", data);
          console.log(">>> FRONTEND: RESULTS COUNT:", data.data?.length || 0);
          console.log(">>> FRONTEND: PAGINATION META:", data.meta);

          if (data && Array.isArray(data.data)) {
            set({
              results: data.data,
              meta: data.meta,
              error: null,
            });
          } else {
            set({
              results: [],
              meta: null,
              error: "استجابة غير صحيحة من الخادم. يرجى المحاولة مرة أخرى.",
            });
          }
        } catch (err) {
          console.error(">>> FRONTEND: SEARCH STORE performSearch error:", err);
          let errorMessage = "حدث خطأ في البحث، حاول مرة أخرى.";

          if (err instanceof Error) {
            if (
              err.message.includes("gender is missing") ||
              err.message.includes("add your gender") ||
              err.message.includes("complete your profile")
            ) {
              errorMessage =
                "يجب إكمال ملفك الشخصي أولاً. يرجى إضافة الجنس في صفحة الملف الشخصي.";
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
        filters: state.filters,
        results: state.results,
        meta: state.meta,
      }),
    },
  ),
);
