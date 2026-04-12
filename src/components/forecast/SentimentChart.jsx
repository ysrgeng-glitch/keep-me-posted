import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  const isPositive = val >= 0

  return (
    <div style={{
      background: 'var(--bg-primary)', border: '1px solid var(--border-medium)',
      borderRadius: 'var(--radius-md)', padding: '10px 14px', boxShadow: 'var(--shadow-md)',
      fontSize: '0.8125rem',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>{label}</div>
      <div style={{ color: isPositive ? 'var(--color-positive)' : 'var(--color-negative)', fontWeight: 600 }}>
        Sentiment: {val > 0 ? '+' : ''}{(val * 100).toFixed(0)}%
      </div>
    </div>
  )
}

export default function SentimentChart({ data }) {
  const latestScore = data?.[data.length - 1]?.score ?? 0
  const isPositive = latestScore >= 0

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="sentimentGradPos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#059669" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#059669" stopOpacity={0.03} />
          </linearGradient>
          <linearGradient id="sentimentGradNeg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dc2626" stopOpacity={0.03} />
            <stop offset="100%" stopColor="#dc2626" stopOpacity={0.25} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />

        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: 'var(--text-subtle)', fontFamily: 'var(--font-body)' }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--text-subtle)', fontFamily: 'var(--font-body)' }}
          axisLine={false} tickLine={false}
          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
          domain={[-1, 1]}
          width={42}
        />

        <Tooltip content={<CustomTooltip />} />

        <ReferenceLine
          y={0}
          stroke="var(--border-medium)"
          strokeWidth={1.5}
          label={{ value: 'Neutral', position: 'right', fontSize: 10, fill: 'var(--text-subtle)', fontFamily: 'var(--font-body)' }}
        />

        <Area
          dataKey="score"
          stroke={isPositive ? '#059669' : '#dc2626'}
          strokeWidth={2}
          fill={isPositive ? 'url(#sentimentGradPos)' : 'url(#sentimentGradNeg)'}
          dot={{ r: 3.5, fill: isPositive ? '#059669' : '#dc2626', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
          name="Sentiment"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
