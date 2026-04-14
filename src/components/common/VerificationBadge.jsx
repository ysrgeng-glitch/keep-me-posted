import { VERIFICATION_LABELS } from '../../utils/scoring'

export default function VerificationBadge({ status, compact = false }) {
  // Don't show a badge for unconfirmed items — only display verified/analyst status
  if (!status || status === 'UNCONFIRMED') return null

  const meta = VERIFICATION_LABELS[status] ?? VERIFICATION_LABELS.UNCONFIRMED

  if (compact) {
    return (
      <span
        className="verification-badge verification-badge--compact"
        style={{ color: meta.color, background: meta.bg }}
        title={meta.label}
      >
        {meta.icon} {meta.short}
      </span>
    )
  }

  return (
    <span
      className="verification-badge"
      style={{ color: meta.color, background: meta.bg, borderColor: meta.color + '33' }}
    >
      <span className="verification-badge-icon">{meta.icon}</span>
      {meta.label}
    </span>
  )
}
