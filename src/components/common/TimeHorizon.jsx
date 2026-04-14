import { TIME_HORIZON_LABELS } from '../../utils/scoring'

export default function TimeHorizon({ horizon, compact = false }) {
  const meta = TIME_HORIZON_LABELS[horizon] ?? TIME_HORIZON_LABELS['90D']

  if (compact) {
    return (
      <span
        className="time-horizon-badge time-horizon-badge--compact"
        style={{ color: meta.color, background: meta.bg }}
        title={`Time horizon: ${meta.label}`}
      >
        ⏱ {meta.short}
      </span>
    )
  }

  return (
    <span
      className="time-horizon-badge"
      style={{ color: meta.color, background: meta.bg, borderColor: meta.color + '33' }}
    >
      <span className="time-horizon-icon">⏱</span>
      {meta.label}
    </span>
  )
}
