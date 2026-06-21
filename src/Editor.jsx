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
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { EditorView, Decoration, ViewPlugin } from '@codemirror/view'
import { RangeSetBuilder, StateEffect, StateField } from '@codemirror/state'
import { getSmellColor } from './smellColors.js'

const setFlashLine = StateEffect.define()

const cppHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#C4B5FD' },
  { tag: tags.controlKeyword, color: '#C4B5FD' },
  { tag: tags.modifier, color: '#C4B5FD' },
  { tag: tags.typeName, color: '#FFE08A' },
  { tag: tags.className, color: '#FFE08A' },
  { tag: tags.namespace, color: '#FFE08A' },
  { tag: tags.string, color: '#A7F3D0' },
  { tag: tags.meta, color: '#6EE7B7' },
  { tag: tags.processingInstruction, color: '#6EE7B7' },
  { tag: tags.function(tags.variableName), color: '#BAE6FD' },
  { tag: tags.definition(tags.variableName), color: '#BAE6FD' },
  { tag: tags.variableName, color: '#BAE6FD' },
  { tag: tags.propertyName, color: '#BAE6FD' },
  { tag: tags.number, color: '#FFE08A' },
  { tag: tags.operator, color: '#F0F2F5' },
  { tag: tags.punctuation, color: '#E2E5EB' },
  { tag: tags.bracket, color: '#E2E5EB' },
  { tag: tags.content, color: '#F0F2F5' },
  { tag: tags.comment, color: '#C5CAD4' },
  { tag: tags.lineComment, color: '#C5CAD4' },
  { tag: tags.blockComment, color: '#C5CAD4' },
])

const editorTheme = EditorView.theme({
  '&': { height: '100%', backgroundColor: '#161922' },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: '"JetBrains Mono", "Fira Code", ui-monospace, monospace',
    fontSize: '14px',
    lineHeight: '1.65',
  },
  '.cm-content': {
    padding: '8px 0',
    color: '#F0F2F5',
    caretColor: '#FFFFFF',
  },
  '.cm-line': {
    color: '#F0F2F5',
  },
  '.cm-gutters': {
    backgroundColor: '#161922',
    borderRight: '1px solid #262A33',
    color: '#6E7582',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    color: '#6E7582',
    minWidth: '3ch',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(55, 138, 221, 0.14)',
    color: '#7FB3F5',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(55, 138, 221, 0.07)',
  },
  '.cm-violation-line': {
    position: 'relative',
  },
  '.cm-violation-dead-code': {
    backgroundColor: 'rgba(122, 36, 36, 0.55) !important',
    borderLeft: '5px solid #FF7070',
    boxShadow: 'inset 0 0 0 1px rgba(255, 112, 112, 0.3)',
  },
  '.cm-violation-magic-numbers': {
    backgroundColor: 'rgba(120, 72, 16, 0.55) !important',
    borderLeft: '5px solid #FFBE4D',
    boxShadow: 'inset 0 0 0 1px rgba(255, 190, 77, 0.3)',
  },
  '.cm-violation-lazy-class': {
    backgroundColor: 'rgba(30, 64, 120, 0.55) !important',
    borderLeft: '5px solid #7AB8FF',
    boxShadow: 'inset 0 0 0 1px rgba(122, 184, 255, 0.3)',
  },
  '.cm-violation-god-component': {
    backgroundColor: 'rgba(88, 40, 160, 0.55) !important',
    borderLeft: '5px solid #C084FF',
    boxShadow: 'inset 0 0 0 1px rgba(192, 132, 255, 0.3)',
  },
  '.cm-violation-copy-paste': {
    backgroundColor: 'rgba(140, 32, 96, 0.55) !important',
    borderLeft: '5px solid #FF8CC8',
    boxShadow: 'inset 0 0 0 1px rgba(255, 140, 200, 0.3)',
  },
  '.cm-violation-unused-imports': {
    backgroundColor: 'rgba(30, 64, 120, 0.55) !important',
    borderLeft: '5px solid #7AB8FF',
    boxShadow: 'inset 0 0 0 1px rgba(122, 184, 255, 0.3)',
  },
  '.cm-flash-dead-code': {
    backgroundColor: 'rgba(140, 40, 40, 0.72) !important',
    borderLeft: '5px solid #FF9090',
  },
  '.cm-flash-magic-numbers': {
    backgroundColor: 'rgba(140, 96, 24, 0.72) !important',
    borderLeft: '5px solid #FFD080',
  },
  '.cm-flash-lazy-class': {
    backgroundColor: 'rgba(36, 72, 130, 0.72) !important',
    borderLeft: '5px solid #99C8FF',
  },
  '.cm-flash-god-component': {
    backgroundColor: 'rgba(100, 48, 170, 0.72) !important',
    borderLeft: '5px solid #D8B4FE',
  },
  '.cm-flash-copy-paste': {
    backgroundColor: 'rgba(160, 40, 110, 0.72) !important',
    borderLeft: '5px solid #FFB0DC',
  },
  '.cm-flash-unused-imports': {
    backgroundColor: 'rgba(36, 72, 130, 0.72) !important',
    borderLeft: '5px solid #99C8FF',
  },
  '.cm-cursor': {
    borderLeftColor: '#FFFFFF',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(55, 138, 221, 0.22) !important',
  },
})

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
        this.syncGutterColors(view)
      }

      update(update) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = buildViolationDecorations(
            update.view.state,
            this.lineRuleMap,
          )
          this.syncGutterColors(update.view)
        }
      }

      syncGutterColors(view) {
        view.dom
          .querySelectorAll('.cm-lineNumbers .cm-gutterElement')
          .forEach((el) => {
            const lineNum = parseInt(el.textContent, 10)
            const rule = this.lineRuleMap.get(lineNum)

            if (rule) {
              const colors = getSmellColor(rule)
              el.style.color = colors.lineGutterText
              el.style.backgroundColor = colors.lineGutterBg
              el.style.fontWeight = '700'
            } else {
              el.style.color = '#6E7582'
              el.style.backgroundColor = ''
              el.style.fontWeight = ''
            }
          })
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
      editorTheme,
      syntaxHighlighting(cppHighlight),
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
