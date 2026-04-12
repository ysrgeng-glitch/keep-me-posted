import ImpactBadge from '../common/ImpactBadge'

function IconChanges() {
  return <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" /><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" /></svg>
}

export default function WhatChangedToday({ changes }) {
  if (!changes?.length) return null

  return (
    <div className="card">
      <div className="card-header">
        <div className="section-title">
          <IconChanges />
          What Changed Today
        </div>
      </div>
      <div className="card-body">
        <div className="changes-list">
          {changes.map((change, i) => (
            <div key={i} className="change-item">
              <span className={`change-type-badge change-type-badge--${change.type}`}>
                {change.type}
              </span>
              <span className="change-description">{change.description}</span>
              <ImpactBadge level={change.impact} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
