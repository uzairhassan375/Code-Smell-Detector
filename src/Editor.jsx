import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
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
        if (update.docChanged) {
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
  { value, onChange, lineRuleMap },
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

  const extensions = useMemo(
    () => [
      javascript({ jsx: true }),
      flashField,
      violationHighlightExtension(lineRuleMap),
      EditorView.theme({
        '&': { height: '100%' },
        '.cm-scroller': {
          overflow: 'auto',
          fontFamily: 'ui-monospace, Consolas, monospace',
        },
      }),
    ],
    [mapKey, lineRuleMap],
  )

  return (
    <div className="editor-wrap">
      <CodeMirror
        value={value}
        height="100%"
        extensions={extensions}
        onChange={onChange}
        onCreateEditor={onCreateEditor}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: true,
        }}
      />
    </div>
  )
})

export default Editor
