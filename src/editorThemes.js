import { HighlightStyle } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'

const darkHighlight = HighlightStyle.define([
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

const lightHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#6D28D9' },
  { tag: tags.controlKeyword, color: '#6D28D9' },
  { tag: tags.modifier, color: '#6D28D9' },
  { tag: tags.typeName, color: '#B45309' },
  { tag: tags.className, color: '#B45309' },
  { tag: tags.namespace, color: '#B45309' },
  { tag: tags.string, color: '#047857' },
  { tag: tags.meta, color: '#0D9488' },
  { tag: tags.processingInstruction, color: '#0D9488' },
  { tag: tags.function(tags.variableName), color: '#1D4ED8' },
  { tag: tags.definition(tags.variableName), color: '#1D4ED8' },
  { tag: tags.variableName, color: '#1D4ED8' },
  { tag: tags.propertyName, color: '#1D4ED8' },
  { tag: tags.number, color: '#B45309' },
  { tag: tags.operator, color: '#1F2937' },
  { tag: tags.punctuation, color: '#374151' },
  { tag: tags.bracket, color: '#374151' },
  { tag: tags.content, color: '#1F2937' },
  { tag: tags.comment, color: '#6B7280' },
  { tag: tags.lineComment, color: '#6B7280' },
  { tag: tags.blockComment, color: '#6B7280' },
])

const violationStyles = {
  dead: {
    dark: ['rgba(122, 36, 36, 0.55)', '#FF7070', 'rgba(255, 112, 112, 0.3)'],
    light: ['rgba(226, 75, 74, 0.22)', '#DC2626', 'rgba(220, 38, 38, 0.2)'],
  },
  magic: {
    dark: ['rgba(120, 72, 16, 0.55)', '#FFBE4D', 'rgba(255, 190, 77, 0.3)'],
    light: ['rgba(239, 159, 39, 0.22)', '#D97706', 'rgba(217, 119, 6, 0.2)'],
  },
  blue: {
    dark: ['rgba(30, 64, 120, 0.55)', '#7AB8FF', 'rgba(122, 184, 255, 0.3)'],
    light: ['rgba(55, 138, 221, 0.18)', '#2563EB', 'rgba(37, 99, 235, 0.2)'],
  },
  purple: {
    dark: ['rgba(88, 40, 160, 0.55)', '#C084FF', 'rgba(192, 132, 255, 0.3)'],
    light: ['rgba(168, 85, 247, 0.18)', '#9333EA', 'rgba(147, 51, 234, 0.2)'],
  },
  pink: {
    dark: ['rgba(140, 32, 96, 0.55)', '#FF8CC8', 'rgba(255, 140, 200, 0.3)'],
    light: ['rgba(236, 72, 153, 0.18)', '#DB2777', 'rgba(219, 39, 119, 0.2)'],
  },
}

function violationRules(mode, prefix, key) {
  const [bg, border, shadow] = violationStyles[key][mode]
  const flashBg =
    mode === 'dark'
      ? violationStyles[key].dark[0].replace('0.55', '0.72')
      : violationStyles[key].light[0]
          .replace('0.22', '0.32')
          .replace('0.18', '0.28')

  return {
    [`.cm-violation-${prefix}`]: {
      backgroundColor: `${bg} !important`,
      borderLeft: `5px solid ${border}`,
      boxShadow: `inset 0 0 0 1px ${shadow}`,
    },
    [`.cm-flash-${prefix}`]: {
      backgroundColor: `${flashBg} !important`,
      borderLeft: `5px solid ${border}`,
    },
  }
}

export function createCppHighlight(isLight) {
  return isLight ? lightHighlight : darkHighlight
}

export function createEditorTheme(isLight) {
  const bg = isLight ? '#FAFBFC' : '#161922'
  const gutter = isLight ? '#EEF0F4' : '#161922'
  const border = isLight ? '#D4D8E0' : '#262A33'
  const text = isLight ? '#1F2937' : '#F0F2F5'
  const lineNum = isLight ? '#9CA3AF' : '#6E7582'
  const cursor = isLight ? '#111827' : '#FFFFFF'
  const mode = isLight ? 'light' : 'dark'

  const violations = Object.assign(
    {},
    ...Object.entries({
      'dead-code': 'dead',
      'magic-numbers': 'magic',
      'lazy-class': 'blue',
      'unused-imports': 'blue',
      'god-component': 'purple',
      'copy-paste': 'pink',
    }).map(([prefix, key]) => violationRules(mode, prefix, key)),
  )

  return EditorView.theme({
    '&': { height: '100%', backgroundColor: bg },
    '.cm-scroller': {
      overflow: 'auto',
      fontFamily: '"JetBrains Mono", "Fira Code", ui-monospace, monospace',
      fontSize: '14px',
      lineHeight: '1.65',
    },
    '.cm-content': {
      padding: '8px 0',
      color: text,
      caretColor: cursor,
    },
    '.cm-line': { color: text },
    '.cm-gutters': {
      backgroundColor: gutter,
      borderRight: `1px solid ${border}`,
      color: lineNum,
    },
    '.cm-lineNumbers .cm-gutterElement': {
      color: lineNum,
      minWidth: '3ch',
    },
    '.cm-activeLineGutter': {
      backgroundColor: isLight
        ? 'rgba(37, 99, 235, 0.1)'
        : 'rgba(55, 138, 221, 0.14)',
      color: isLight ? '#2563EB' : '#7FB3F5',
    },
    '.cm-activeLine': {
      backgroundColor: isLight
        ? 'rgba(37, 99, 235, 0.06)'
        : 'rgba(55, 138, 221, 0.07)',
    },
    '.cm-violation-line': { position: 'relative' },
    '.cm-flash-line': {
      borderLeftStyle: 'solid',
      borderLeftWidth: '5px',
      transition: 'background 0.3s',
    },
    ...violations,
    '.cm-cursor': { borderLeftColor: cursor },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
      backgroundColor: isLight
        ? 'rgba(37, 99, 235, 0.18) !important'
        : 'rgba(55, 138, 221, 0.22) !important',
    },
  })
}
