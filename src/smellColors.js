export const INACTIVE_FILTER = {
  accent: '#6B7280',
  dot: '#6B7280',
  text: '#9CA1AC',
  bg: '#1A1D24',
  border: '#3A3E48',
}

export const SEVERITY = {
  HIGH: {
    badgeBg: '#7A2424',
    badgeText: '#FBD3D3',
    cardBorder: '#8C2F2F',
    cardBorderWidth: '1.5px',
    refactorBg: '#9C3232',
    refactorText: '#FFFFFF',
    refactorBorder: 'transparent',
  },
  MEDIUM: {
    badgeBg: '#5C3D0A',
    badgeText: '#FCE3B8',
    cardBorder: '#8C5A12',
    cardBorderWidth: '1px',
    refactorBg: 'transparent',
    refactorText: '#FCE3B8',
    refactorBorder: '#8C5A12',
  },
  LOW: {
    badgeBg: 'rgba(55, 138, 221, 0.18)',
    badgeText: '#7FB3F5',
    cardBorder: '#2F66A8',
    cardBorderWidth: '1px',
    refactorBg: 'transparent',
    refactorText: '#7FB3F5',
    refactorBorder: '#2F66A8',
  },
}

export const SMELL_COLORS = {
  'Dead Code': {
    id: 'dead-code',
    accent: '#E24B4A',
    dot: '#F09595',
    text: '#F09595',
    bg: '#11141B',
    border: '#8C2F2F',
    pillBg: 'rgba(226, 75, 74, 0.14)',
    pillText: '#F09595',
    message: '#A8ADB8',
    label: 'DEAD CODE',
    severity: 'HIGH',
    lineBg: 'rgba(122, 36, 36, 0.55)',
    lineBorder: '#FF7070',
    lineGutterBg: 'rgba(122, 36, 36, 0.65)',
    lineGutterText: '#FFB8B8',
    chartFill: '#E24B4A',
  },
  'Magic Numbers': {
    id: 'magic-numbers',
    accent: '#EF9F27',
    dot: '#FAC775',
    text: '#FAC775',
    bg: '#11141B',
    border: '#8C5A12',
    pillBg: 'rgba(239, 159, 39, 0.14)',
    pillText: '#FAC775',
    message: '#A8ADB8',
    label: 'MAGIC NUMBER',
    severity: 'MEDIUM',
    lineBg: 'rgba(120, 72, 16, 0.55)',
    lineBorder: '#FFBE4D',
    lineGutterBg: 'rgba(120, 72, 16, 0.65)',
    lineGutterText: '#FFE2A8',
    chartFill: '#EF9F27',
  },
  'Lazy Class': {
    id: 'lazy-class',
    accent: '#378ADD',
    dot: '#85B7EB',
    text: '#85B7EB',
    bg: '#11141B',
    border: '#2F66A8',
    pillBg: 'rgba(55, 138, 221, 0.18)',
    pillText: '#85B7EB',
    message: '#A8ADB8',
    label: 'LAZY CLASS',
    severity: 'LOW',
    lineBg: 'rgba(30, 64, 120, 0.55)',
    lineBorder: '#7AB8FF',
    lineGutterBg: 'rgba(30, 64, 120, 0.65)',
    lineGutterText: '#B8D9FF',
    chartFill: '#378ADD',
  },
  'God Component': {
    id: 'god-component',
    accent: '#A855F7',
    dot: '#D4A8FF',
    text: '#D4A8FF',
    bg: '#11141B',
    border: '#7C3AED',
    pillBg: 'rgba(168, 85, 247, 0.18)',
    pillText: '#D4A8FF',
    message: '#A8ADB8',
    label: 'GOD COMPONENT',
    severity: 'HIGH',
    lineBg: 'rgba(88, 40, 160, 0.55)',
    lineBorder: '#C084FF',
    lineGutterBg: 'rgba(88, 40, 160, 0.65)',
    lineGutterText: '#E0C4FF',
    chartFill: '#A855F7',
  },
  'Copy-Paste': {
    id: 'copy-paste',
    accent: '#EC4899',
    dot: '#F9A8D4',
    text: '#F9A8D4',
    bg: '#11141B',
    border: '#BE185D',
    pillBg: 'rgba(236, 72, 153, 0.18)',
    pillText: '#F9A8D4',
    message: '#A8ADB8',
    label: 'COPY-PASTE',
    severity: 'MEDIUM',
    lineBg: 'rgba(140, 32, 96, 0.55)',
    lineBorder: '#FF8CC8',
    lineGutterBg: 'rgba(140, 32, 96, 0.65)',
    lineGutterText: '#FFC8E8',
    chartFill: '#EC4899',
  },
  'Unused Imports': {
    id: 'unused-imports',
    accent: '#378ADD',
    dot: '#85B7EB',
    text: '#85B7EB',
    bg: '#11141B',
    border: '#2F66A8',
    pillBg: 'rgba(55, 138, 221, 0.18)',
    pillText: '#85B7EB',
    message: '#A8ADB8',
    label: 'UNUSED IMPORT',
    severity: 'LOW',
    lineBg: 'rgba(30, 64, 120, 0.55)',
    lineBorder: '#7AB8FF',
    lineGutterBg: 'rgba(30, 64, 120, 0.65)',
    lineGutterText: '#B8D9FF',
    chartFill: '#378ADD',
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

export function getSeverityStyle(severity) {
  return SEVERITY[severity] ?? SEVERITY.LOW
}

export function smellClassPrefix(rule) {
  return `smell-${getSmellColor(rule).id}`
}
