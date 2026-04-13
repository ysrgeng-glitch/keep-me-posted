import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import ImpactBadge from '../components/common/ImpactBadge'
import RegionTag from '../components/common/RegionTag'
import KPICards from '../components/dashboard/KPICards'
import { formatRelativeTime, getSentimentDescriptor } from '../utils/scoring'

// ── Daily Briefing derived from real articles ─────────────────────────────

function DailyBriefing({ articles }) {
  const today = useMemo(() => {
    const cutoff = Date.now() - 48 * 60 * 60 * 1000
    return articles.filter((a) => new Date(a.publishedAt) > cutoff)
  }, [articles])

  const high   = today.filter((a) => a.impact === 'HIGH').length
  const medium = today.filter((a) => a.impact === 'MEDIUM').length
  const sources = [...new Set(today.map((a) => a.source))].slice(0, 3).join(', ')
  const topStory = today.find((a) => a.impact === 'HIGH') ?? today[0]
  const themes = useMemo(() => {
    const tagCounts = {}
    today.forEach((a) => (a.tags ?? []).forEach((t) => { tagCounts[t] = (tagCounts[t] ?? 0) + 1 }))
    return Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t)
  }, [today])

  const avgSentiment = today.length
    ? today.reduce((s, a) => s + (a.sentiment ?? 0), 0) / today.length
    : 0
  const outlook = avgSentiment > 0.1 ? 'POSITIVE' : avgSentiment < -0.1 ? 'NEGATIVE' : 'CAUTIOUS'

  if (!topStory) return null

  return (
    <div className="daily-summary">
      <div className="daily-summary-label">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
        Today's Intelligence Briefing
      </div>
      <div className="daily-summary-headline">{topStory.headline}</div>
      <div className="daily-summary-body">
        {today.length} articles monitored in the last 48 hours from {sources || 'multiple sources'}.
        {high > 0 && ` ${high} high-impact development${high > 1 ? 's' : ''} identified.`}
        {medium > 0 && ` ${medium} medium-impact item${medium > 1 ? 's' : ''} tracked.`}
      </div>
      {themes.length > 0 && (
        <div className="daily-summary-themes">
          {themes.map((t) => <span key={t} className="daily-summary-theme">{t}</span>)}
        </div>
      )}
      <div className={`daily-summary-outlook daily-summary-outlook--${outlook}`}>
        {outlook === 'POSITIVE' ? '▲' : outlook === 'NEGATIVE' ? '▼' : '◆'} Market outlook: {outlook.toLowerCase()}
      </div>
    </div>
  )
}

// ── Recent Articles feed ─────────────────────────────────────────────────

function IconFire() {
  return <svg style={{ width:15, height:15 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>
}
function IconChevronRight() {
  return <svg style={{ width:13, height:13 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
}

function HighImpactFeed({ articles }) {
  const navigate = useNavigate()
  const items = articles?.slice(0, 8) ?? []

  return (
    <div className="card">
      <div className="card-header">
        <div className="section-header" style={{ marginBottom: 0 }}>
          <div className="section-title"><IconFire /> Latest Intelligence</div>
          <button className="section-link" onClick={() => navigate('/news')} style={{ cursor:'pointer', background:'none', border:'none' }}>
            View all <IconChevronRight />
          </button>
        </div>
      </div>
      <div className="card-body">
        <div className="high-impact-list">
          {items.length === 0 && (
            <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', padding:'12px 0' }}>
              No articles yet — the AI agent runs every hour.
            </p>
          )}
          {items.map((article) => (
            <div
              key={article.id}
              className="high-impact-item"
              onClick={() => navigate(`/news/${article.id}`)}
              role="button" tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/news/${article.id}`)}
            >
              <div className={`high-impact-indicator high-impact-indicator--${article.impact}`} />
              <div className="high-impact-body">
                <div className="high-impact-headline">{article.headline}</div>
                <div className="high-impact-excerpt">{article.summary}</div>
                <div className="high-impact-foot">
                  <ImpactBadge level={article.impact} />
                  {(article.regions ?? []).slice(0, 2).map((r) => <RegionTag key={r} region={r} />)}
                  <span className="high-impact-source">{article.source}</span>
                  <span className="high-impact-source" style={{ marginLeft:'auto' }}>
                    {formatRelativeTime(article.publishedAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Trending Topics derived from real article tags ────────────────────────

function TrendingTopics({ articles }) {
  const topics = useMemo(() => {
    const counts = {}
    articles.forEach((a) => (a.tags ?? []).forEach((t) => { counts[t] = (counts[t] ?? 0) + 1 }))
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }))
  }, [articles])

  if (topics.length === 0) return null

  return (
    <div className="card">
      <div className="card-header">
        <div className="section-title">
          <svg style={{ width:15,height:15 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
          Trending Topics
        </div>
      </div>
      <div className="card-body">
        <div className="trending-list">
          {topics.map((t, i) => (
            <div key={t.name} className="trending-item">
              <span className="trending-rank">{i + 1}</span>
              <span className="trending-topic-name" style={{ textTransform:'capitalize' }}>{t.name}</span>
              <span className="trending-count">{t.count} art.</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Source Breakdown ──────────────────────────────────────────────────────

function SourceBreakdown({ articles }) {
  const sources = useMemo(() => {
    const counts = {}
    articles.forEach((a) => { counts[a.source] = (counts[a.source] ?? 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [articles])
  const max = sources[0]?.[1] ?? 1

  return (
    <div className="card">
      <div className="card-header">
        <div className="section-title">
          <svg style={{ width:15,height:15 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
          Sources
        </div>
      </div>
      <div className="card-body">
        <div className="category-breakdown-list">
          {sources.map(([name, count]) => (
            <div key={name} className="category-breakdown-item">
              <span className="category-breakdown-name">{name}</span>
              <div className="category-breakdown-bar-wrap">
                <div className="category-breakdown-bar" style={{ width: `${(count / max) * 100}%` }} />
              </div>
              <span className="category-breakdown-count">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────

export default function Dashboard({ allArticles, highImpactArticles, stats, loading }) {
  const articles = allArticles ?? []
  const recentArticles = useMemo(
    () => [...articles].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)).slice(0, 8),
    [articles]
  )

  return (
    <div>
      <DailyBriefing articles={articles} />
      <KPICards stats={stats} articles={articles} />

      <div className="dashboard-grid">
        <div className="dashboard-main">
          {loading ? <SkeletonFeed /> : <HighImpactFeed articles={recentArticles} />}
        </div>
        <div className="dashboard-aside">
          <TrendingTopics articles={articles} />
          <SourceBreakdown articles={articles} />
        </div>
      </div>
    </div>
  )
}

function SkeletonFeed() {
  return (
    <div className="card">
      <div className="card-body">
        {[1,2,3].map((n) => (
          <div key={n} style={{ marginBottom:20 }}>
            <div style={{ height:13, background:'var(--bg-tertiary)', borderRadius:4, marginBottom:8, width:'30%' }} />
            <div style={{ height:17, background:'var(--bg-tertiary)', borderRadius:4, marginBottom:6 }} />
            <div style={{ height:13, background:'var(--bg-tertiary)', borderRadius:4, width:'80%' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
