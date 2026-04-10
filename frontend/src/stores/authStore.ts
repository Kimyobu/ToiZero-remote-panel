import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/client';

interface AuthStore {
  cookie: string | null;
  valid: boolean;
  username: string | undefined;
  isValidating: boolean;
  error: string | null;

  setCookie: (cookie: string) => void;
  validate: () => Promise<boolean>;
  syncLocalSession: () => Promise<boolean>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      cookie: null,
      valid: false,
      username: undefined,
      isValidating: false,
      error: null,

      setCookie: (cookie: string) => {
        const trimmed = cookie.trim();
        localStorage.setItem('toi_session_cookie', trimmed);
        set({ cookie: trimmed, valid: false, error: null });
      },

      validate: async () => {
        const { cookie } = get();
        if (!cookie) {
          set({ valid: false, error: 'No session cookie' });
          return false;
        }

        set({ isValidating: true, error: null });
        try {
          const res = await api.post('/auth/validate', { cookie });
          const { valid, username } = res.data;
          set({ valid, username, isValidating: false });
          return valid;
        } catch (err: any) {
          const msg = err.response?.data?.error || err.message || 'Validation failed';
          set({ valid: false, error: msg, isValidating: false });
          return false;
        }
      },

      syncLocalSession: async () => {
        try {
          const res = await api.get('/auth/session');
          if (res.data.hasSession && res.data.isValid) {
            const { cookie, username } = res.data;
            localStorage.setItem('toi_session_cookie', cookie);
            set({ cookie, username, valid: true, error: null });
            return true;
          }
        } catch (e) {}
        return false;
      },

      login: async (username, password) => {
        set({ isValidating: true, error: null });
        try {
          const res = await api.post('/auth/login', { username, password });
          const { cookie, username: displayName } = res.data;
          
          localStorage.setItem('toi_session_cookie', cookie);
          set({ 
            cookie, 
            valid: true, 
            username: displayName, 
            isValidating: false 
          });
          return true;
        } catch (err: any) {
          const msg = err.response?.data?.error || err.message || 'Login failed';
          set({ valid: false, error: msg, isValidating: false });
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem('toi_session_cookie');
        api.delete('/auth').catch(() => {});
        set({ cookie: null, valid: false, username: undefined, error: null });
      },
    }),
    {
      name: 'toi-auth',
      partialize: (state) => ({ cookie: state.cookie }),
    }
  )
);
