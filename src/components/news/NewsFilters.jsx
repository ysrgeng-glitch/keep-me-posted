import { CATEGORIES, REGIONS, IMPACT_LEVELS } from '../../data/mockData'

const VERIFICATION_OPTIONS = [
  { value: 'ALL',               label: 'All Sources' },
  { value: 'VERIFIED',          label: 'Official Sources Only' },
  { value: 'VERIFIED_OFFICIAL', label: 'Government / MLA' },
  { value: 'ANALYST_INFERENCE', label: 'Trusted Industry Media' },
  { value: 'UNCONFIRMED',       label: 'Unconfirmed' },
]

const TIME_HORIZON_OPTIONS = [
  { value: 'ALL',       label: 'All Horizons' },
  { value: 'IMMEDIATE', label: 'Immediate (0–7d)' },
  { value: '30D',       label: '30 Days' },
  { value: '90D',       label: '90 Days' },
  { value: '6M',        label: '6 Months' },
  { value: '12M',       label: '12 Months' },
]

const isFiltered = (f) =>
  f.impact !== 'ALL' || f.region !== 'ALL' || f.category !== 'ALL' ||
  f.verification !== 'ALL' || f.timeHorizon !== 'ALL' || f.query !== ''

export default function NewsFilters({ filters, onFilterChange, onReset, resultCount, totalCount }) {
  return (
    <div className="filters-bar">
      <div className="filters-row">

        {/* Impact */}
        <div className="filter-group">
          <span className="filter-label">Impact</span>
          <select className="filter-select" value={filters.impact} onChange={(e) => onFilterChange('impact', e.target.value)}>
            <option value="ALL">All Levels</option>
            {IMPACT_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div className="filter-divider" />

        {/* Verification */}
        <div className="filter-group">
          <span className="filter-label">Verification</span>
          <select className="filter-select" value={filters.verification ?? 'ALL'} onChange={(e) => onFilterChange('verification', e.target.value)}>
            {VERIFICATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="filter-divider" />

        {/* Region */}
        <div className="filter-group">
          <span className="filter-label">Region</span>
          <select className="filter-select" value={filters.region} onChange={(e) => onFilterChange('region', e.target.value)}>
            <option value="ALL">All Regions</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="filter-divider" />

        {/* Category */}
        <div className="filter-group">
          <span className="filter-label">Category</span>
          <select className="filter-select" value={filters.category} onChange={(e) => onFilterChange('category', e.target.value)} style={{ minWidth: 185 }}>
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="filter-divider" />

        {/* Time Horizon */}
        <div className="filter-group">
          <span className="filter-label">Horizon</span>
          <select className="filter-select" value={filters.timeHorizon ?? 'ALL'} onChange={(e) => onFilterChange('timeHorizon', e.target.value)}>
            {TIME_HORIZON_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="filter-divider" />

        {/* Sort */}
        <div className="filter-group">
          <span className="filter-label">Sort</span>
          <select className="filter-select" value={filters.sortBy} onChange={(e) => onFilterChange('sortBy', e.target.value)}>
            <option value="priority">Priority (Impact → Date)</option>
            <option value="date">Latest First</option>
            <option value="impact">Highest Impact Score</option>
            <option value="financial">Largest Financial Impact</option>
            <option value="confidence">Confidence Score</option>
          </select>
        </div>

        {isFiltered(filters) && (
          <button className="filter-reset-btn" onClick={onReset}>
            Clear filters
          </button>
        )}

        <div className="filters-results">
          <strong>{resultCount}</strong> {totalCount && totalCount !== resultCount ? `of ${totalCount} ` : ''}stories
        </div>
      </div>
    </div>
  )
}
