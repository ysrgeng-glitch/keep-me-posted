import { useNavigate } from 'react-router-dom'
import ImpactBadge from '../common/ImpactBadge'
import RegionTag from '../common/RegionTag'
import VerificationBadge from '../common/VerificationBadge'
import TimeHorizon from '../common/TimeHorizon'
import ConfidenceScore from '../common/ConfidenceScore'
import { formatRelativeTime } from '../../utils/scoring'

// Sources we know are trusted — if DB says UNCONFIRMED for these, override to ANALYST_INFERENCE
const KNOWN_TRUSTED_SOURCES = new Set([
  'Beef Central', 'Sheep Central', 'MLA News', 'Stock Journal', 'The Land',
  'Farm Online', 'ABC Rural', 'ABC News AU', 'ABC News', 'Grain Central',
  'Weekly Times', 'The Cattle Site', 'Drovers', 'Global Meat News',
  'Beef Magazine', 'AHDB Beef & Lamb', 'USDA AMS Livestock', 'Reuters Trade',
  'Reuters', 'Bloomberg', 'AP', 'AAP', 'The Guardian', 'AgWeb',
  'Australian Financial Review', 'The Australian', 'SBS News',
])

const KNOWN_OFFICIAL_SOURCES = new Set([
  'MLA News', 'ABARES', 'ABS', 'BOM', 'DAFF', 'Australian Government',
  'Department of Agriculture', 'USDA AMS Livestock', 'AHDB Beef & Lamb',
])

function IconExternalLink() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

function IconArrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function ImpactArrow({ label }) {
  if (!label) return null
  const isUpside = /upside|opportunit|saving|benefit|revenue/i.test(label)
  const isRisk   = /risk|exposure|cost|loss/i.test(label)
  const color    = isUpside ? 'var(--color-positive)' : isRisk ? 'var(--color-negative)' : 'var(--color-warning)'
  const bg       = isUpside ? '#f0fdf4' : isRisk ? '#fff5f5' : '#fffbeb'
  const symbol   = isUpside ? '▲' : isRisk ? '▼' : '◆'

  return (
    <span className="nc-financial" style={{ color, background: bg }}>
      {symbol} {label}
    </span>
  )
}

export default function NewsCard({ article }) {
  const navigate    = useNavigate()
  const isGlobal    = (article.regions ?? []).includes('Global') &&
                      !(article.regions ?? []).some(r => ['SA','VIC','NSW','TAS','National'].includes(r))

  // Override UNCONFIRMED for sources we know are trustworthy
  const effectiveVerification = (() => {
    const status = article.verificationStatus
    const src    = article.source
    if (status === 'UNCONFIRMED' && KNOWN_OFFICIAL_SOURCES.has(src))  return 'VERIFIED_OFFICIAL'
    if (status === 'UNCONFIRMED' && KNOWN_TRUSTED_SOURCES.has(src))   return 'ANALYST_INFERENCE'
    return status
  })()

  const handleClick   = () => navigate(`/news/${article.id}`)
  const handleKeyDown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() } }

  return (
    <article
      className={`nc nc--${article.impact}${isGlobal ? ' nc--global' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Read full article: ${article.headline}`}
    >
      {/* ── Top bar: impact + horizon + verification ─── */}
      <div className="nc-topbar">
        <div className="nc-topbar-left">
          <ImpactBadge level={article.impact} />
          <TimeHorizon horizon={article.timeHorizon} compact />
          {isGlobal && <span className="nc-global-tag">Global</span>}
        </div>
        <VerificationBadge status={effectiveVerification} compact />
      </div>

      {/* ── Category + Regions ─── */}
      <div className="nc-taxonomy">
        <span className="nc-category">{article.category}</span>
        {(article.regions ?? [])
          .filter(r => r !== 'Global' || !isGlobal)
          .slice(0, 3)
          .map(r => <RegionTag key={r} region={r} />)}
      </div>

      {/* ── Headline ─── */}
      <h3 className="nc-headline">{article.headline}</h3>

      {/* ── Summary ─── */}
      <p className="nc-summary">{article.summary}</p>

      {/* ── Financial impact (when present) ─── */}
      {article.financialImpactLabel && (
        <ImpactArrow label={article.financialImpactLabel} />
      )}

      {/* ── Why it matters ─── */}
      {article.whyItMatters && (
        <div className="nc-why">
          <span className="nc-why-label">Why it matters</span>
          <p className="nc-why-text">{article.whyItMatters}</p>
        </div>
      )}

      {/* ── Footer ─── */}
      <div className="nc-footer">
        <span className="nc-source">
          <IconExternalLink />
          {article.source}
        </span>
        <span className="nc-date">{formatRelativeTime(article.publishedAt)}</span>
        <ConfidenceScore score={article.confidenceScore} />
        <span className="nc-cta">
          Full analysis <IconArrow />
        </span>
      </div>
    </article>
  )
}
