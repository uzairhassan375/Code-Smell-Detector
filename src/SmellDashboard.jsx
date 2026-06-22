import { useMemo, useState } from 'react'
import { computeSmellBreakdown } from './smellStats.js'
import { getSmellColor, getSeverityStyle } from './smellColors.js'

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

export default function SmellDashboard({
  violations = [],
  lineCount = 1,
  activeRuleFilter = null,
  activeSeverityFilter = null,
  onSelectRuleFilter = () => {},
  onSelectSeverityFilter = () => {},
  theme = 'dark',
}) {
  const [activeTab, setActiveTab] = useState('breakdown') // 'breakdown' | 'severity' | 'health'
  const [hoveredSlice, setHoveredSlice] = useState(null)

  const isLight = theme === 'light'
  const sliceStroke = isLight ? '#ECEEF2' : '#0B0D12'
  const centerFill = isLight ? '#FFFFFF' : '#11141B'

  // 1. Breakdown Data (Donut Chart)
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

  // 2. Severity Data
  const severityCounts = useMemo(() => {
    const counts = { HIGH: 0, MEDIUM: 0, LOW: 0 }
    violations.forEach((v) => {
      const colorInfo = getSmellColor(v.rule)
      const sev = colorInfo.severity || 'LOW'
      if (counts[sev] !== undefined) {
        counts[sev]++
      }
    })
    return counts
  }, [violations])

  // 3. Code Health Score calculation
  const healthScoreInfo = useMemo(() => {
    if (violations.length === 0) {
      return { score: 100, label: 'Excellent', color: '#10B981' }
    }
    const high = severityCounts.HIGH
    const medium = severityCounts.MEDIUM
    const low = severityCounts.LOW

    // Technical Debt Penalty Score
    const penalty = high * 25 + medium * 12 + low * 6
    const lines = Math.max(lineCount, 15)
    const density = penalty / lines
    const score = Math.max(0, Math.min(100, Math.round(100 - density * 100)))

    let label = 'Excellent'
    let color = '#10B981' // Green
    if (score < 50) {
      label = 'Poor'
      color = '#EF4444' // Red
    } else if (score < 80) {
      label = 'Fair'
      color = '#F59E0B' // Amber
    } else if (score < 95) {
      label = 'Good'
      color = '#3B82F6' // Blue
    }

    return { score, label, color }
  }, [severityCounts, lineCount, violations.length])

  if (violations.length === 0) {
    return (
      <div className="smell-chart smell-chart-empty">
        <p className="smell-chart-empty-text">Run a scan to see dashboard analytics</p>
      </div>
    )
  }

  return (
    <div className="smell-chart">
      {/* Segmented Control Switcher */}
      <div className="dashboard-tabs">
        <button
          type="button"
          className={`dashboard-tab-btn ${activeTab === 'breakdown' ? 'active' : ''}`}
          onClick={() => setActiveTab('breakdown')}
        >
          Breakdown
        </button>
        <button
          type="button"
          className={`dashboard-tab-btn ${activeTab === 'severity' ? 'active' : ''}`}
          onClick={() => setActiveTab('severity')}
        >
          Severity
        </button>
        <button
          type="button"
          className={`dashboard-tab-btn ${activeTab === 'health' ? 'active' : ''}`}
          onClick={() => setActiveTab('health')}
        >
          Health
        </button>
      </div>

      <div className="dashboard-content">
        {/* Tab 1: Donut Breakdown */}
        {activeTab === 'breakdown' && (
          <div className="smell-chart-body">
            <div className="smell-chart-pie-wrap">
              <svg
                className="smell-chart-pie"
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                role="img"
                aria-label="Code smell donut chart"
              >
                {slices.map((slice) => {
                  const isHovered = hoveredSlice === slice.rule
                  const isFiltered = activeRuleFilter === slice.rule
                  return (
                    <path
                      key={slice.rule}
                      d={describeSlice(slice.startAngle, slice.endAngle)}
                      fill={slice.color}
                      stroke={isFiltered ? '#FFFFFF' : sliceStroke}
                      strokeWidth={isFiltered ? '3' : '2'}
                      style={{
                        cursor: 'pointer',
                        transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                        transformOrigin: `${CENTER}px ${CENTER}px`,
                        transition: 'transform 0.2s ease, stroke-width 0.2s ease',
                        opacity: activeRuleFilter && !isFiltered ? 0.4 : 1,
                      }}
                      onMouseEnter={() => setHoveredSlice(slice.rule)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      onClick={() => onSelectRuleFilter(slice.rule)}
                    />
                  )
                })}
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={42}
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
              {breakdown.map((item) => {
                const isFiltered = activeRuleFilter === item.rule
                return (
                  <li
                    key={item.rule}
                    className={`smell-chart-legend-item ${activeRuleFilter && !isFiltered ? 'muted' : ''} ${isFiltered ? 'active-filter' : ''}`}
                    onClick={() => onSelectRuleFilter(item.rule)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span
                      className="smell-chart-legend-dot"
                      style={{
                        background: item.color,
                        boxShadow: isFiltered ? `0 0 6px ${item.color}` : 'none',
                      }}
                      aria-hidden="true"
                    />
                    <span className="smell-chart-legend-label">{item.label}</span>
                    <span className="smell-chart-legend-pct">{item.count}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* Tab 2: Severity Bar Chart */}
        {activeTab === 'severity' && (
          <div className="severity-chart-body">
            {['HIGH', 'MEDIUM', 'LOW'].map((sev) => {
              const count = severityCounts[sev]
              const total = violations.length
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              const isFiltered = activeSeverityFilter === sev
              
              // Colors matching the design tokens
              let barColor = '#3B82F6'
              if (sev === 'HIGH') barColor = '#EF4444'
              if (sev === 'MEDIUM') barColor = '#F59E0B'

              return (
                <div
                  key={sev}
                  className={`severity-bar-row ${activeSeverityFilter && !isFiltered ? 'muted' : ''} ${isFiltered ? 'active-filter' : ''}`}
                  onClick={() => onSelectSeverityFilter(sev)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="severity-bar-label-group">
                    <span className="severity-bar-label">{sev}</span>
                    <span className="severity-bar-value">{count} ({pct}%)</span>
                  </div>
                  <div className="severity-bar-track">
                    <div
                      className="severity-bar-fill"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: barColor,
                        boxShadow: isFiltered ? `0 0 8px ${barColor}` : 'none',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Tab 3: Health Score Gauge */}
        {activeTab === 'health' && (
          <div className="health-chart-body">
            <div className="health-gauge-wrap">
              <svg width="150" height="85" viewBox="0 0 150 85" className="health-gauge-svg">
                {/* Background arc */}
                <path
                  d="M 15 75 A 55 55 0 0 1 135 75"
                  fill="none"
                  stroke={isLight ? '#E5E7EB' : '#1F2937'}
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                {/* Colored arc */}
                <path
                  d="M 15 75 A 55 55 0 0 1 135 75"
                  fill="none"
                  stroke={healthScoreInfo.color}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={Math.PI * 55}
                  strokeDashoffset={Math.PI * 55 * (1 - healthScoreInfo.score / 100)}
                  style={{
                    transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.3s ease',
                  }}
                />
                <text
                  x="75"
                  y="65"
                  textAnchor="middle"
                  className="health-score-value"
                  style={{ fill: isLight ? '#111827' : '#FFFFFF', fontWeight: '800', fontSize: '22px' }}
                >
                  {healthScoreInfo.score}%
                </text>
              </svg>
              <div className="health-score-label" style={{ color: healthScoreInfo.color }}>
                {healthScoreInfo.label}
              </div>
              <p className="health-score-description">
                Quality rating based on issue density per line of code.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
