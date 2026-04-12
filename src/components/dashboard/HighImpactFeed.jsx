import { useNavigate } from 'react-router-dom'
import ImpactBadge from '../common/ImpactBadge'
import RegionTag from '../common/RegionTag'
import { formatRelativeTime } from '../../utils/scoring'

function IconFire() {
  return <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>
}
function IconChevronRight() {
  return <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
}

export default function HighImpactFeed({ articles, maxItems = 6 }) {
  const navigate = useNavigate()
  const items = articles?.slice(0, maxItems) ?? []

  return (
    <div className="card">
      <div className="card-header">
        <div className="section-header" style={{ marginBottom: 0 }}>
          <div className="section-title">
            <IconFire />
            High Impact Feed
          </div>
          <button
            className="section-link"
            onClick={() => navigate('/news?impact=HIGH')}
            style={{ cursor: 'pointer', background: 'none', border: 'none' }}
          >
            View all <IconChevronRight />
          </button>
        </div>
      </div>
      <div className="card-body">
        <div className="high-impact-list">
          {items.map((article) => (
            <div
              key={article.id}
              className="high-impact-item"
              onClick={() => navigate(`/news/${article.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/news/${article.id}`)}
            >
              <div className={`high-impact-indicator high-impact-indicator--${article.impact}`} />
              <div className="high-impact-body">
                <div className="high-impact-headline">{article.headline}</div>
                <div className="high-impact-excerpt">{article.summary}</div>
                <div className="high-impact-foot">
                  <ImpactBadge level={article.impact} />
                  {article.regions.slice(0, 2).map((r) => (
                    <RegionTag key={r} region={r} />
                  ))}
                  <span className="high-impact-source">{article.source}</span>
                  <span className="high-impact-source" style={{ marginLeft: 'auto' }}>
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
