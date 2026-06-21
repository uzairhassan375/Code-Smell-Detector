export const THEME_STORAGE_KEY = 'code-smell-detector-theme'

export function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark'
  return localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark'
}

export function getInactiveFilter(theme) {
  if (theme === 'light') {
    return {
      accent: '#9CA3AF',
      dot: '#9CA3AF',
      text: '#6B7280',
      bg: '#F3F4F6',
      border: '#D1D5DB',
    }
  }
  return {
    accent: '#6B7280',
    dot: '#6B7280',
    text: '#9CA1AC',
    bg: '#1A1D24',
    border: '#3A3E48',
  }
}
