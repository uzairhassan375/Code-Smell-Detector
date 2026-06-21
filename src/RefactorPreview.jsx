import Editor from './Editor.jsx'
import { getSmellColor, RULE_TITLES } from './smellColors.js'

function formatLineRef(lines) {
  const [start, end] = lines
  if (start === end) return `line ${start}`
  return `lines ${start}–${end}`
}

export default function RefactorPreview({ refactorState, onClose, theme = 'dark' }) {
  if (!refactorState) return null

  const { violation, status, originalSnippet, refactoredSnippet, error } =
    refactorState
  const colors = getSmellColor(violation.rule)

  return (
    <section
      className="refactor-preview-panel"
      style={
        theme === 'light'
          ? {
              background: colors.pillBg,
              borderColor: colors.accent,
            }
          : undefined
      }
    >
      <div className="refactor-preview-header">
        <div>
          <p className="refactor-preview-label">Refactored preview</p>
          <h3
            className="refactor-preview-title"
            style={{ color: theme === 'light' ? '#111827' : colors.text }}
          >
            {RULE_TITLES[violation.rule] ?? violation.rule}
            <span className="refactor-preview-lines">
              {' '}
              · {formatLineRef(violation.lines)}
            </span>
          </h3>
        </div>
        <button type="button" className="refactor-close-btn" onClick={onClose}>
          Close
        </button>
      </div>

      {status === 'loading' && (
        <div
          className="refactor-status refactor-status-loading"
          aria-busy="true"
          aria-label="Generating refactor"
        >
          <span className="refactor-spinner" aria-hidden="true" />
        </div>
      )}

      {status === 'error' && (
        <div className="refactor-status refactor-status-error">{error}</div>
      )}

      {status === 'done' && (
        <div className="refactor-preview-grid">
          <div className="refactor-preview-column">
            <p className="refactor-column-label">Original snippet</p>
            <Editor
              value={originalSnippet}
              readOnly
              compact
              filename="ORIGINAL.CPP"
              lineRuleMap={new Map()}
              theme={theme}
            />
          </div>
          <div className="refactor-preview-column">
            <p className="refactor-column-label refactor-column-label-fixed">
              Refactored snippet
            </p>
            <Editor
              value={refactoredSnippet}
              readOnly
              compact
              filename="REFACTORED.CPP"
              lineRuleMap={new Map()}
              theme={theme}
            />
          </div>
        </div>
      )}
    </section>
  )
}
