import { env } from '../../config/env'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  if (!env.apiBaseUrl) {
    throw new ApiError('Configure VITE_API_BASE_URL before calling the backend.')
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}.`, response.status)
  }

  return response.json() as Promise<T>
}