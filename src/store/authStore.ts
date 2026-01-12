import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types';
import api from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  _hasHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          console.log('Tentando login com:', email);
          const response = await api.post('/auth/login', { email, password });
          console.log('Resposta da API:', response.data);
          
          const { token, user } = response.data.data;

          if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', token);
            localStorage.setItem('auth_user', JSON.stringify(user));
          }

          set({ user, token, isLoading: false });
        } catch (error: any) {
          console.error('Erro no authStore:', error.response || error);
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
        set({ user: null, token: null });
      },

      setUser: (user) => set({ user }),
    }),
    {
      storage: createJSONStorage(() => localStorage),
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
