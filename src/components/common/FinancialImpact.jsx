/**
 * Displays the estimated AUD financial impact for an intelligence item.
 * Shows nothing when no financial data is available.
 */
export default function FinancialImpact({ label, low, high, compact = false }) {
  if (!label && (low == null || high == null)) return null

  // Determine direction from label text
  const isUpside = label
    ? /upside|opportunit|saving|benefit|revenue/i.test(label)
    : false
  const isRisk   = label
    ? /risk|exposure|cost|loss|impact/i.test(label)
    : true

  const color  = isUpside ? '#15803d' : isRisk ? '#b91c1c' : '#92400e'
  const bg     = isUpside ? '#dcfce7' : isRisk ? '#fee2e2' : '#fef3c7'
  const prefix = isUpside ? '▲' : isRisk ? '▼' : '◆'

  if (compact) {
    return (
      <span
        className="financial-impact financial-impact--compact"
        style={{ color, background: bg }}
        title={label ?? undefined}
      >
        {prefix} {label ?? `$${(low/1e6).toFixed(1)}M–$${(high/1e6).toFixed(1)}M`}
      </span>
    )
  }

  return (
    <div className="financial-impact-box" style={{ borderLeftColor: color }}>
      <div className="financial-impact-label" style={{ color }}>
        {prefix} Estimated Financial Impact
      </div>
      <div className="financial-impact-value" style={{ color }}>
        {label ?? `$${(low/1e6).toFixed(1)}M–$${(high/1e6).toFixed(1)}M`}
      </div>
    </div>
  )
}
