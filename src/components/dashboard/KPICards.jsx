import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getSentimentDescriptor, formatAUD } from '../../utils/scoring'

function IconArticles() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
}
function IconAlert() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
}
function IconShield() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
}
function IconDollar() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
}

export default function KPICards({ stats, articles }) {
  const sentiment     = getSentimentDescriptor(stats?.sentiment ?? 0)
  const sentimentPct  = Math.round(Math.abs(stats?.sentiment ?? 0) * 100)
  const sentimentSign = (stats?.sentiment ?? 0) >= 0 ? '+' : '-'

  const activeSources = useMemo(() => {
    if (!articles?.length) return 0
    return new Set(articles.map((a) => a.source)).size
  }, [articles])

  const verifiedCount = stats?.verifiedCount ?? 0
  const highCount     = stats?.impactBreakdown?.HIGH   ?? 0
  const mediumCount   = stats?.impactBreakdown?.MEDIUM ?? 0
  const totalCount    = stats?.total ?? 0
  const verifiedPct   = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0

  // Aggregate financial exposure from HIGH-impact articles
  const totalExposure = stats?.totalFinancialExposure ?? 0
  const exposureLabel = totalExposure > 0 ? formatAUD(totalExposure) : '—'

  return (
    <div className="kpi-grid">

      {/* Articles monitored → all news */}
      <Link to="/news" className="kpi-card kpi-card--green">
        <div className="kpi-icon"><IconArticles /></div>
        <div className="kpi-label">Articles Monitored</div>
        <div className="kpi-value">{totalCount}</div>
        <div className="kpi-meta">
          <span>{mediumCount + highCount} significant</span>
          <span style={{ marginLeft: 'auto', opacity: 0.7 }}>{activeSources} sources</span>
        </div>
      </Link>

      {/* High impact → news filtered to HIGH */}
      <Link to="/news?impact=HIGH" className="kpi-card kpi-card--red">
        <div className="kpi-icon"><IconAlert /></div>
        <div className="kpi-label">High Impact Alerts</div>
        <div className="kpi-value kpi-value--red">{highCount}</div>
        <div className="kpi-meta">
          <span>{mediumCount} medium-impact</span>
        </div>
      </Link>

      {/* Verified intelligence → news filtered to verified */}
      <Link to="/news?verification=VERIFIED" className="kpi-card kpi-card--blue">
        <div className="kpi-icon"><IconShield /></div>
        <div className="kpi-label">Verified Intelligence</div>
        <div className="kpi-value">{verifiedCount}</div>
        <div className="kpi-meta">
          <span>{verifiedPct}% of total verified</span>
        </div>
      </Link>

      {/* Financial exposure → news filtered to HIGH impact */}
      <Link to="/news?impact=HIGH" className="kpi-card kpi-card--gold">
        <div className="kpi-icon"><IconDollar /></div>
        <div className="kpi-label">High-Impact Exposure</div>
        <div className="kpi-value" style={{ fontSize: '1.35rem', color: highCount > 0 ? '#b91c1c' : 'var(--text-primary)' }}>
          {exposureLabel}
        </div>
        <div className="kpi-meta">
          <span style={{ color: 'var(--text-muted)' }}>AUD max estimate</span>
        </div>
      </Link>

    </div>
  )
}
