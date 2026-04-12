import { formatDate } from '../../utils/scoring'

function IconBriefing() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
}

export default function DailySummary({ summary }) {
  if (!summary) return null

  return (
    <div className="daily-summary">
      <div className="daily-summary-label">
        <IconBriefing />
        AI Daily Briefing — {formatDate(summary.date)}
      </div>

      <h2 className="daily-summary-headline">{summary.headline}</h2>
      <p className="daily-summary-body">{summary.body}</p>

      <div className="daily-summary-themes">
        {summary.keyThemes.map((theme) => (
          <span key={theme} className="daily-summary-theme">{theme}</span>
        ))}
      </div>

      <div className={`daily-summary-outlook daily-summary-outlook--${summary.overallOutlook}`}>
        Outlook: {summary.overallOutlook}
      </div>
    </div>
  )
}
