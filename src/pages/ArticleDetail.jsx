import { useParams, useNavigate } from 'react-router-dom'
import ImpactBadge from '../components/common/ImpactBadge'

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
import RegionTag from '../components/common/RegionTag'
import CategoryBadge from '../components/common/CategoryBadge'
import ConfidenceScore from '../components/common/ConfidenceScore'
import VerificationBadge from '../components/common/VerificationBadge'
import FinancialImpact from '../components/common/FinancialImpact'
import TimeHorizon from '../components/common/TimeHorizon'
import { formatDate, formatRelativeTime } from '../utils/scoring'

function IconBack() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
}
function IconLink() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
}
function IconShortTerm() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
}
function IconMedTerm() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
}
function IconStrategy() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
}

export default function ArticleDetail({ getArticle }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const article = getArticle(id)

  const effectiveVerification = (() => {
    if (!article) return 'UNCONFIRMED'
    const status = article.verificationStatus
    const src    = article.source
    if (status === 'UNCONFIRMED' && KNOWN_OFFICIAL_SOURCES.has(src))  return 'VERIFIED_OFFICIAL'
    if (status === 'UNCONFIRMED' && KNOWN_TRUSTED_SOURCES.has(src))   return 'ANALYST_INFERENCE'
    return status
  })()

  if (!article) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 12 }}>Article not found</h2>
        <button className="article-back-btn" onClick={() => navigate('/news')}>
          <IconBack /> Back to News Feed
        </button>
      </div>
    )
  }

  return (
    <div className="article-detail-wrap">

      {/* Back */}
      <button className="article-back-btn" onClick={() => navigate(-1)}>
        <IconBack /> Back
      </button>

      {/* ── Article header ──────────────────────────────────────── */}
      <div className="article-header">

        {/* Tier 1: Impact + Verification + Time Horizon */}
        <div className="article-meta-row">
          <ImpactBadge level={article.impact} />
          <VerificationBadge status={effectiveVerification} />
          <TimeHorizon horizon={article.timeHorizon} />
        </div>

        {/* Tier 2: Category + Regions + Confidence */}
        <div className="article-meta-row" style={{ marginTop: 6 }}>
          <CategoryBadge category={article.category} />
          {(article.regions ?? []).map((r) => <RegionTag key={r} region={r} />)}
          <ConfidenceScore score={article.confidenceScore} />
        </div>

        {/* Headline */}
        <h1 className="article-headline">{article.headline}</h1>

        {/* Summary */}
        <p className="article-summary">{article.summary}</p>

        {/* Financial Impact — prominent display */}
        {article.financialImpactLabel && (
          <FinancialImpact
            label={article.financialImpactLabel}
            low={article.financialImpactLow}
            high={article.financialImpactHigh}
          />
        )}

        {/* Why it matters */}
        <div className="article-why-matters">
          <div className="article-why-matters-label">Why this matters</div>
          <p className="article-why-matters-text">{article.whyItMatters}</p>
        </div>

        {/* Source bar */}
        <div className="article-source-bar">
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="article-source-link"
            onClick={(e) => e.stopPropagation()}
          >
            <IconLink />
            {article.source} — View source
          </a>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Published {formatDate(article.publishedAt)} · {formatRelativeTime(article.publishedAt)}
          </span>
        </div>
      </div>

      {/* ── Impact analysis ─────────────────────────────────────── */}
      <div className="article-analysis-grid">
        <div className="analysis-card">
          <div className="analysis-card-label analysis-card-label--short">
            <IconShortTerm />
            Short-Term Impact (0–60 days)
          </div>
          <p className="analysis-card-text">{article.shortTermImpact}</p>
        </div>
        <div className="analysis-card">
          <div className="analysis-card-label analysis-card-label--medium">
            <IconMedTerm />
            Medium-Term Impact (60–180 days)
          </div>
          <p className="analysis-card-text">{article.mediumTermImpact}</p>
        </div>
      </div>

      {/* ── Strategic recommendation ─────────────────────────────── */}
      <div className="strategy-card">
        <div className="strategy-card-label">
          <IconStrategy />
          Strategic Recommendation
        </div>
        <p className="strategy-card-text">{article.strategicRecommendation}</p>
      </div>

      {/* ── Tags ────────────────────────────────────────────────── */}
      {article.tags?.length > 0 && (
        <div className="analysis-card">
          <div className="analysis-card-label" style={{ color: 'var(--text-muted)' }}>
            Topics &amp; Tags
          </div>
          <div className="tags-wrap">
            {article.tags.map((tag) => (
              <span key={tag} className="tag-pill">#{tag}</span>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
