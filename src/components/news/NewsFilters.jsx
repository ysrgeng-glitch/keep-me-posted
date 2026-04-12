import { CATEGORIES, REGIONS, IMPACT_LEVELS } from '../../data/mockData'

export default function NewsFilters({ filters, onFilterChange, onReset, resultCount }) {
  return (
    <div className="filters-bar">
      <div className="filters-row">
        {/* Impact filter */}
        <div className="filter-group">
          <span className="filter-label">Impact</span>
          <select
            className="filter-select"
            value={filters.impact}
            onChange={(e) => onFilterChange('impact', e.target.value)}
          >
            <option value="ALL">All Levels</option>
            {IMPACT_LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        <div className="filter-divider" />

        {/* Region filter */}
        <div className="filter-group">
          <span className="filter-label">Region</span>
          <select
            className="filter-select"
            value={filters.region}
            onChange={(e) => onFilterChange('region', e.target.value)}
          >
            <option value="ALL">All Regions</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="filter-divider" />

        {/* Category filter */}
        <div className="filter-group">
          <span className="filter-label">Category</span>
          <select
            className="filter-select"
            value={filters.category}
            onChange={(e) => onFilterChange('category', e.target.value)}
            style={{ minWidth: 185 }}
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="filter-divider" />

        {/* Sort */}
        <div className="filter-group">
          <span className="filter-label">Sort</span>
          <select
            className="filter-select"
            value={filters.sortBy}
            onChange={(e) => onFilterChange('sortBy', e.target.value)}
          >
            <option value="date">Latest First</option>
            <option value="impact">Highest Impact</option>
            <option value="confidence">Confidence Score</option>
          </select>
        </div>

        {/* Reset + count */}
        {(filters.impact !== 'ALL' || filters.region !== 'ALL' || filters.category !== 'ALL') && (
          <button className="filter-reset-btn" onClick={onReset}>
            Clear filters
          </button>
        )}

        <div className="filters-results">
          Showing <strong>{resultCount}</strong> {resultCount === 1 ? 'article' : 'articles'}
        </div>
      </div>
    </div>
  )
}
