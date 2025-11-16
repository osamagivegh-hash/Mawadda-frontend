import { create } from "zustand";
import { persist } from "zustand/middleware";
import { addFavorite, getFavorites, removeFavorite } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

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
  isFavorite: (targetUserId: string) => boolean;
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
          console.log("FAVORITES STORE: no token, clearing favorites");
          set({ favorites: [], loading: false, error: null });
          return;
        }

        set({ loading: true, error: null });

        try {
          const data = await getFavorites(token);
          const list = Array.isArray(data) ? (data as FavoriteEntry[]) : [];
          console.log("FAVORITES STORE: loaded", list.length, "favorites");
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
        if (!token) {
          console.log("FAVORITES STORE: no token for addFavorite");
          return;
        }

        console.log("FAVORITES STORE: adding favorite", targetUserId);

        try {
          await addFavorite(token, targetUserId);
          // Reload favorites to get updated list from server
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
        if (!token) {
          console.log("FAVORITES STORE: no token for removeFavorite");
          return;
        }

        console.log("FAVORITES STORE: removing favorite", targetUserId);

        try {
          await removeFavorite(token, targetUserId);
          // Remove from local state immediately for better UX
          set((state) => ({
            favorites: state.favorites.filter(
              (f) => f.target.id !== targetUserId,
            ),
          }));
        } catch (err) {
          console.error("FAVORITES STORE removeFavorite error:", err);
          set({
            error:
              err instanceof Error
                ? err.message
                : "تعذر إزالة العضو من المفضلة",
          });
        }
      },

      async toggleFavorite(targetUserId) {
        const { favorites } = get();
        const exists = favorites.some((f) => f.target.id === targetUserId);

        console.log("FAVORITES STORE: toggleFavorite", targetUserId, "exists:", exists);

        if (exists) {
          await get().removeFavorite(targetUserId);
        } else {
          await get().addFavorite(targetUserId);
        }
      },

      isFavorite(targetUserId) {
        const { favorites } = get();
        return favorites.some((f) => f.target.id === targetUserId);
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