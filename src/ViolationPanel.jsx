import { useState, useMemo } from 'react'
import SmellDashboard from './SmellDashboard.jsx'
import { getSeverityStyle, getSmellColor, RULE_TITLES } from './smellColors.js'

function formatLineRef(lines) {
  const [start, end] = lines
  if (start === end) return `line ${start}`
  return `lines ${start}–${end}`
}

export default function ViolationPanel({
  violations,
  onViolationClick,
  onRefactor,
  refactoringKey,
  theme = 'dark',
  lineCount = 1,
}) {
  const [ruleFilter, setRuleFilter] = useState(null)
  const [severityFilter, setSeverityFilter] = useState(null)

  // Reset filters if violations list updates (e.g. new scan)
  const lastViolationsLength = useMemo(() => violations.length, [violations])
  useMemo(() => {
    setRuleFilter(null)
    setSeverityFilter(null)
  }, [lastViolationsLength])

  const filteredViolations = useMemo(() => {
    return violations.filter((v) => {
      if (ruleFilter && v.rule !== ruleFilter) return false
      if (severityFilter) {
        const colors = getSmellColor(v.rule)
        if (colors.severity !== severityFilter) return false
      }
      return true
    })
  }, [violations, ruleFilter, severityFilter])

  const count = filteredViolations.length

  return (
    <aside className="violations-panel">
      <div className="violations-header">
        <h2 className="violations-title">Violations</h2>
        <span className="violations-count">{violations.length} found</span>
      </div>

      <SmellDashboard
        violations={violations}
        lineCount={lineCount}
        activeRuleFilter={ruleFilter}
        activeSeverityFilter={severityFilter}
        onSelectRuleFilter={(rule) => {
          setSeverityFilter(null)
          setRuleFilter((prev) => (prev === rule ? null : rule))
        }}
        onSelectSeverityFilter={(sev) => {
          setRuleFilter(null)
          setSeverityFilter((prev) => (prev === sev ? null : sev))
        }}
        theme={theme}
      />

      {(ruleFilter || severityFilter) && (
        <div className="filter-status-bar">
          <span className="filter-status-text">
            Filtered: {count} of {violations.length} shown
          </span>
          <button
            type="button"
            className="clear-filter-btn"
            onClick={() => {
              setRuleFilter(null)
              setSeverityFilter(null)
            }}
          >
            Clear filter
          </button>
        </div>
      )}

      <div className="violations-list">
        {count === 0 ? (
          <p className="no-violations">
            {violations.length > 0
              ? 'No violations matching the active filter'
              : 'Run a scan to detect code smells'}
          </p>
        ) : (
          filteredViolations.map((v, index) => {
            const colors = getSmellColor(v.rule)
            const severity = getSeverityStyle(colors.severity)
            const cardKey = `${v.rule}-${v.lines[0]}-${v.lines[1]}-${index}`
            const isRefactoring = refactoringKey === cardKey

            return (
              <article
                key={cardKey}
                className="violation-card"
                style={{
                  borderColor: severity.cardBorder,
                  borderWidth: severity.cardBorderWidth,
                }}
              >
                <button
                  type="button"
                  className="violation-card-body"
                  onClick={() => onViolationClick(v.lines[0], v.rule)}
                >
                  <div className="violation-card-top">
                    <span className="violation-line-ref">{formatLineRef(v.lines)}</span>
                    <span
                      className="severity-badge"
                      style={{
                        background: severity.badgeBg,
                        color: severity.badgeText,
                      }}
                    >
                      {colors.severity}
                    </span>
                  </div>
                  <h3
                    className="violation-rule-title"
                    style={{ color: theme === 'light' ? '#111827' : colors.text }}
                  >
                    {RULE_TITLES[v.rule] ?? v.rule}
                  </h3>
                  <p className="violation-message">{v.message}</p>
                </button>

                <button
                  type="button"
                  className="refactor-btn"
                  style={
                    theme === 'light'
                      ? {
                          background: colors.pillBg,
                          borderColor: colors.accent,
                          color: colors.accent,
                          borderWidth: '1px',
                        }
                      : {
                          background: severity.refactorBg,
                          borderColor: severity.refactorBorder,
                          color: severity.refactorText,
                          borderWidth: colors.severity === 'HIGH' ? '0' : '1px',
                        }
                  }
                  disabled={isRefactoring}
                  onClick={(event) => {
                    event.stopPropagation()
                    onRefactor?.(v, cardKey)
                  }}
                >
                  {isRefactoring ? 'Refactoring…' : '+ Fix with refactor'}
                </button>
              </article>
            )
          })
        )}
      </div>
    </aside>
  )
}
