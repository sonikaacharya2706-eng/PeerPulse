import { create } from 'zustand';
import api from '../api/axios';

export const useAuthStore = create((set, get) => {
  const savedUser = localStorage.getItem('user')
    ? JSON.parse(localStorage.getItem('user'))
    : null;
  const savedToken = localStorage.getItem('token') || null;

  return {
    user: savedUser,
    token: savedToken,
    isLoading: false,
    isAuthenticated: !!savedToken,

    setAuth: (user, token) => {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      set({ user, token, isAuthenticated: true });
    },

    login: async (email, password) => {
      set({ isLoading: true });
      try {
        const res = await api.post('/auth/login', { email, password });
        const { user, token } = res.data;
        get().setAuth(user, token);
        set({ isLoading: false });
        return { success: true, user };
      } catch (err) {
        set({ isLoading: false });
        return { success: false, message: err.message };
      }
    },

    loginWithGoogle: async (credential) => {
      set({ isLoading: true });
      try {
        const res = await api.post('/auth/google', { credential });
        const { user, token } = res.data;
        get().setAuth(user, token);
        set({ isLoading: false });
        return { success: true, user };
      } catch (err) {
        set({ isLoading: false });
        return { success: false, message: err.message };
      }
    },

    register: async (userData) => {
      set({ isLoading: true });
      try {
        const res = await api.post('/auth/register', userData);
        const { user, token } = res.data;
        get().setAuth(user, token);
        set({ isLoading: false });
        return { success: true, user };
      } catch (err) {
        set({ isLoading: false });
        return { success: false, message: err.message };
      }
    },

    logout: () => {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    },

    fetchMe: async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data) {
          localStorage.setItem('user', JSON.stringify(res.data));
          set({ user: res.data, isAuthenticated: true });
        }
      } catch (err) {
        get().logout();
      }
    },

    updateUserProfile: (updatedUser) => {
      localStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
    },
  };
});
