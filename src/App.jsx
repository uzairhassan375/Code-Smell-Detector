import { useCallback, useRef, useState } from 'react'
import Editor from './Editor.jsx'
import ViolationPanel from './ViolationPanel.jsx'
import {
  FILTER_OPTIONS,
  buildLineRuleMap,
  runDetectors,
} from './detectors.js'
import { getSmellColor } from './smellColors.js'

export const SAMPLE_CODE = `import React, { useState } from 'react'
import axios from 'axios'
import moment from 'moment'

const MAX_RETRIES = 3

function UserDashboard({ userId, token, theme, locale, debug, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [count, setCount] = useState(0)

  const unused = "old feature"

  useEffect(() => {
    fetch(\`/api/users/\${userId}\`)
      .then(r => r.json())
      .then(d => setData(d))
  }, [userId])

  if (data.score > 75) return <div>High</div>
  if (data.score > 50) return <div>Medium</div>
  return <div>{data.name}</div>
}

function oldHelper() {
  return "legacy"
}

class Logger {
  log(msg) { console.log(msg) }
}
`

function App() {
  const [code, setCode] = useState(SAMPLE_CODE)
  const [activeFilters, setActiveFilters] = useState([
    'Dead Code',
    'Unused Imports',
  ])
  const [violations, setViolations] = useState([])
  const [lineRuleMap, setLineRuleMap] = useState(() => new Map())
  const editorRef = useRef(null)

  const toggleFilter = useCallback((filter) => {
    setActiveFilters((prev) => {
      if (prev.includes(filter)) {
        if (prev.length === 1) return prev
        return prev.filter((f) => f !== filter)
      }
      return [...prev, filter]
    })
  }, [])

  const handleScan = useCallback(() => {
    const results = runDetectors(code, activeFilters)
    setViolations(results)
    setLineRuleMap(buildLineRuleMap(results))
  }, [code, activeFilters])

  const handleViolationClick = useCallback((line, rule) => {
    editorRef.current?.scrollToLine(line, rule)
  }, [])

  return (
    <div className="app">
      <header className="top-bar">
        <h1 className="app-title">Code Smell Detector</h1>
        <div className="top-bar-controls">
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
                          background: colors.bg,
                          color: colors.text,
                          borderColor: colors.border,
                        }
                      : undefined
                  }
                  onClick={() => toggleFilter(filter)}
                >
                  {filter}
                </button>
              )
            })}
          </div>
          <button type="button" className="scan-btn" onClick={handleScan}>
            Scan
          </button>
        </div>
      </header>

      <main className="main-panels">
        <section className="editor-panel">
          <h2 className="panel-label">Editor</h2>
          <Editor
            ref={editorRef}
            value={code}
            onChange={setCode}
            lineRuleMap={lineRuleMap}
          />
        </section>

        <ViolationPanel
          violations={violations}
          activeFilters={activeFilters}
          onViolationClick={handleViolationClick}
        />
      </main>
    </div>
  )
}

export default App
