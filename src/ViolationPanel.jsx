import { getSmellColor, RULE_TITLES } from './smellColors.js'

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
}) {
  const count = violations.length

  return (
    <aside className="violations-panel">
      <div className="violations-header">
        <h2 className="violations-title">Violations</h2>
        <span className="violations-count">{count} found</span>
      </div>

      <div className="violations-list">
        {count === 0 ? (
          <p className="no-violations">Run a scan to detect code smells</p>
        ) : (
          violations.map((v, index) => {
            const colors = getSmellColor(v.rule)
            const cardKey = `${v.rule}-${v.lines[0]}-${v.lines[1]}-${index}`
            const isRefactoring = refactoringKey === cardKey

            return (
              <article
                key={cardKey}
                className="violation-card"
                style={{
                  background: colors.bg,
                  borderColor: colors.border,
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
                        background: colors.severityBg,
                        color: colors.severityText,
                      }}
                    >
                      {colors.severity}
                    </span>
                  </div>
                  <h3 className="violation-rule-title" style={{ color: colors.text }}>
                    {RULE_TITLES[v.rule] ?? v.rule}
                  </h3>
                  <p className="violation-message">{v.message}</p>
                </button>

                <button
                  type="button"
                  className="refactor-btn"
                  style={{
                    borderColor: colors.border,
                    color: colors.text,
                  }}
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
