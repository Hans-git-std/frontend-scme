import { apiRequest } from '../../lib/api/client'

export type HealthResponse = {
  status?: string
  message?: string
}

export function getHealth() {
  return apiRequest<HealthResponse>('/health')
}