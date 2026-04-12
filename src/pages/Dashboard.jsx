import AlertBanner from '../components/dashboard/AlertBanner'
import KPICards from '../components/dashboard/KPICards'
import HighImpactFeed from '../components/dashboard/HighImpactFeed'
import TrendingTopics from '../components/dashboard/TrendingTopics'
import DailySummary from '../components/dashboard/DailySummary'
import WhatChangedToday from '../components/dashboard/WhatChangedToday'
import { mockAlerts, mockKPIs, mockTrending, mockDailySummary, mockChangesToday } from '../data/mockData'

export default function Dashboard({ highImpactArticles, stats, loading }) {
  return (
    <div>
      {/* Critical alert banners */}
      <AlertBanner alerts={mockAlerts} />

      {/* AI Daily Briefing */}
      <DailySummary summary={mockDailySummary} />

      {/* KPI Cards */}
      <KPICards kpis={mockKPIs} stats={stats} />

      {/* Main 2-col grid */}
      <div className="dashboard-grid">
        {/* Left: high-impact feed */}
        <div className="dashboard-main">
          {loading ? (
            <SkeletonFeed />
          ) : (
            <HighImpactFeed articles={highImpactArticles} maxItems={8} />
          )}
        </div>

        {/* Right: aside widgets */}
        <div className="dashboard-aside">
          <WhatChangedToday changes={mockChangesToday} />
          <TrendingTopics topics={mockTrending} />
        </div>
      </div>
    </div>
  )
}

function SkeletonFeed() {
  return (
    <div className="card">
      <div className="card-body">
        {[1, 2, 3].map((n) => (
          <div key={n} style={{ marginBottom: 20 }}>
            <div style={{ height: 14, background: 'var(--bg-tertiary)', borderRadius: 4, marginBottom: 8, width: '30%' }} />
            <div style={{ height: 18, background: 'var(--bg-tertiary)', borderRadius: 4, marginBottom: 6 }} />
            <div style={{ height: 14, background: 'var(--bg-tertiary)', borderRadius: 4, width: '85%' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
