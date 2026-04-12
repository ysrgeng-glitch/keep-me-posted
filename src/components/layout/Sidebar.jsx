import { NavLink, useLocation } from 'react-router-dom'
import { formatRelativeTime } from '../../utils/scoring'

// Nav icon components (inline SVG for zero-dependency icons)
function IconDashboard() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  )
}
function IconNews() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8V6Z" />
    </svg>
  )
}
function IconForecast() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}
function IconBrand() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4l3 3" />
    </svg>
  )
}

export default function Sidebar({ highImpactCount, lastRefreshed }) {
  const location = useLocation()

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <NavLink to="/" className="sidebar-brand-logo">
          <div className="sidebar-brand-icon">
            <IconBrand />
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">Keep Me Posted</span>
            <span className="sidebar-brand-sub">Agri Intelligence</span>
          </div>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Intelligence</span>

        <NavLink
          to="/"
          end
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          <IconDashboard />
          Dashboard
          {highImpactCount > 0 && (
            <span className="sidebar-link-badge">{highImpactCount}</span>
          )}
        </NavLink>

        <NavLink
          to="/news"
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          <IconNews />
          News Feed
        </NavLink>

        <NavLink
          to="/forecast"
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          <IconForecast />
          Forecast & Signals
        </NavLink>

        <span className="sidebar-section-label" style={{ marginTop: 14 }}>Regions</span>

        {['SA', 'VIC', 'NSW', 'TAS'].map((region) => (
          <NavLink
            key={region}
            to={`/news?region=${region}`}
            className={({ isActive }) =>
              `sidebar-link${location.search.includes(`region=${region}`) ? ' active' : ''}`
            }
            style={{ fontSize: '0.85rem' }}
          >
            <span style={{ width: 17, height: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, opacity: 0.9 }}>
              {region}
            </span>
            {regionFullName(region)}
          </NavLink>
        ))}
      </nav>

      {/* Footer status */}
      <div className="sidebar-footer">
        <div className="sidebar-status">
          <div className="sidebar-status-dot" />
          <div className="sidebar-status-text">
            <strong>Agent Active</strong>
            {lastRefreshed
              ? `Updated ${formatRelativeTime(lastRefreshed.toISOString())}`
              : 'Connecting…'}
          </div>
        </div>
      </div>
    </aside>
  )
}

function regionFullName(code) {
  const map = { SA: 'South Australia', VIC: 'Victoria', NSW: 'New South Wales', TAS: 'Tasmania' }
  return map[code] ?? code
}
