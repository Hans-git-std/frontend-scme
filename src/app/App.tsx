import { HealthCard } from '../features/health/HealthCard'
import './styles.css'

export function App() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <span className="brand-mark">SCME</span>
        <span className="environment-label">Frontend workspace</span>
      </header>
      <div className="content">
        <div className="intro">
          <p className="eyebrow">Application foundation</p>
          <h1>Build the experience around your API.</h1>
          <p className="lede">
            A clean starting point for screens, features, and typed requests to your live backend.
          </p>
        </div>
        <HealthCard />
      </div>
    </main>
  )
}