import { getSmellColor } from './smellColors.js'

function formatLinePill(lines) {
  const [start, end] = lines
  if (start === end) return `Line ${start}`
  return `Lines ${start}–${end}`
}

export default function ViolationPanel({
  violations,
  activeFilters,
  onViolationClick,
}) {
  const count = violations.length

  return (
    <aside className="violations-panel">
      <h2 className="panel-label">Violations — {count} found</h2>

      <div className="violations-list">
        {count === 0 ? (
          <p className="no-violations">No violations found</p>
        ) : (
          violations.map((v, index) => {
            const colors = getSmellColor(v.rule)
            return (
              <button
                key={`${v.rule}-${v.lines[0]}-${index}`}
                type="button"
                className="violation-card"
                style={{
                  background: colors.bg,
                  borderColor: colors.border,
                }}
                onClick={() => onViolationClick(v.lines[0], v.rule)}
              >
                <span
                  className="line-pill"
                  style={{
                    background: colors.pillBg,
                    color: colors.pillText,
                  }}
                >
                  {formatLinePill(v.lines)}
                </span>
                <span className="rule-name" style={{ color: colors.text }}>
                  {v.rule}
                </span>
                <p
                  className="violation-message"
                  style={{ color: colors.message }}
                >
                  {v.message}
                </p>
              </button>
            )
          })
        )}
      </div>

      <div className="violations-summary">
        <span className="summary-filters">
          {activeFilters.length > 0
            ? activeFilters.join(' · ')
            : 'No filters'}
        </span>
        <span className="summary-count">{count} total</span>
      </div>
    </aside>
  )
}
