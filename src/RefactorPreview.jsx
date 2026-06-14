import Editor from './Editor.jsx'
import { getSmellColor, RULE_TITLES } from './smellColors.js'

function formatLineRef(lines) {
  const [start, end] = lines
  if (start === end) return `line ${start}`
  return `lines ${start}–${end}`
}

export default function RefactorPreview({ refactorState, onClose }) {
  if (!refactorState) return null

  const { violation, status, originalSnippet, refactoredSnippet, error } =
    refactorState
  const colors = getSmellColor(violation.rule)

  return (
    <section className="refactor-preview-panel">
      <div className="refactor-preview-header">
        <div>
          <p className="refactor-preview-label">Refactored preview</p>
          <h3 className="refactor-preview-title" style={{ color: colors.text }}>
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

      <p className="refactor-preview-note">
        Original source is unchanged. This preview shows a Groq-suggested fix
        for the selected smell only.
      </p>

      {status === 'loading' && (
        <div className="refactor-status refactor-status-loading">
          <span className="refactor-spinner" aria-hidden="true" />
          Generating refactor with Groq…
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
            />
          </div>
        </div>
      )}
    </section>
  )
}
