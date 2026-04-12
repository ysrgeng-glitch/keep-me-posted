import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout({ children, stats, loading, onRefresh, lastRefreshed, searchQuery, onSearchChange }) {
  const { pathname } = useLocation()

  return (
    <div className="app-shell">
      <Sidebar
        highImpactCount={stats?.impactBreakdown?.HIGH ?? 0}
        lastRefreshed={lastRefreshed}
      />

      <div className="main-area">
        <Header
          pathname={pathname}
          onRefresh={onRefresh}
          loading={loading}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  )
}
