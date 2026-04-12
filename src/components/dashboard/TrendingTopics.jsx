function ArrowUp() {
  return <svg className="trending-arrow trending-arrow--up" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>
}
function ArrowDown() {
  return <svg className="trending-arrow trending-arrow--down" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>
}
function ArrowRight() {
  return <svg className="trending-arrow trending-arrow--stable" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
}
function IconTrend() {
  return <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
}

export default function TrendingTopics({ topics }) {
  if (!topics?.length) return null

  return (
    <div className="card">
      <div className="card-header">
        <div className="section-title">
          <IconTrend />
          Trending Topics
        </div>
      </div>
      <div className="card-body">
        <div className="trending-list">
          {topics.map((item, i) => {
            const sentimentPct = Math.round(Math.abs(item.sentiment) * 100)
            const isPositive = item.sentiment >= 0
            return (
              <div key={item.topic} className="trending-item">
                <span className="trending-rank">{i + 1}</span>
                <span className="trending-topic-name">{item.topic}</span>
                <div
                  className="trending-sentiment"
                  title={`Sentiment: ${isPositive ? '+' : '-'}${sentimentPct}%`}
                >
                  <div
                    className="trending-sentiment-fill"
                    style={{
                      width: `${sentimentPct}%`,
                      background: isPositive ? 'var(--color-positive)' : 'var(--color-negative)',
                    }}
                  />
                </div>
                <span className="trending-count">{item.count}</span>
                {item.trend === 'up' && <ArrowUp />}
                {item.trend === 'down' && <ArrowDown />}
                {item.trend === 'stable' && <ArrowRight />}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
