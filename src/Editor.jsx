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
import { syntaxHighlighting } from '@codemirror/language'
import { EditorView, Decoration, ViewPlugin } from '@codemirror/view'
import { RangeSetBuilder, StateEffect, StateField } from '@codemirror/state'
import { createCppHighlight, createEditorTheme } from './editorThemes.js'
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

function violationHighlightExtension(lineRuleMap, isLight) {
  const defaultLineNum = isLight ? '#9CA3AF' : '#6E7582'

  return ViewPlugin.fromClass(
    class {
      decorations

      constructor(view) {
        this.lineRuleMap = lineRuleMap
        this.isLight = isLight
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
              el.style.color = defaultLineNum
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
    theme = 'dark',
  },
  ref,
) {
  const viewRef = useRef(null)
  const flashTimeoutRef = useRef(null)
  const isLight = theme === 'light'

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
      createEditorTheme(isLight),
      syntaxHighlighting(createCppHighlight(isLight)),
    ]

    if (readOnly) {
      base.push(EditorView.editable.of(false))
    } else {
      base.push(flashField, violationHighlightExtension(lineRuleMap, isLight))
    }

    return base
  }, [mapKey, lineRuleMap, readOnly, isLight])

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
