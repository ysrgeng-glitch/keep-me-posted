import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import NewsCard from '../components/news/NewsCard'
import NewsFilters from '../components/news/NewsFilters'

export default function NewsFeed({ articles, filters, setFilter, resetFilters, loading }) {
  const [searchParams] = useSearchParams()

  // Sync URL params (e.g. ?region=SA) into filters on mount
  useEffect(() => {
    const region = searchParams.get('region')
    const impact = searchParams.get('impact')
    if (region) setFilter('region', region)
    if (impact) setFilter('impact', impact)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header-title">News Feed</h1>
        <p className="page-header-subtitle">
          AI-analysed news for AU Beef & Lamb — ranked by business impact
        </p>
      </div>

      <NewsFilters
        filters={filters}
        onFilterChange={setFilter}
        onReset={resetFilters}
        resultCount={articles.length}
      />

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Loading news intelligence…
        </div>
      ) : articles.length === 0 ? (
        <div className="news-feed-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <h3>No articles match your filters</h3>
          <p>Try adjusting the region, category, or impact level filters.</p>
          <button
            onClick={resetFilters}
            style={{ marginTop: 12, padding: '8px 18px', background: 'var(--brand-green-800)', color: 'var(--brand-green-400)', border: '1px solid var(--brand-green-700)', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="news-feed-grid">
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  )
}
