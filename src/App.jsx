import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Editor from './Editor.jsx'
import ViolationPanel from './ViolationPanel.jsx'
import {
  FILTER_OPTIONS,
  buildLineRuleMap,
  runDetectors,
} from './detectors.js'
import { FILTER_LABELS, getSmellColor } from './smellColors.js'
import { groupViolationsForDisplay } from './groupViolations.js'
import { SAMPLE_CODE, SAMPLE_FILENAME } from './sampleCode.js'
import RefactorPreview from './RefactorPreview.jsx'
import { requestRefactor } from './refactorService.js'
import { THEME_STORAGE_KEY, getInactiveFilter, getInitialTheme } from './theme.js'

function ScanIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8 5v3.5l2 1.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function LogoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="18" height="18" rx="4" stroke="#378ADD" strokeWidth="1.5" />
      <path
        d="M7 8h8M7 11h5M7 14h8"
        stroke="#378ADD"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ThemeIcon({ theme }) {
  if (theme === 'dark') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M8 1.5v1.2M8 13.3v1.2M1.5 8h1.2M13.3 8h1.2M3.4 3.4l.85.85M11.75 11.75l.85.85M3.4 12.6l.85-.85M11.75 4.25l.85-.85"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M7.2 1.8A6 6 0 1 0 14.2 8.8 4.8 4.8 0 0 1 7.2 1.8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme)
  const [code, setCode] = useState(SAMPLE_CODE)
  const [activeFilters, setActiveFilters] = useState([...FILTER_OPTIONS])
  const [violations, setViolations] = useState([])
  const [lineRuleMap, setLineRuleMap] = useState(() => new Map())
  const [hasScanned, setHasScanned] = useState(false)
  const [refactorState, setRefactorState] = useState(null)
  const [refactoringKey, setRefactoringKey] = useState(null)
  const editorRef = useRef(null)
  const emptyLineMap = useMemo(() => new Map(), [])
  const inactiveFilter = useMemo(() => getInactiveFilter(theme), [theme])

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', theme === 'light')
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const clearScanResults = useCallback(() => {
    setViolations([])
    setLineRuleMap(new Map())
    setHasScanned(false)
  }, [])

  const displayViolations = useMemo(
    () => (hasScanned ? groupViolationsForDisplay(violations) : []),
    [hasScanned, violations],
  )

  const toggleFilter = useCallback((filter) => {
    setActiveFilters((prev) => {
      if (prev.includes(filter)) {
        if (prev.length === 1) return prev
        return prev.filter((f) => f !== filter)
      }
      return [...prev, filter]
    })
    clearScanResults()
  }, [clearScanResults])

  const handleScan = useCallback(() => {
    const results = runDetectors(code, activeFilters)
    setViolations(results)
    setLineRuleMap(buildLineRuleMap(results))
    setHasScanned(true)
  }, [code, activeFilters])

  const handleCodeChange = useCallback((newCode) => {
    setCode(newCode)
    clearScanResults()
    setRefactorState(null)
  }, [clearScanResults])

  const handleViolationClick = useCallback((line, rule) => {
    editorRef.current?.scrollToLine(line, rule)
  }, [])

  const handleRefactor = useCallback(async (violation, cardKey) => {
    setRefactoringKey(cardKey)
    setRefactorState({
      violation,
      status: 'loading',
      originalSnippet: '',
      refactoredSnippet: '',
    })

    editorRef.current?.scrollToLine(violation.lines[0], violation.rule)

    try {
      const { originalSnippet, refactoredSnippet } = await requestRefactor(
        violation,
        code,
      )
      setRefactorState({
        violation,
        status: 'done',
        originalSnippet,
        refactoredSnippet,
      })
    } catch (err) {
      setRefactorState({
        violation,
        status: 'error',
        originalSnippet: '',
        refactoredSnippet: '',
        error: err instanceof Error ? err.message : 'Refactor failed.',
      })
    } finally {
      setRefactoringKey(null)
    }
  }, [code])

  const handleCloseRefactor = useCallback(() => {
    setRefactorState(null)
  }, [])

  return (
    <div className="app">
      <header className="top-bar">
        <div className="top-bar-main">
          <div className="brand">
            <LogoIcon />
            <div>
              <h1 className="app-title">Code smell detector</h1>
              <p className="app-subtitle">
                Scan, locate, and fix problematic patterns in your code
              </p>
            </div>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              <ThemeIcon theme={theme} />
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            <button type="button" className="scan-btn" onClick={handleScan}>
              <ScanIcon />
              Scan code
            </button>
          </div>
        </div>

        <div className="filter-pills">
          {FILTER_OPTIONS.map((filter) => {
            const colors = getSmellColor(filter)
            const isActive = activeFilters.includes(filter)
            return (
              <button
                key={filter}
                type="button"
                className={`filter-pill${isActive ? ' active' : ''}`}
                style={
                  isActive
                    ? {
                        '--pill-accent': colors.accent,
                        '--pill-bg': colors.pillBg,
                        '--pill-border': colors.accent,
                        '--pill-text':
                          theme === 'light' ? '#111827' : colors.pillText,
                        '--pill-dot': colors.dot,
                      }
                    : {
                        '--pill-accent': inactiveFilter.accent,
                        '--pill-bg': inactiveFilter.bg,
                        '--pill-border': inactiveFilter.border,
                        '--pill-text': inactiveFilter.text,
                        '--pill-dot': inactiveFilter.dot,
                      }
                }
                onClick={() => toggleFilter(filter)}
              >
                <span
                  className="filter-dot"
                  style={{
                    background: isActive ? colors.dot : inactiveFilter.dot,
                  }}
                />
                {FILTER_LABELS[filter] ?? filter}
              </button>
            )
          })}
        </div>
      </header>

      <main className="main-panels">
        <section className="editor-panel">
          <div className="editor-panel-stack">
            <Editor
              ref={editorRef}
              value={code}
              onChange={handleCodeChange}
              lineRuleMap={hasScanned ? lineRuleMap : emptyLineMap}
              filename={SAMPLE_FILENAME}
              theme={theme}
            />

            <RefactorPreview
              refactorState={refactorState}
              onClose={handleCloseRefactor}
              theme={theme}
            />
          </div>
        </section>

        <ViolationPanel
          violations={displayViolations}
          onViolationClick={handleViolationClick}
          onRefactor={handleRefactor}
          refactoringKey={refactoringKey}
          theme={theme}
        />
      </main>
    </div>
  )
}

export default App
