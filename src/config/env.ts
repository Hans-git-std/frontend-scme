export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://student-corporate-matcher.onrender.com/api/v1';

export const PING_URL =
  import.meta.env.VITE_PING_URL || 'https://student-corporate-matcher.onrender.com/api/v1/ping';

export const APP_CONFIG = {
  appName: 'Student-Corporate Matcher',
  version: '1.0.0',
  keepAliveIntervalMs: 4 * 60 * 1000, // 4 minutes
  otpCooldownSeconds: 60,
  otpValidityMinutes: 5,
};