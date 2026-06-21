import { useMemo } from 'react'
import { computeSmellBreakdown } from './smellStats.js'

const SIZE = 140
const RADIUS = 56
const CENTER = SIZE / 2

function polarToCartesian(angleDeg) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: CENTER + RADIUS * Math.cos(angleRad),
    y: CENTER + RADIUS * Math.sin(angleRad),
  }
}

function describeSlice(startAngle, endAngle) {
  if (endAngle - startAngle >= 359.99) {
    return [
      `M ${CENTER} ${CENTER - RADIUS}`,
      `A ${RADIUS} ${RADIUS} 0 1 1 ${CENTER - 0.01} ${CENTER - RADIUS}`,
      'Z',
    ].join(' ')
  }

  const start = polarToCartesian(endAngle)
  const end = polarToCartesian(startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0

  return [
    `M ${CENTER} ${CENTER}`,
    `L ${start.x} ${start.y}`,
    `A ${RADIUS} ${RADIUS} 0 ${largeArc} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ')
}

export default function SmellPieChart({ violations, theme = 'dark' }) {
  const isLight = theme === 'light'
  const sliceStroke = isLight ? '#ECEEF2' : '#0B0D12'
  const centerFill = isLight ? '#FFFFFF' : '#11141B'

  const breakdown = useMemo(
    () => computeSmellBreakdown(violations),
    [violations],
  )

  const slices = useMemo(() => {
    let angle = 0
    return breakdown.map((item) => {
      const sweep = (item.count / violations.length) * 360
      const slice = {
        ...item,
        startAngle: angle,
        endAngle: angle + sweep,
      }
      angle += sweep
      return slice
    })
  }, [breakdown, violations.length])

  if (violations.length === 0) {
    return (
      <div className="smell-chart smell-chart-empty">
        <p className="smell-chart-empty-text">Run a scan to see smell breakdown</p>
      </div>
    )
  }

  return (
    <div className="smell-chart">
      <div className="smell-chart-header">
        <h3 className="smell-chart-title">Smell breakdown</h3>
        <span className="smell-chart-total">{violations.length} total</span>
      </div>

      <div className="smell-chart-body">
        <div className="smell-chart-pie-wrap">
          <svg
            className="smell-chart-pie"
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            role="img"
            aria-label="Code smell percentage chart"
          >
            {slices.map((slice) => (
              <path
                key={slice.rule}
                d={describeSlice(slice.startAngle, slice.endAngle)}
                fill={slice.color}
                stroke={sliceStroke}
                strokeWidth="2"
              />
            ))}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={32}
              fill={centerFill}
            />
            <text
              x={CENTER}
              y={CENTER - 2}
              textAnchor="middle"
              className="smell-chart-center-value"
            >
              {violations.length}
            </text>
            <text
              x={CENTER}
              y={CENTER + 12}
              textAnchor="middle"
              className="smell-chart-center-label"
            >
              smells
            </text>
          </svg>
        </div>

        <ul className="smell-chart-legend">
          {breakdown.map((item) => (
            <li key={item.rule} className="smell-chart-legend-item">
              <span
                className="smell-chart-legend-dot"
                style={{ background: item.color }}
                aria-hidden="true"
              />
              <span className="smell-chart-legend-label">{item.label}</span>
              <span className="smell-chart-legend-pct">{item.percentage}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
