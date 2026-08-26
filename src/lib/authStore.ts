import { create } from 'zustand';
import { AuthResponse, UserRole } from '../types';

// ==========================================
// Safe Cookie Helper Utilities (Crash-Proof)
// ==========================================

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const escapedName = name.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
    const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + escapedName + '=([^;]*)'));
    if (!match || !match[1]) return null;
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1]; // Return raw string if decodeURIComponent fails
    }
  } catch {
    return null;
  }
}

function setCookie(name: string, value: string, maxAgeSeconds: number = 28 * 24 * 3600) {
  if (typeof document === 'undefined') return;
  try {
    const encoded = encodeURIComponent(value);
    document.cookie = `${name}=${encoded}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
  } catch (err) {
    console.warn('[Cookie] Failed to set cookie:', err);
  }
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  } catch (err) {
    console.warn('[Cookie] Failed to delete cookie:', err);
  }
}

function getStoredToken(): string | null {
  try {
    const local = localStorage.getItem('accessToken');
    if (local) return local;
  } catch {
    // LocalStorage blocked/unavailable
  }
  return getCookie('scme_access_token');
}

function getStoredRefreshToken(): string | null {
  try {
    const local = localStorage.getItem('refreshToken');
    if (local) return local;
  } catch {
    // LocalStorage blocked/unavailable
  }
  return getCookie('scme_refresh_token');
}

function getStoredEmail(): string | null {
  try {
    const local = localStorage.getItem('userEmail');
    if (local) return local;
  } catch {
    // LocalStorage blocked/unavailable
  }
  return getCookie('scme_user_email');
}

function getStoredRole(): UserRole | null {
  try {
    const local = localStorage.getItem('userRole') as UserRole;
    if (local) return local;
  } catch {
    // LocalStorage blocked/unavailable
  }
  return (getCookie('scme_user_role') as UserRole) || null;
}

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  userEmail: string | null;
  role: UserRole | null;
  login: (authData: AuthResponse) => void;
  logout: () => void;
  initializeFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!getStoredToken(),
  accessToken: getStoredToken(),
  refreshToken: getStoredRefreshToken(),
  userEmail: getStoredEmail(),
  role: getStoredRole(),

  login: (authData: AuthResponse) => {
    // 1. Sync to LocalStorage safely
    try {
      localStorage.setItem('accessToken', authData.accessToken);
      localStorage.setItem('refreshToken', authData.refreshToken);
      localStorage.setItem('userEmail', authData.email);
      localStorage.setItem('userRole', authData.role);
      localStorage.setItem('scme_last_email', authData.email);
      localStorage.setItem('scme_last_role', authData.role);
    } catch (err) {
      console.warn('[AuthStore] LocalStorage write error:', err);
    }

    // 2. Sync to Browser Cookies (28 Days retention)
    setCookie('scme_access_token', authData.accessToken, 28 * 24 * 3600);
    setCookie('scme_refresh_token', authData.refreshToken, 28 * 24 * 3600);
    setCookie('scme_user_email', authData.email, 28 * 24 * 3600);
    setCookie('scme_user_role', authData.role, 28 * 24 * 3600);

    set({
      isAuthenticated: true,
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
      userEmail: authData.email,
      role: authData.role,
    });
  },

  logout: () => {
    // 1. Clear LocalStorage safely
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
    } catch (err) {
      console.warn('[AuthStore] LocalStorage clear error:', err);
    }

    // 2. Clear Cookies safely
    deleteCookie('scme_access_token');
    deleteCookie('scme_refresh_token');
    deleteCookie('scme_user_email');
    deleteCookie('scme_user_role');

    set({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      userEmail: null,
      role: null,
    });
  },

  initializeFromStorage: () => {
    const token = getStoredToken();
    const refreshToken = getStoredRefreshToken();
    const userEmail = getStoredEmail();
    const role = getStoredRole();

    set({
      isAuthenticated: !!token,
      accessToken: token,
      refreshToken,
      userEmail,
      role,
    });
  },
}));
