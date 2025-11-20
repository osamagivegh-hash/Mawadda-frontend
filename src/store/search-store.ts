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

          let rawResults: any[] = [];
          if (Array.isArray(data.data)) {
            rawResults = data.data;
          } else if (Array.isArray((data.data as any)?.data)) {
            rawResults = (data.data as any).data;
          } else if (Array.isArray((data.data as any)?.users)) {
            rawResults = (data.data as any).users;
          } else if (Array.isArray((data as any).results)) {
            rawResults = (data as any).results;
          }

          // Some backend responses include the array in a nested property (e.g. data.results
          // or data.data.results). To avoid showing "no results" when meta.total is present,
          // scan for the first nested array of objects and use it as the raw results.
          if (rawResults.length === 0) {
            const findFirstArray = (obj: unknown): any[] | null => {
              if (!obj || typeof obj !== "object") return null;

              for (const value of Object.values(obj as Record<string, unknown>)) {
                if (Array.isArray(value)) {
                  return value as any[];
                }

                if (value && typeof value === "object") {
                  const nested = findFirstArray(value);
                  if (nested) return nested;
                }
              }

              return null;
            };

            const fallbackArray = findFirstArray(data.data ?? data);
            if (fallbackArray) {
              console.log(">>> FRONTEND: FALLBACK ARRAY FOUND - USING NESTED RESULTS", fallbackArray.length);
              rawResults = fallbackArray;
            } else {
              console.warn(">>> FRONTEND: NO ARRAY RESULTS FOUND IN RESPONSE");
            }
          }

          // Some backend responses return a single object (e.g., when one match is found)
          // instead of wrapping it in an array. If meta.total indicates there is one
          // result but no array was found, treat the object as a single-item array so
          // the frontend can render the member details.
          if (
            rawResults.length === 0 &&
            data?.meta?.total === 1 &&
            data?.data &&
            typeof data.data === "object" &&
            !Array.isArray(data.data)
          ) {
            console.log(">>> FRONTEND: SINGLE OBJECT RESULT DETECTED - NORMALIZING TO ARRAY");
            rawResults = [data.data];
          }

          const paginationMeta = data.meta ?? (data.data as any)?.meta ?? null;

          if (data.status === "success") {
            console.log(">>> FRONTEND: SETTING RESULTS:", rawResults.length, "items");
            if (rawResults.length > 0) {
              console.log(">>> FRONTEND: FIRST RESULT:", JSON.stringify(rawResults[0], null, 2));
            }

            // Normalize results instead of filtering them out entirely to avoid
            // "results = 0" when the backend reports matches in meta.total.
            const normalizedResults: SearchResult[] = rawResults.map((item: any, index: number) => {
              const user = item?.user ?? item?.user_info ?? {};
              const profile = item?.profile ?? item?.profile_data ?? item?.user_profile ?? {};

              return {
                user: {
                  id: user.id ?? `unknown-user-${index}`,
                  email: user.email ?? "",
                  role: user.role ?? "",
                  status: user.status ?? "",
                  memberId: user.memberId ?? user.member_id ?? `MAW-UNKNOWN-${index}`,
                },
                profile: {
                  id: profile.id ?? `unknown-profile-${index}`,
                  firstName: profile.firstName ?? profile.first_name ?? profile.firstname ?? "",
                  lastName: profile.lastName ?? profile.last_name ?? profile.lastname ?? "",
                  gender: profile.gender ?? "",
                  age: profile.age,
                  nationality: profile.nationality,
                  city: profile.city,
                  countryOfResidence: profile.countryOfResidence ?? profile.country_of_residence,
                  education: profile.education,
                  occupation: profile.occupation,
                  maritalStatus: profile.maritalStatus ?? profile.marital_status,
                  marriageType: profile.marriageType ?? profile.marriage_type,
                  polygamyAcceptance: profile.polygamyAcceptance ?? profile.polygamy_acceptance,
                  compatibilityTest: profile.compatibilityTest ?? profile.compatibility_test,
                  religion: profile.religion,
                  religiosityLevel: profile.religiosityLevel ?? profile.religiosity_level,
                  about: profile.about,
                  photoUrl: profile.photoUrl ?? profile.photo_url,
                  dateOfBirth: profile.dateOfBirth ?? profile.date_of_birth,
                  height: profile.height,
                },
              };
            });

            // Use set() to update state - this triggers React re-renders automatically
            set({
              results: normalizedResults,
              meta: paginationMeta
                ? {
                    ...paginationMeta,
                  }
                : {
                    current_page: page,
                    last_page: 1,
                    per_page: filters.per_page ? parseInt(filters.per_page) : 20,
                    total: normalizedResults.length,
                  },
              error: null,
            });

              console.log(">>> FRONTEND: STATE UPDATED via set():", {
                resultsCount: normalizedResults.length,
                originalDataCount: rawResults.length,
                originalMetaTotal: paginationMeta?.total,
                finalMetaTotal: paginationMeta?.total ?? normalizedResults.length,
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
