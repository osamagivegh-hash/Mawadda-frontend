import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchWithToken } from "@/lib/api";
import { useAuthStore } from "./auth-store";

export type ProfileResponse = {
  id?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  nationality?: string;
  city?: string;
  countryOfResidence?: string;
  education?: string;
  occupation?: string;
  religiosityLevel?: string;
  religion?: string;
  maritalStatus?: string;
  marriageType?: string;
  polygamyAcceptance?: string;
  compatibilityTest?: string;
  about?: string;
  guardianName?: string;
  guardianContact?: string;
  photoUrl?: string;
  photoStorage?: "cloudinary" | "local";
  photoPublicId?: string | null;
  isVerified?: boolean;
};

type ProfileState = {
  profile: ProfileResponse | null;
  baseline: ProfileResponse | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
};

type ProfileActions = {
  loadProfile: (userId?: string) => Promise<void>;
  setField: (key: keyof ProfileResponse, value: string) => void;
  applyFormChanges: (partial: Partial<ProfileResponse>) => void;
  saveProfile: () => Promise<void>;
  resetProfile: () => void;
  setFromServer: (profile: ProfileResponse | null) => void;
};

const profileFieldOrder: (keyof ProfileResponse)[] = [
  "firstName",
  "lastName",
  "gender",
  "dateOfBirth",
  "nationality",
  "city",
  "countryOfResidence",
  "education",
  "occupation",
  "religiosityLevel",
  "religion",
  "maritalStatus",
  "marriageType",
  "polygamyAcceptance",
  "compatibilityTest",
  "about",
  "guardianName",
  "guardianContact",
];

