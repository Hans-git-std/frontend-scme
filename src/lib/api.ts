import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, PING_URL } from '../config/env';
import { ApiResponse, AuthResponse } from '../types';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// 1. Request Interceptor: Attach Bearer JWT
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Response Interceptor: Seamless 28-Day Refresh Token Rotation
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized with token refresh rotation
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) {
        localStorage.clear();
        window.dispatchEvent(new Event('auth-session-expired'));
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await axios.post<ApiResponse<AuthResponse>>(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken: storedRefreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        processQueue(null, accessToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.dispatchEvent(new Event('auth-session-expired'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// 3. Cold-Start Keep-Alive Worker
let keepAliveTimer: NodeJS.Timeout | number | null = null;

export function startKeepAliveWorker(intervalMs = 4 * 60 * 1000) {
  if (keepAliveTimer) return;

  const pingServer = async () => {
    try {
      await fetch(PING_URL, { method: 'GET', mode: 'cors' });
      // eslint-disable-next-line no-console
      console.debug('[Keep-Alive] Server micro-ping successful.');
    } catch {
      // Ignored for silent keep-alive
    }
  };

  // Immediate ping once on boot
  pingServer();
  keepAliveTimer = setInterval(pingServer, intervalMs);
}
