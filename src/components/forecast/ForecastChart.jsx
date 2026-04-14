import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'

// Custom tooltip
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div style={{
      background: 'var(--bg-primary)', border: '1px solid var(--border-medium)',
      borderRadius: 'var(--radius-md)', padding: '10px 14px', boxShadow: 'var(--shadow-md)',
      fontSize: '0.8125rem',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>{label}</div>
      {payload.map((entry) => {
        if (entry.value == null) return null
        return (
          <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: entry.color, display: 'inline-block' }} />
            <span style={{ color: 'var(--text-secondary)' }}>{entry.name}:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {typeof entry.value === 'number' ? `$${entry.value.toFixed(2)}/kg` : entry.value}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function ForecastChart({ data, title, color = '#2d8653' }) {
  const todayIndex = data.findIndex((d) => d.actual != null && data[data.indexOf(d) + 1]?.actual == null)

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 5, right: 12, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.18} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />

        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: 'var(--text-subtle)', fontFamily: 'var(--font-body)' }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--text-subtle)', fontFamily: 'var(--font-body)' }}
          axisLine={false} tickLine={false}
          tickFormatter={(v) => `$${v.toFixed(2)}`}
          width={52}
          domain={['auto', 'auto']}
        />

        <Tooltip content={<CustomTooltip />} />

        {/* Forecast confidence band */}
        <Area
          dataKey="upper"
          stroke="transparent"
          fill={`url(#grad-${color.replace('#', '')})`}
          fillOpacity={1}
          name="Upper range"
          legendType="none"
          dot={false}
          activeDot={false}
          connectNulls={false}
        />
        <Area
          dataKey="lower"
          stroke="transparent"
          fill="var(--bg-primary)"
          fillOpacity={1}
          name="Lower range"
          legendType="none"
          dot={false}
          activeDot={false}
          connectNulls={false}
        />

        {/* Actuals */}
        <Line
          dataKey="actual"
          stroke={color}
          strokeWidth={2.5}
          dot={{ r: 3.5, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: color }}
          name="Actual"
          connectNulls={false}
        />

        {/* Forecast */}
        <Line
          dataKey="forecast"
          stroke={color}
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={{ r: 3, fill: 'var(--bg-primary)', stroke: color, strokeWidth: 2 }}
          activeDot={{ r: 4, fill: color }}
          name="Forecast"
          connectNulls={false}
        />

        {/* Today reference */}
        {todayIndex >= 0 && (
          <ReferenceLine
            x={data[todayIndex].month}
            stroke="var(--text-subtle)"
            strokeDasharray="3 3"
            label={{ value: 'Today', position: 'top', fontSize: 10, fill: 'var(--text-subtle)', fontFamily: 'var(--font-body)' }}
          />
        )}

        <Legend
          wrapperStyle={{ fontSize: '0.75rem', fontFamily: 'var(--font-body)', paddingTop: 8 }}
          iconType="plainline"
          iconSize={16}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
