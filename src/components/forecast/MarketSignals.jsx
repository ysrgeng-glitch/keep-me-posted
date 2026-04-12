function IconUp() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>
}
function IconDown() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>
}

export default function MarketSignals({ signals }) {
  if (!signals?.length) return null

  return (
    <div className="market-signals-grid">
      {signals.map((signal) => (
        <div key={signal.label} className="market-signal-card">
          <div className="market-signal-label">{signal.label}</div>
          <div className="market-signal-value">{signal.value}</div>
          <div className={`market-signal-change market-signal-change--${signal.direction}`}>
            {signal.direction === 'up' ? <IconUp /> : <IconDown />}
            {signal.change}
            <span style={{ fontWeight: 400, color: 'var(--text-subtle)', fontSize: '0.75rem', marginLeft: 4 }}>
              {signal.note}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
