import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  openedx_user_id?: string;
  lms_username?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (partial: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Load user from localStorage if we have one
  let savedUser = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      savedUser = JSON.parse(userStr);
    }
  } catch (e) {
    console.error("Failed to parse saved user", e);
  }

  return {
    user: savedUser,
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    login: (user, token) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true });
    },
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null, isAuthenticated: false });
    },
    updateUser: (partial) => {
      set((state) => {
        if (!state.user) return state;
        const updatedUser = { ...state.user, ...partial };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { user: updatedUser };
      });
    },
  };
});
