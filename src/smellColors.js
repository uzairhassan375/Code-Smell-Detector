export const SMELL_COLORS = {
  'Dead Code': {
    id: 'dead-code',
    bg: '#fcebeb',
    border: '#f09595',
    text: '#a32d2d',
    accent: '#e24b4a',
    pillBg: '#f7c1c1',
    pillText: '#791f1f',
    message: '#5c2a2a',
  },
  'Magic Numbers': {
    id: 'magic-numbers',
    bg: '#f3ebfc',
    border: '#c9a3f0',
    text: '#5b2d8a',
    accent: '#8b5cf6',
    pillBg: '#e0cff7',
    pillText: '#4a2570',
    message: '#4a3570',
  },
  'Lazy Class': {
    id: 'lazy-class',
    bg: '#ebf3fc',
    border: '#93c4f0',
    text: '#1e4a7a',
    accent: '#3b82f6',
    pillBg: '#c5dff7',
    pillText: '#153a66',
    message: '#2a4a6a',
  },
  'God Component': {
    id: 'god-component',
    bg: '#fff4eb',
    border: '#f5b87a',
    text: '#9a4a12',
    accent: '#f97316',
    pillBg: '#fde0c2',
    pillText: '#7a3a0f',
    message: '#6a4520',
  },
  'Copy-Paste': {
    id: 'copy-paste',
    bg: '#ebfcf7',
    border: '#7adfc9',
    text: '#0f5c4a',
    accent: '#14b8a6',
    pillBg: '#c2f5ea',
    pillText: '#0d4a3d',
    message: '#2a5c50',
  },
  'Unused Imports': {
    id: 'unused-imports',
    bg: '#fcebfc',
    border: '#f095d8',
    text: '#8a2d6b',
    accent: '#ec4899',
    pillBg: '#f7c1e8',
    pillText: '#6b1f52',
    message: '#5c2a4a',
  },
}

export function getSmellColor(rule) {
  return SMELL_COLORS[rule] ?? SMELL_COLORS['Dead Code']
}

export function smellClassPrefix(rule) {
  return `smell-${getSmellColor(rule).id}`
}
