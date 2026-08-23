import { useState } from 'react'
import { env } from '../../config/env'
import { ApiError } from '../../lib/api/client'
import { getHealth } from './health.api'

export function HealthCard() {
  const [status, setStatus] = useState('Not checked')
  const [isLoading, setIsLoading] = useState(false)

  async function checkBackend() {
    setIsLoading(true)
    try {
      const response = await getHealth()
      setStatus(response.status ?? response.message ?? 'Backend is reachable')
    } catch (error) {
      setStatus(error instanceof ApiError ? error.message : 'Unable to reach the backend.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="health-card" aria-labelledby="health-title">
      <div>
        <p className="eyebrow">Connection check</p>
        <h2 id="health-title">Backend status</h2>
        <p className="endpoint">{env.apiBaseUrl || 'API URL not configured'}</p>
      </div>
      <div className="health-result" role="status">
        <span className={status === 'Not checked' ? 'status-dot idle' : 'status-dot'} />
        <span>{status}</span>
      </div>
      <button type="button" onClick={checkBackend} disabled={isLoading}>
        {isLoading ? 'Checking...' : 'Check API'}
      </button>
    </section>
  )
}