import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-light)',
      padding: '12px 24px',
      fontSize: '0.75rem',
      color: 'var(--text-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8,
      background: 'var(--bg-secondary)',
    }}>
      <span>© 2025 Grasshopper News — Built for JBS Southern Australia</span>
      <span style={{ opacity: 0.7 }}>Data sources: MLA · ABARES · Reuters · ABC Rural · Beef Central</span>
    </footer>
  )
}

export default function Layout({ children, stats, loading, onRefresh, lastRefreshed, searchQuery, onSearchChange, usingLive }) {
  const { pathname } = useLocation()

  return (
    <div className="app-shell">
      <Sidebar
        highImpactCount={stats?.impactBreakdown?.HIGH ?? 0}
        lastRefreshed={lastRefreshed}
        usingLive={usingLive}
      />

      <div className="main-area">
        <Header
          pathname={pathname}
          onRefresh={onRefresh}
          loading={loading}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          lastRefreshed={lastRefreshed}
        />
        <main className="page-content">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  )
}