export const useProfileStore = create<ProfileState & ProfileActions>()(
  persist(
    (set, get) => ({
      profile: null,
      baseline: null,
      loading: false,
      saving: false,
      error: null,

      async loadProfile(userId?: string) {
        const { token, user, setProfileId } = useAuthStore.getState();
        if (!token) {
          set({ profile: null, baseline: null, loading: false });
          return;
        }

        const effectiveUserId = user?.id ?? userId;
        set({ loading: true, error: null });

        try {
          // Prefer /profiles/me to avoid trusting client IDs
          const endpoint = user ? "/profiles/me" : `/profiles/${effectiveUserId}`;
          const data = await fetchWithToken<ProfileResponse | null>(
            endpoint,
            token,
          );

          if (data) {
            const formatted: ProfileResponse = {
              ...data,
              dateOfBirth: data.dateOfBirth
                ? new Date(data.dateOfBirth).toISOString().split("T")[0]
                : "",
            };

            console.log("PROFILE STORE: loaded profile", formatted);
            set({
              profile: formatted,
              baseline: formatted,
              loading: false,
              error: null,
            });

            if (formatted.id) {
              setProfileId(formatted.id);
            }
          } else {
            // no profile yet → empty shell
            const empty: ProfileResponse = {};
            set({ profile: empty, baseline: empty, loading: false, error: null });
          }
        } catch (err) {
          console.error("PROFILE STORE loadProfile error:", err);
          set({
            loading: false,
            error:
              err instanceof Error ? err.message : "فشل تحميل الملف الشخصي",
            profile: get().profile ?? {},
            baseline: get().baseline ?? {},
          });
        }
      },

      setField(key, value) {
        set((state) => ({
          profile: {
            ...(state.profile ?? {}),
            [key]: value,
          },
        }));
      },

      applyFormChanges(partial) {
        set((state) => ({
          profile: {
            ...(state.profile ?? {}),
            ...partial,
          },
        }));
      },

      async saveProfile() {
        const { token, user } = useAuthStore.getState();
        if (!token || !user) {
          set({ error: "يجب تسجيل الدخول قبل حفظ الملف الشخصي" });
          return;
        }

        const { profile, baseline } = get();
        if (!profile) {
          set({ error: "لا توجد بيانات لحفظها" });
          return;
        }

        // Basic required-field validation mirroring backend CreateProfileDto
        const required: (keyof ProfileResponse)[] = [
          "gender",
          "dateOfBirth",
          "city",
          "nationality",
          "maritalStatus",
          "education",
          "occupation",
          "religiosityLevel",
        ];

        const missing = required.filter(
          (field) =>
            !profile[field] || String(profile[field] ?? "").trim().length === 0,
        );

        if (missing.length > 0) {
          set({
            error: `الحقول التالية مطلوبة: ${missing
              .map((f) => String(f))
              .join(", ")}`,
          });
          return;
        }

        // Normalize dateOfBirth -> ISO yyyy-mm-dd
        const currentProfile: ProfileResponse = { ...profile };
        if (currentProfile.dateOfBirth) {
          const d = new Date(currentProfile.dateOfBirth);
          if (isNaN(d.getTime())) {
            set({ error: "تاريخ الميلاد غير صحيح" });
            return;
          }
          currentProfile.dateOfBirth = d.toISOString().split("T")[0];
        }

        const isUpdate = Boolean(currentProfile.id);
        const endpoint = isUpdate
          ? `/profiles/${user.id}`
          : "/profiles";

        const method = isUpdate ? "PATCH" : "POST";

        let payload: Record<string, string> = {};

        if (isUpdate) {
          const base = baseline ?? {};

          profileFieldOrder.forEach((field) => {
            const current = currentProfile[field];
            const prev = base[field];

            const currentNorm =
              typeof current === "string" ? current.trim() : current;
            const prevNorm = typeof prev === "string" ? prev.trim() : prev;

            if (currentNorm === prevNorm) {
              return;
            }

            if (
              (prevNorm ?? "") !== "" &&
              (currentNorm === "" || currentNorm === null || currentNorm === undefined)
            ) {
              // explicit clear
              payload[field as string] = "";
              return;
            }

            if (currentNorm !== undefined && currentNorm !== null) {
              payload[field as string] = String(currentNorm);
            }
          });
        } else {
          // create payload: only the required fields + optional about
          const requiredCreate: (keyof ProfileResponse)[] = [
            "gender",
            "dateOfBirth",
            "city",
            "nationality",
            "maritalStatus",
            "education",
            "occupation",
            "religiosityLevel",
          ];
          requiredCreate.forEach((field) => {
            const val = currentProfile[field];
            if (typeof val === "string") {
              payload[field] = val.trim();
            }
          });
          if (
            currentProfile.about &&
            currentProfile.about.trim().length >= 2
          ) {
            payload.about = currentProfile.about.trim();
          }
        }

        console.log("PROFILE STORE PATCH PAYLOAD:", payload);

        if (Object.keys(payload).length === 0) {
          set({ error: null });
          return;
        }

        set({ saving: true, error: null });

        try {
          const updated = await fetchWithToken<ProfileResponse>(
            endpoint,
            token,
            {
              method,
              body: JSON.stringify(payload),
            },
          );

          const merged: ProfileResponse = {
            ...(profile ?? {}),
            ...(baseline ?? {}),
            ...currentProfile,
            ...updated,
            dateOfBirth: updated.dateOfBirth
              ? new Date(updated.dateOfBirth).toISOString().split("T")[0]
              : currentProfile.dateOfBirth,
          };

          console.log("PROFILE STORE: saved profile", merged);

          set({
            profile: merged,
            baseline: merged,
            saving: false,
            error: null,
          });

          if (merged.id) {
            useAuthStore.getState().setProfileId(merged.id);
          }
        } catch (err) {
          console.error("PROFILE STORE saveProfile error:", err);
          set({
            saving: false,
            error:
              err instanceof Error ? err.message : "حدث خطأ أثناء حفظ الملف",
          });
        }
      },

      resetProfile() {
        const { baseline } = get();
        set({ profile: baseline ? { ...baseline } : null, error: null });
      },

      setFromServer(profile) {
        console.log("PROFILE STORE: setFromServer", profile);
        set({
          profile,
          baseline: profile ? { ...profile } : null,
        });
      },
    }),
    {
      name: "mawaddah-profile",
      partialize: (state) => ({
        profile: state.profile,
        baseline: state.baseline,
      }),
    },
  ),
);




