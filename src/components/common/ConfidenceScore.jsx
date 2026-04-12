// Confidence score bar — shows source reliability as a progress bar

export default function ConfidenceScore({ score }) {
  if (score == null) return null

  const tier = score >= 85 ? 'high' : score >= 65 ? 'mid' : 'low'

  return (
    <span className="confidence-score">
      <span className="confidence-bar-wrap">
        <span
          className={`confidence-bar-fill confidence-bar-fill--${tier}`}
          style={{ width: `${score}%` }}
        />
      </span>
      {score}% confidence
    </span>
  )
}
