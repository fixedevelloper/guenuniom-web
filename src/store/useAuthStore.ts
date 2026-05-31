import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
    token: string | null;
    refreshToken: string | null; // Ajoutez ceci
    user: any | null;
    permissions: string[];
    setAuth: (token: string, refreshToken: string, user: any) => void; // Mettez à jour les paramètres
    setToken: (token: string) => void; // Ajoutez ceci
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            refreshToken: null, // Initialisation
            user: null,
            permissions: [],

            // Mise à jour de setAuth pour inclure le refresh token
            setAuth: (token, refreshToken, user) => set({
                token,
                refreshToken,
                user,
                permissions: user?.permissions || []
            }),

            // Implémentation de setToken
            setToken: (token) => set({ token }),

            logout: () => set({
                token: null,
                refreshToken: null,
                user: null,
                permissions: []
            }),
        }),
        { name: 'auth-storage' }
    )
);