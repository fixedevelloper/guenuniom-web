// store/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
    token: string | null;
    user: any | null;
    permissions: string[];
    setAuth: (token: string, user: any) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            permissions: [],
            setAuth: (token, user) => set({
                token,
                user,
                permissions: user.permissions || []
            }),
            logout: () => set({ token: null, user: null, permissions: [] }),
        }),
        { name: 'auth-storage' }
    )
);