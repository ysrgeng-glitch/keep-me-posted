import { getSentimentDescriptor } from '../../utils/scoring'

function IconArticles() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
}
function IconAlert() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
}
function IconGlobe() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
}
function IconSentiment() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
}

export default function KPICards({ kpis, stats }) {
  const sentiment = getSentimentDescriptor(stats?.sentiment ?? 0)
  const sentimentPct = Math.round(Math.abs((stats?.sentiment ?? 0)) * 100)
  const sentimentSign = (stats?.sentiment ?? 0) >= 0 ? '+' : '-'

  return (
    <div className="kpi-grid">
      {/* Total articles monitored */}
      <div className="kpi-card kpi-card--green">
        <div className="kpi-icon"><IconArticles /></div>
        <div className="kpi-label">Articles Monitored</div>
        <div className="kpi-value">{kpis.totalArticles.toLocaleString()}</div>
        <div className="kpi-meta">
          <span className="kpi-change kpi-change--up">↑ {kpis.weeklyArticleChange}</span>
          <span>this week</span>
        </div>
      </div>

      {/* High impact today */}
      <div className="kpi-card kpi-card--red">
        <div className="kpi-icon"><IconAlert /></div>
        <div className="kpi-label">High Impact Today</div>
        <div className="kpi-value kpi-value--red">
          {stats?.impactBreakdown?.HIGH ?? kpis.highImpactToday}
        </div>
        <div className="kpi-meta">
          <span className="kpi-change kpi-change--up">
            ↑ {kpis.weeklyHighImpactChange ?? 0}
          </span>
          <span>vs yesterday</span>
        </div>
      </div>

      {/* Regions monitored */}
      <div className="kpi-card kpi-card--blue">
        <div className="kpi-icon"><IconGlobe /></div>
        <div className="kpi-label">Regions Monitored</div>
        <div className="kpi-value" style={{ fontSize: '1.8rem' }}>
          {kpis.regionsMonitored} states
        </div>
        <div className="kpi-meta">
          <span>{kpis.sourcesMonitored} active sources</span>
        </div>
      </div>

      {/* Market sentiment */}
      <div className="kpi-card kpi-card--gold">
        <div className="kpi-icon"><IconSentiment /></div>
        <div className="kpi-label">Market Sentiment</div>
        <div
          className="kpi-value"
          style={{
            fontSize: '1.4rem',
            color: sentiment.color,
          }}
        >
          {sentiment.label}
        </div>
        <div className="kpi-meta">
          <span style={{ color: sentiment.color, fontWeight: 600 }}>
            {sentimentSign}{sentimentPct}% signal
          </span>
          <span>· {kpis.sentimentTrend}</span>
        </div>
      </div>
    </div>
  )
}
