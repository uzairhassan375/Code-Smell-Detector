export const SMELL_COLORS = {
  'Dead Code': {
    id: 'dead-code',
    accent: '#f85149',
    bg: 'rgba(248, 81, 73, 0.08)',
    border: 'rgba(248, 81, 73, 0.35)',
    text: '#ff7b72',
    pillBg: 'rgba(248, 81, 73, 0.15)',
    pillText: '#ff7b72',
    message: '#8b949e',
    label: 'DEAD CODE',
    severity: 'HIGH',
    severityBg: 'rgba(248, 81, 73, 0.15)',
    severityText: '#f85149',
  },
  'Magic Numbers': {
    id: 'magic-numbers',
    accent: '#d29922',
    bg: 'rgba(210, 153, 34, 0.08)',
    border: 'rgba(210, 153, 34, 0.35)',
    text: '#e3b341',
    pillBg: 'rgba(210, 153, 34, 0.15)',
    pillText: '#e3b341',
    message: '#8b949e',
    label: 'MAGIC NUMBER',
    severity: 'MEDIUM',
    severityBg: 'rgba(210, 153, 34, 0.15)',
    severityText: '#d29922',
  },
  'Lazy Class': {
    id: 'lazy-class',
    accent: '#58a6ff',
    bg: 'rgba(88, 166, 255, 0.08)',
    border: 'rgba(88, 166, 255, 0.35)',
    text: '#58a6ff',
    pillBg: 'rgba(88, 166, 255, 0.15)',
    pillText: '#58a6ff',
    message: '#8b949e',
    label: 'LAZY CLASS',
    severity: 'LOW',
    severityBg: 'rgba(88, 166, 255, 0.15)',
    severityText: '#58a6ff',
  },
  'God Component': {
    id: 'god-component',
    accent: '#bc8cff',
    bg: 'rgba(188, 140, 255, 0.08)',
    border: 'rgba(188, 140, 255, 0.35)',
    text: '#bc8cff',
    pillBg: 'rgba(188, 140, 255, 0.15)',
    pillText: '#bc8cff',
    message: '#8b949e',
    label: 'GOD COMPONENT',
    severity: 'HIGH',
    severityBg: 'rgba(188, 140, 255, 0.15)',
    severityText: '#bc8cff',
  },
  'Copy-Paste': {
    id: 'copy-paste',
    accent: '#f778ba',
    bg: 'rgba(247, 120, 186, 0.08)',
    border: 'rgba(247, 120, 186, 0.35)',
    text: '#f778ba',
    pillBg: 'rgba(247, 120, 186, 0.15)',
    pillText: '#f778ba',
    message: '#8b949e',
    label: 'COPY-PASTE',
    severity: 'MEDIUM',
    severityBg: 'rgba(247, 120, 186, 0.15)',
    severityText: '#f778ba',
  },
  'Unused Imports': {
    id: 'unused-imports',
    accent: '#58a6ff',
    bg: 'rgba(88, 166, 255, 0.08)',
    border: 'rgba(88, 166, 255, 0.35)',
    text: '#58a6ff',
    pillBg: 'rgba(88, 166, 255, 0.15)',
    pillText: '#58a6ff',
    message: '#8b949e',
    label: 'UNUSED IMPORT',
    severity: 'LOW',
    severityBg: 'rgba(88, 166, 255, 0.15)',
    severityText: '#58a6ff',
  },
}

export const FILTER_LABELS = {
  'Dead Code': 'Dead code',
  'Magic Numbers': 'Magic numbers',
  'Lazy Class': 'Lazy class',
  'God Component': 'God component',
  'Copy-Paste': 'Copy-paste',
  'Unused Imports': 'Unused imports',
}

export const RULE_TITLES = {
  'Dead Code': 'Dead code',
  'Magic Numbers': 'Magic number',
  'Lazy Class': 'Lazy class',
  'God Component': 'God component',
  'Copy-Paste': 'Copy-paste',
  'Unused Imports': 'Unused imports',
}

export function getSmellColor(rule) {
  return SMELL_COLORS[rule] ?? SMELL_COLORS['Dead Code']
}

export function smellClassPrefix(rule) {
  return `smell-${getSmellColor(rule).id}`
}
