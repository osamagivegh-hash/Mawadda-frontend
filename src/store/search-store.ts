import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchWithToken } from "@/lib/api";
import { useAuthStore } from "./auth-store";

export type SearchFilters = {
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

type SearchState = {
  filters: SearchFilters;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
};

type SearchActions = {
  setFilter: (key: keyof SearchFilters, value: string) => void;
  resetFilters: () => void;
  performSearch: () => Promise<void>;
  setResults: (results: SearchResult[]) => void;
  setError: (error: string | null) => void;
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

export const useSearchStore = create<SearchState & SearchActions>()(
  persist(
    (set, get) => ({
      filters: initialFilters,
      results: [],
      loading: false,
      error: null,

      setFilter(key, value) {
        set((state) => ({
          filters: {
            ...state.filters,
            [key]: value,
          },
        }));
      },

      resetFilters() {
        set({
          filters: initialFilters,
          results: [],
          error: null,
        });
      },

      setResults(results) {
        console.log("SEARCH STORE: setResults", results);
        set({ results });
      },

      setError(error) {
        set({ error });
      },

      async performSearch() {
        const { token } = useAuthStore.getState();
        const { filters } = get();

        if (!token) {
          set({ error: "يجب تسجيل الدخول لإجراء البحث" });
          return;
        }

        const activeFilters = filters;

        const gender = activeFilters.gender?.trim();
        const minAgeValue = activeFilters.minAge
          ? parseInt(activeFilters.minAge)
          : undefined;
        const maxAgeValue = activeFilters.maxAge
          ? parseInt(activeFilters.maxAge)
          : undefined;

        if (!gender) {
          set({
            error: "يجب اختيار الجنس للبحث (مطلوب)",
          });
          return;
        }

        if (!minAgeValue && !maxAgeValue) {
          set({
            error: "يجب إدخال العمر (من أو إلى) للبحث (مطلوب)",
          });
          return;
        }

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
            error: "نطاق العمر غير صحيح. يجب أن يكون بين 18 و 80 ولا يكون الأدنى أكبر من الأعلى.",
          });
          return;
        }

        set({ loading: true, error: null });

        try {
          const payload: Record<string, string | number> = {};

          payload.gender = gender;
          if (minAgeValue !== undefined && !isNaN(minAgeValue)) {
            payload.minAge = minAgeValue;
          }
          if (maxAgeValue !== undefined && !isNaN(maxAgeValue)) {
            payload.maxAge = maxAgeValue;
          }

          const pushIfValue = (key: keyof SearchFilters) => {
            const val = activeFilters[key];
            if (val && val.trim().length > 0 && val.trim().toLowerCase() !== "all") {
              payload[key] = val.trim();
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

          if (activeFilters.height && activeFilters.height.trim().length > 0) {
            const h = parseInt(activeFilters.height);
            if (!isNaN(h) && h >= 100 && h <= 250) {
              payload.height = h;
            }
          }

          if (activeFilters.hasPhoto === "true") {
            payload.hasPhoto = "true";
          }

          const params = new URLSearchParams();
          Object.entries(payload).forEach(([key, value]) => {
            params.append(key, String(value));
          });

          const endpoint = `/search?${params.toString()}`;

          console.log("SEARCH STORE: filters", activeFilters);
          console.log("SEARCH STORE: payload", payload);
          console.log("SEARCH STORE: endpoint", endpoint);

          const data = await fetchWithToken<SearchResult[]>(endpoint, token);

          console.log("SEARCH STORE: response", data);

          if (Array.isArray(data)) {
            set({ results: data, error: null });
          } else {
            set({
              results: [],
              error: "استجابة غير صحيحة من الخادم. يرجى المحاولة مرة أخرى.",
            });
          }
        } catch (err) {
          console.error("SEARCH STORE performSearch error:", err);
          set({
            results: [],
            error:
              err instanceof Error ? err.message : "حدث خطأ في البحث، حاول مرة أخرى.",
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
      }),
    },
  ),
);


