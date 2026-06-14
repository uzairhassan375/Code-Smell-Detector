import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { cpp } from '@codemirror/lang-cpp'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView, Decoration, ViewPlugin } from '@codemirror/view'
import { RangeSetBuilder, StateEffect, StateField } from '@codemirror/state'
import { getSmellColor } from './smellColors.js'

const setFlashLine = StateEffect.define()

function flashLineDecoration(rule) {
  const id = getSmellColor(rule).id
  return Decoration.line({ class: `cm-flash-line cm-flash-${id}` })
}

const flashField = StateField.define({
  create() {
    return Decoration.none
  },
  update(deco, tr) {
    deco = deco.map(tr.changes)
    for (const effect of tr.effects) {
      if (effect.is(setFlashLine)) {
        if (effect.value == null) return Decoration.none
        const { line, rule } = effect.value
        const docLine = tr.state.doc.line(line)
        return Decoration.set([flashLineDecoration(rule).range(docLine.from)])
      }
    }
    return deco
  },
  provide: (f) => EditorView.decorations.from(f),
})

function violationLineDecoration(rule) {
  const id = getSmellColor(rule).id
  return Decoration.line({ class: `cm-violation-line cm-violation-${id}` })
}

function buildViolationDecorations(state, lineRuleMap) {
  const builder = new RangeSetBuilder()
  const entries = [...lineRuleMap.entries()].sort((a, b) => a[0] - b[0])

  for (const [lineNum, rule] of entries) {
    if (lineNum < 1 || lineNum > state.doc.lines) continue
    const line = state.doc.line(lineNum)
    builder.add(line.from, line.from, violationLineDecoration(rule))
  }
  return builder.finish()
}

function violationHighlightExtension(lineRuleMap) {
  return ViewPlugin.fromClass(
    class {
      decorations

      constructor(view) {
        this.lineRuleMap = lineRuleMap
        this.decorations = buildViolationDecorations(view.state, lineRuleMap)
      }

      update(update) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = buildViolationDecorations(
            update.view.state,
            this.lineRuleMap,
          )
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    },
  )
}

const Editor = forwardRef(function Editor(
  {
    value,
    onChange,
    lineRuleMap,
    filename = 'SOURCE.CPP',
    readOnly = false,
    compact = false,
  },
  ref,
) {
  const viewRef = useRef(null)
  const flashTimeoutRef = useRef(null)

  useImperativeHandle(ref, () => ({
    scrollToLine(line, rule) {
      const view = viewRef.current
      if (!view || line < 1 || line > view.state.doc.lines) return

      const docLine = view.state.doc.line(line)
      const flashRule = rule ?? lineRuleMap.get(line) ?? 'Dead Code'

      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current)
      }

      view.dispatch({
        effects: [
          EditorView.scrollIntoView(docLine.from, { y: 'center' }),
          setFlashLine.of({ line, rule: flashRule }),
        ],
      })

      flashTimeoutRef.current = setTimeout(() => {
        view.dispatch({ effects: setFlashLine.of(null) })
        flashTimeoutRef.current = null
      }, 800)
    },
  }))

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)
    }
  }, [])

  const onCreateEditor = useCallback((view) => {
    viewRef.current = view
  }, [])

  const mapKey = useMemo(
    () =>
      [...lineRuleMap.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([l, r]) => `${l}:${r}`)
        .join(','),
    [lineRuleMap],
  )

  const extensions = useMemo(() => {
    const base = [
      cpp(),
      oneDark,
      EditorView.theme({
        '&': { height: '100%', backgroundColor: '#0d1117' },
        '.cm-scroller': {
          overflow: 'auto',
          fontFamily: '"JetBrains Mono", "Fira Code", ui-monospace, monospace',
          fontSize: '13px',
          lineHeight: '1.6',
        },
        '.cm-gutters': {
          backgroundColor: '#0d1117',
          borderRight: '1px solid #21262d',
        },
        '.cm-activeLineGutter': {
          backgroundColor: 'rgba(88, 166, 255, 0.06)',
        },
        '.cm-content': {
          padding: '8px 0',
        },
      }),
    ]

    if (readOnly) {
      base.push(EditorView.editable.of(false))
    } else {
      base.push(flashField, violationHighlightExtension(lineRuleMap))
    }

    return base
  }, [mapKey, lineRuleMap, readOnly])

  return (
    <div className={`code-window${compact ? ' code-window-compact' : ''}`}>
      <div className="code-window-titlebar">
        <div className="traffic-lights" aria-hidden="true">
          <span className="dot dot-red" />
          <span className="dot dot-yellow" />
          <span className="dot dot-green" />
        </div>
        <span className="code-window-filename">{filename}</span>
      </div>
      <div className="editor-wrap">
        <CodeMirror
          value={value}
          height="100%"
          extensions={extensions}
          onChange={readOnly ? undefined : onChange}
          onCreateEditor={onCreateEditor}
          editable={!readOnly}
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            highlightActiveLine: !readOnly,
            highlightActiveLineGutter: !readOnly,
          }}
        />
      </div>
    </div>
  )
})

export default Editor
