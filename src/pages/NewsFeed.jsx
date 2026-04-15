import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import NewsCard from '../components/news/NewsCard'
import NewsFilters from '../components/news/NewsFilters'

const PAGE_SIZE = 20

export default function NewsFeed({ articles, filters, setFilter, resetFilters, loading }) {
  const [searchParams]     = useSearchParams()
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE)

  // Reset display limit when filters change
  useEffect(() => { setDisplayLimit(PAGE_SIZE) }, [filters])

  // Sync URL params (e.g. ?region=SA) into filters whenever the URL changes
  useEffect(() => {
    const region = searchParams.get('region')
    const impact = searchParams.get('impact')
    setFilter('region', region ?? 'ALL')
    if (impact) setFilter('impact', impact)
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  const visible    = articles.slice(0, displayLimit)
  const hasMore    = articles.length > displayLimit

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header-title">Intelligence Feed</h1>
        <p className="page-header-subtitle">
          Top stories — deduplicated, AI-analysed, ranked by impact
        </p>
      </div>

      <NewsFilters
        filters={filters}
        onFilterChange={setFilter}
        onReset={resetFilters}
        resultCount={articles.length}
        totalCount={articles.length}
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
            style={{ marginTop: 12, padding: '8px 18px', background: 'var(--green-800)', color: 'var(--green-200)', border: '1px solid var(--green-700)', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          <div className="news-feed-grid">
            {visible.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>

          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 24, marginBottom: 8 }}>
              <button
                onClick={() => setDisplayLimit((prev) => prev + PAGE_SIZE)}
                style={{
                  padding: '10px 28px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Load more — {articles.length - displayLimit} remaining
              </button>
            </div>
          )}

          {!hasMore && articles.length > PAGE_SIZE && (
            <div style={{ textAlign: 'center', marginTop: 16, fontSize: '0.8125rem', color: 'var(--text-subtle)' }}>
              All {articles.length} stories shown — refreshes hourly as new intelligence arrives
            </div>
          )}
        </>
      )}
    </div>
  )
}
