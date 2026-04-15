function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  )
}
function IconRefresh() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  )
}
function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}
function IconClose() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

const PAGE_META = {
  '/':         { title: 'Intelligence Dashboard',        subtitle: 'Grasshopper News — Australian Beef & Lamb Intelligence, Powered by AI' },
  '/news':     { title: 'Intelligence Feed',             subtitle: 'AI-verified news ranked by financial impact' },
  '/forecast': { title: 'Forecast & Market Signals',     subtitle: 'Price projections and forward indicators' },
}

export default function Header({ pathname, onRefresh, loading, searchQuery, onSearchChange, lastRefreshed, onToggleSidebar, sidebarOpen }) {
  const meta = PAGE_META[pathname] ?? { title: 'Grasshopper News', subtitle: '' }

  const lastRefreshedStr = lastRefreshed
    ? lastRefreshed.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <header className="header">
      {/* Hamburger — mobile only */}
      <button
        className="header-menu-btn"
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={sidebarOpen}
      >
        {sidebarOpen ? <IconClose /> : <IconMenu />}
      </button>

      {/* Page title */}
      <div className="header-left">
        <span className="header-title">{meta.title}</span>
        {meta.subtitle && <span className="header-subtitle">{meta.subtitle}</span>}
      </div>

      {/* Global search */}
      <div className="header-center">
        <div className="header-search">
          <IconSearch />
          <input
            type="search"
            placeholder="Search intelligence, sources, topics…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search intelligence"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="header-right">
        {lastRefreshedStr && (
          <span className="header-last-refreshed">Updated {lastRefreshedStr}</span>
        )}
        <button
          className="header-refresh-btn"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh Intelligence"
        >
          <span style={{ display: 'inline-block', animation: loading ? 'spin 1s linear infinite' : 'none' }}>
            <IconRefresh />
          </span>
          <span className="header-refresh-label">{loading ? 'Refreshing…' : 'Refresh'}</span>
        </button>

        <div className="header-live-badge">
          <span />
          Live
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </header>
  )
}
