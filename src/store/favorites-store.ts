import { create } from "zustand";
import { persist } from "zustand/middleware";
import { addFavorite, getFavorites, removeFavorite } from "@/lib/api";
import { useAuthStore } from "./auth-store";

export type FavoriteEntry = {
  id: string;
  note?: string;
  target: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      city?: string;
      photoUrl?: string;
      about?: string;
    };
  };
};

type FavoritesState = {
  favorites: FavoriteEntry[];
  loading: boolean;
  error: string | null;
};

type FavoritesActions = {
  loadFavorites: () => Promise<void>;
  addFavorite: (targetUserId: string) => Promise<void>;
  removeFavorite: (targetUserId: string) => Promise<void>;
  toggleFavorite: (targetUserId: string) => Promise<void>;
};

export const useFavoritesStore = create<FavoritesState & FavoritesActions>()(
  persist(
    (set, get) => ({
      favorites: [],
      loading: false,
      error: null,

      async loadFavorites() {
        const { token } = useAuthStore.getState();
        if (!token) {
          set({ favorites: [], loading: false, error: null });
          return;
        }

        set({ loading: true, error: null });

        try {
          const data = await getFavorites(token);
          const list = Array.isArray(data) ? (data as FavoriteEntry[]) : [];
          console.log("FAVORITES STORE: loaded", list);
          set({ favorites: list, loading: false, error: null });
        } catch (err) {
          console.error("FAVORITES STORE loadFavorites error:", err);
          set({
            loading: false,
            error:
              err instanceof Error ? err.message : "تعذر تحميل قائمة المفضلة",
          });
        }
      },

      async addFavorite(targetUserId) {
        const { token } = useAuthStore.getState();
        if (!token) return;

        try {
          await addFavorite(token, targetUserId);
          // reload list to stay in sync with backend
          await get().loadFavorites();
        } catch (err) {
          console.error("FAVORITES STORE addFavorite error:", err);
          set({
            error:
              err instanceof Error ? err.message : "تعذر إضافة العضو للمفضلة",
          });
        }
      },

      async removeFavorite(targetUserId) {
        const { token } = useAuthStore.getState();
        if (!token) return;

        try {
          await removeFavorite(token, targetUserId);
          // optimistically filter out
          set((state) => ({
            favorites: state.favorites.filter(
              (f) => f.target.id !== targetUserId,
            ),
          }));
        } catch (err) {
          console.error("FAVORITES STORE removeFavorite error:", err);
          set({
            error:
              err instanceof Error ? err.message : "تعذر إزالة العضو من المفضلة",
          });
        }
      },

      async toggleFavorite(targetUserId) {
        const { favorites } = get();
        const exists = favorites.some((f) => f.target.id === targetUserId);

        if (exists) {
          await get().removeFavorite(targetUserId);
        } else {
          await get().addFavorite(targetUserId);
        }
      },
    }),
    {
      name: "mawaddah-favorites",
      partialize: (state) => ({
        favorites: state.favorites,
      }),
    },
  ),
);


