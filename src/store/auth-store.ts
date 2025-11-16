import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StoredUser } from "@/lib/auth";

export type AuthState = {
  token: string | null;
  user: StoredUser | null;
  profileId: string | null;
  isAuthenticated: boolean;
  loading: boolean;
};

type AuthActions = {
  setAuth: (token: string, user: StoredUser) => void;
  setToken: (token: string | null) => void;
  setUser: (user: StoredUser | null) => void;
  setProfileId: (profileId: string | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      profileId: null,
      isAuthenticated: false,
      loading: true,

      setAuth: (token, user) => {
        console.log("AUTH STORE: setAuth called", { token: !!token, user: user?.email });
        set({
          token,
          user,
          profileId: user?.profileId ?? null,
          isAuthenticated: Boolean(token && user),
          loading: false,
        });
      },

      setToken: (token) => {
        set((state) => {
          const nextUser = token ? state.user : null;
          const nextProfileId = token ? state.profileId : null;
          return {
            ...state,
            token,
            user: nextUser,
            profileId: nextProfileId,
            isAuthenticated: Boolean(token && nextUser),
            loading: false,
          };
        });
      },

      setUser: (user) => {
        set((state) => {
          const nextProfileId = user?.profileId ?? state.profileId ?? null;
          return {
            ...state,
            user,
            profileId: nextProfileId,
            isAuthenticated: Boolean(state.token && !!user),
          };
        });
      },

      setProfileId: (profileId) => {
        set((state) => ({
          ...state,
          profileId,
          user: state.user ? { ...state.user, profileId: profileId ?? undefined } : state.user,
        }));
      },

      logout: () => {
        set({
          token: null,
          user: null,
          profileId: null,
          isAuthenticated: false,
          loading: false,
        });
      },
    }),
    {
      name: "mawaddah-auth",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        profileId: state.profileId,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.loading = false;
          state.isAuthenticated = Boolean(state.token && state.user);
        }
      },
    },
  ),
);


