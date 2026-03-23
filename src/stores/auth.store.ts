import { create } from 'zustand';
import { TOKEN_STORAGE_KEY } from '@/constants/storage';

interface AuthState {
  token: string;
  setToken: (token: string) => void;
  clearToken: () => void;
}

const initialToken = typeof window === 'undefined' ? '' : localStorage.getItem(TOKEN_STORAGE_KEY) ?? '';

export const useAuthStore = create<AuthState>((set) => ({
  token: initialToken,
  setToken: (token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
    set({ token });
  },
  clearToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    set({ token: '' });
  },
}));
