// Impact level badge — HIGH / MEDIUM / LOW

export default function ImpactBadge({ level, size = 'sm' }) {
  if (!level) return null
  return (
    <span className={`impact-badge impact-badge--${level}`}>
      <span className="impact-badge--dot" />
      {level}
    </span>
  )
}
