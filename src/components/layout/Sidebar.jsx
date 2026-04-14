import { NavLink, useLocation } from 'react-router-dom'
import { formatRelativeTime } from '../../utils/scoring'

function IconDashboard() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
}
function IconNews() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" /><path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8V6Z" /></svg>
}
function IconForecast() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
}
function IconBrand() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
}

export default function Sidebar({ highImpactCount, lastRefreshed, usingLive }) {
  const location = useLocation()

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <NavLink to="/" className="sidebar-brand-logo">
          <div className="sidebar-brand-icon"><IconBrand /></div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">🦗 Grasshopper News</span>
            <span className="sidebar-brand-sub">Australian Beef &amp; Lamb Intelligence</span>
          </div>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Platform</span>

        <NavLink to="/" end className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <IconDashboard />
          Dashboard
          {highImpactCount > 0 && (
            <span className="sidebar-link-badge">{highImpactCount}</span>
          )}
        </NavLink>

        <NavLink to="/news" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <IconNews />
          Intelligence Feed
        </NavLink>

        <NavLink to="/forecast" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <IconForecast />
          Forecast &amp; Signals
        </NavLink>

        <span className="sidebar-section-label" style={{ marginTop: 14 }}>Filter by Region</span>

        {['SA', 'VIC', 'NSW', 'TAS'].map((region) => (
          <NavLink
            key={region}
            to={`/news?region=${region}`}
            className={`sidebar-link${location.search.includes(`region=${region}`) ? ' active' : ''}`}
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
          <div className={`sidebar-status-dot${usingLive ? '' : ' sidebar-status-dot--mock'}`} />
          <div className="sidebar-status-text">
            <strong>{usingLive ? 'Live Data' : 'Demo Mode'}</strong>
            {lastRefreshed
              ? `Updated ${formatRelativeTime(lastRefreshed.toISOString())}`
              : 'Connecting…'}
          </div>
        </div>
        <div className="sidebar-footer-brand">
          Grasshopper News · Powered by Groq AI
        </div>
      </div>
    </aside>
  )
}

function regionFullName(code) {
  const map = { SA: 'South Australia', VIC: 'Victoria', NSW: 'New South Wales', TAS: 'Tasmania' }
  return map[code] ?? code
}
