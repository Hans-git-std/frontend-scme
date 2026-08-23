const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

if (!apiBaseUrl) {
  console.warn('VITE_API_BASE_URL is not configured. Add it to a local .env file.')
}

export const env = {
  apiBaseUrl: apiBaseUrl?.replace(/\/$/, '') ?? '',
} as const