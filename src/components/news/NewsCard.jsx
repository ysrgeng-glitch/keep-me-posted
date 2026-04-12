import { useNavigate } from 'react-router-dom'
import ImpactBadge from '../common/ImpactBadge'
import RegionTag from '../common/RegionTag'
import CategoryBadge from '../common/CategoryBadge'
import ConfidenceScore from '../common/ConfidenceScore'
import { formatRelativeTime } from '../../utils/scoring'

function IconSource() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
}
function IconChevronRight() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
}

export default function NewsCard({ article }) {
  const navigate = useNavigate()

  const handleClick = () => navigate(`/news/${article.id}`)
  const handleKeyDown = (e) => { if (e.key === 'Enter') handleClick() }

  return (
    <article
      className={`news-card news-card--${article.impact}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Read full article: ${article.headline}`}
    >
      <div className="news-card-inner">
        {/* Meta row */}
        <div className="news-card-meta">
          <ImpactBadge level={article.impact} />
          <CategoryBadge category={article.category} />
          {article.regions.slice(0, 3).map((r) => (
            <RegionTag key={r} region={r} />
          ))}
        </div>

        {/* Headline */}
        <h3 className="news-card-headline">{article.headline}</h3>

        {/* Summary */}
        <p className="news-card-summary">{article.summary}</p>

        {/* Why it matters */}
        {article.whyItMatters && (
          <div style={{ marginBottom: 12, padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', borderLeft: '2px solid var(--brand-green-400)' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--brand-green-700)', marginBottom: 3, display: 'block' }}>
              Why it matters
            </span>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {article.whyItMatters}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="news-card-footer">
          <div className="news-card-source">
            <IconSource />
            {article.source}
          </div>
          <span className="news-card-date">{formatRelativeTime(article.publishedAt)}</span>
          <ConfidenceScore score={article.confidenceScore} />
          <span className="news-card-read-more">
            Full analysis <IconChevronRight />
          </span>
        </div>
      </div>
    </article>
  )
}
