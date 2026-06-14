/** @typedef {{ rule: string, lines: [number, number], message: string }} Violation */

const JS_IMPORT_REGEX =
  /import\s+(?:(\w+)\s*,?\s*)?(?:\{([^}]+)\})?\s*from\s+['"][^'"]+['"]/g

const CPP_INCLUDE_REGEX = /#include\s+[<"]([^>"]+)[>"]/g

const CPP_HEADER_HINTS = {
  fstream: ['fstream', 'ifstream', 'ofstream', 'fstream'],
  algorithm: ['std::sort', 'std::find', 'std::copy', 'std::transform', 'algorithm'],
  cmath: ['std::sqrt', 'std::pow', 'std::sin', 'std::cos', 'M_PI', 'cmath'],
  map: ['std::map', 'map<'],
  vector: ['std::vector', 'vector<'],
  string: ['std::string', 'string'],
  iostream: ['std::cout', 'std::cin', 'std::cerr', 'iostream'],
}

function getLineNumber(source, index) {
  return source.slice(0, index).split('\n').length
}

function stripComments(line) {
  const trimmed = line.trim()
  if (trimmed.startsWith('//')) return ''
  return line.replace(/\/\*.*?\*\//g, '').replace(/\/\/.*$/, '')
}

function isCommentLine(line) {
  const t = line.trim()
  return t.startsWith('//') || t.startsWith('/*') || t.startsWith('*')
}

function isCppSource(source) {
  return /#include\s+[<"]/.test(source)
}

function getJsImportBlockEnd(source) {
  const lines = source.split('\n')
  let lastImportLine = 0
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim()
    if (t.startsWith('import ') || t.startsWith('import{')) {
      lastImportLine = i + 1
    } else if (lastImportLine > 0 && t && !t.startsWith('//')) {
      break
    }
  }
  const lineStarts = []
  let pos = 0
  for (const line of lines) {
    lineStarts.push(pos)
    pos += line.length + 1
  }
  if (lastImportLine >= lines.length) return source.length
  return lineStarts[lastImportLine] ?? source.length
}

function getCppIncludeBlockEnd(source) {
  const lines = source.split('\n')
  let lastIncludeLine = 0
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim()
    if (t.startsWith('#include')) {
      lastIncludeLine = i + 1
    } else if (lastIncludeLine > 0 && t && !t.startsWith('//')) {
      break
    }
  }
  const lineStarts = []
  let pos = 0
  for (const line of lines) {
    lineStarts.push(pos)
    pos += line.length + 1
  }
  if (lastIncludeLine >= lines.length) return source.length
  return lineStarts[lastIncludeLine] ?? source.length
}

function extractImportNames(importStatement) {
  const names = []
  const defaultMatch = importStatement.match(
    /import\s+(\w+)\s*,?\s*(?:\{([^}]+)\})?\s*from/,
  )
  const namedOnly = importStatement.match(/import\s+\{([^}]+)\}\s*from/)
  const defaultOnly = importStatement.match(/import\s+(\w+)\s+from/)

  if (defaultMatch) {
    const [, def, named] = defaultMatch
    if (def && def !== 'from' && !def.startsWith('{')) {
      names.push(def)
    }
    if (named) {
      for (const part of named.split(',')) {
        const bit = part.trim()
        if (!bit) continue
        const alias = bit.split(/\s+as\s+/)
        names.push((alias[1] ?? alias[0]).trim())
      }
    }
  } else if (namedOnly) {
    for (const part of namedOnly[1].split(',')) {
      const bit = part.trim()
      if (!bit) continue
      const alias = bit.split(/\s+as\s+/)
      names.push((alias[1] ?? alias[0]).trim())
    }
  } else if (defaultOnly) {
    names.push(defaultOnly[1])
  }
  return names
}

function getHeaderKey(headerPath) {
  const base = headerPath.split('/').pop() ?? headerPath
  return base.replace(/\.(h|hpp|hh)$/, '')
}

function isCppHeaderUsed(headerPath, afterIncludes) {
  const key = getHeaderKey(headerPath)
  const hints = CPP_HEADER_HINTS[key]
  if (hints) {
    return hints.some((hint) => afterIncludes.includes(hint))
  }
  return afterIncludes.includes(key)
}

function detectUnusedJsImports(source) {
  const violations = []
  const importEnd = getJsImportBlockEnd(source)
  const afterImports = source.slice(importEnd)

  let match
  JS_IMPORT_REGEX.lastIndex = 0
  while ((match = JS_IMPORT_REGEX.exec(source)) !== null) {
    const statement = match[0]
    const line = getLineNumber(source, match.index)
    const names = extractImportNames(statement)

    for (const name of names) {
      if (!name) continue
      const usage = new RegExp(`\\b${name}\\b`, 'g')
      const matches = [...afterImports.matchAll(usage)]
      if (matches.length === 0) {
        violations.push({
          rule: 'Unused Imports',
          lines: [line, line],
          message: `'${name}' is imported but never used.`,
        })
      }
    }
  }
  return violations
}

function detectUnusedCppIncludes(source) {
  const violations = []
  const includeEnd = getCppIncludeBlockEnd(source)
  const afterIncludes = source.slice(includeEnd)

  let match
  CPP_INCLUDE_REGEX.lastIndex = 0
  while ((match = CPP_INCLUDE_REGEX.exec(source)) !== null) {
    const headerPath = match[1]
    const line = getLineNumber(source, match.index)

    if (!isCppHeaderUsed(headerPath, afterIncludes)) {
      violations.push({
        rule: 'Unused Imports',
        lines: [line, line],
        message: `'${headerPath}' is included but never referenced in this file.`,
      })
    }
  }
  return violations
}

/** @returns {Violation[]} */
export function detectUnusedImports(source) {
  return isCppSource(source)
    ? detectUnusedCppIncludes(source)
    : detectUnusedJsImports(source)
}

function countWordOccurrences(source, name) {
  const re = new RegExp(`\\b${name}\\b`, 'g')
  return [...source.matchAll(re)].length
}

function isUsedInJsx(source, name) {
  return new RegExp(`\\{[^}]*\\b${name}\\b[^}]*\\}`).test(source)
}

function isUsedInReturn(source, name) {
  return new RegExp(`return[^;{]*\\b${name}\\b`).test(source)
}

function isExportedFunction(source, fnIndex, fnName) {
  const before = source.slice(0, fnIndex).trimEnd()
  return (
    /export\s+default\s+function\s*$/.test(before.slice(-40)) ||
    /export\s+function\s+\w+\s*$/.test(before.slice(-60)) ||
    new RegExp(`export\\s*\\{[^}]*\\b${fnName}\\b`).test(source)
  )
}

function isComponentUsedInJsx(source, name) {
  return new RegExp(`<${name}[\\s/>]`).test(source)
}

function detectJsDeadCode(source) {
  const violations = []
  const seen = new Set()

  const constRe = /const\s+(\w+)\s*=/g
  let m
  while ((m = constRe.exec(source)) !== null) {
    const name = m[1]
    const key = `var:${name}`
    if (seen.has(key)) continue
    seen.add(key)

    const count = countWordOccurrences(source, name)
    if (count === 1) {
      if (isUsedInJsx(source, name) || isUsedInReturn(source, name)) continue
      const line = getLineNumber(source, m.index)
      violations.push({
        rule: 'Dead Code',
        lines: [line, line],
        message: `Variable ${name} is declared but never read anywhere in this file.`,
      })
    }
  }

  const fnRe = /function\s+(\w+)\s*\(/g
  while ((m = fnRe.exec(source)) !== null) {
    const name = m[1]
    const key = `fn:${name}`
    if (seen.has(key)) continue
    seen.add(key)

    if (isExportedFunction(source, m.index, name)) continue
    if (isComponentUsedInJsx(source, name)) continue
    if (/^[A-Z]/.test(name)) continue

    const count = countWordOccurrences(source, name)
    if (count === 1) {
      const line = getLineNumber(source, m.index)
      violations.push({
        rule: 'Dead Code',
        lines: [line, line],
        message: `Function ${name} is declared but never called anywhere in this file.`,
      })
    }
  }

  return violations
}

function detectCppDeadCode(source) {
  const violations = []
  const seen = new Set()

  const varRe =
    /(?:std::\w+(?:\s*<[^>]*>)?|int|double|float|bool|auto)\s+(\w+)\s*=/g
  let m
  while ((m = varRe.exec(source)) !== null) {
    const name = m[1]
    const key = `var:${name}`
    if (seen.has(key)) continue
    seen.add(key)

    const count = countWordOccurrences(source, name)
    if (count === 1) {
      const line = getLineNumber(source, m.index)
      violations.push({
        rule: 'Dead Code',
        lines: [line, line],
        message: `Variable ${name} is declared but never read anywhere in this file.`,
      })
    }
  }

  const fnRe =
    /(?:void|int|double|bool|std::\w+)\s+(\w+)\s*\([^)]*\)\s*\{/g
  while ((m = fnRe.exec(source)) !== null) {
    const name = m[1]
    if (name === 'main') continue

    const key = `fn:${name}`
    if (seen.has(key)) continue
    seen.add(key)

    const count = countWordOccurrences(source, name)
    if (count === 1) {
      const line = getLineNumber(source, m.index)
      violations.push({
        rule: 'Dead Code',
        lines: [line, line],
        message: `Function ${name} is declared but never called anywhere in this file.`,
      })
    }
  }

  return violations
}

/** @returns {Violation[]} */
export function detectDeadCode(source) {
  return isCppSource(source)
    ? detectCppDeadCode(source)
    : detectJsDeadCode(source)
}

function isInsideBlockComment(source, index) {
  const before = source.slice(0, index)
  const open = before.lastIndexOf('/*')
  const close = before.lastIndexOf('*/')
  return open !== -1 && open > close
}

function isArrayIndexContext(line, matchIndex) {
  const before = line.slice(0, matchIndex)
  const after = line.slice(matchIndex)
  return /\[\s*$/.test(before) || /^\s*\]/.test(after)
}

function isConstDefinitionLine(line, num) {
  return new RegExp(
    `(?:^\\s*const\\s+\\w+\\s*=\\s*${num}|^\\s*(?:int|double|const\\s+int)\\s+\\w+\\s*=\\s*${num})\\s*[,;]?\\s*$`,
  ).test(line.trim())
}

function isImportOrIncludeLine(line) {
  return (
    /^\s*import\s/.test(line) ||
    /^\s*#include\s/.test(line) ||
    /\brequire\s*\(/.test(line)
  )
}

/** @returns {Violation[]} */
export function detectMagicNumbers(source) {
  const violations = []
  const lines = source.split('\n')
  const magicRe = /(?<![.\w])([2-9]\d*|\d{2,})(?![\w.])/g
  const reported = new Set()

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1
    let line = lines[i]
    if (isCommentLine(line)) continue
    if (isImportOrIncludeLine(line)) continue

    const cleaned = stripComments(line)
    if (!cleaned.trim()) continue

    let match
    magicRe.lastIndex = 0
    while ((match = magicRe.exec(cleaned)) !== null) {
      const num = match[1]
      const key = `${lineNum}:${num}:${match.index}`
      if (reported.has(key)) continue

      if (isArrayIndexContext(cleaned, match.index)) continue
      if (isConstDefinitionLine(line, num)) continue

      const globalIndex =
        lines.slice(0, i).join('\n').length + (i > 0 ? 1 : 0) + match.index
      if (isInsideBlockComment(source, globalIndex)) continue

      reported.add(key)
      violations.push({
        rule: 'Magic Numbers',
        lines: [lineNum, lineNum],
        message:
          Number(num) === 50
            ? `Threshold ${num} repeats the same smell as nearby lines — pair both with shared constants.`
            : `Threshold ${num} appears with no named meaning — extract to a constant for clarity.`,
      })
    }
  }

  return violations
}

function countClassMethods(body, isCpp = false) {
  const keywords = new Set([
    'if',
    'for',
    'while',
    'switch',
    'catch',
    'constructor',
    'return',
    'else',
    'do',
    'try',
    'class',
  ])

  const methodRe = isCpp
    ? /(?:^\s*|\n\s*)(?:virtual\s+|static\s+|inline\s+)*(?:void|int|bool|double|std::\w+|\w+)\s+(\w+)\s*\([^;{]*\)\s*(?:const\s*)?(?:override\s*)?\{/gm
    : /(?:^\s*|\n\s*)(?:(?:static|async|get|set)\s+)*(\w+)\s*\([^)]*\)\s*\{/gm

  let count = 0
  let m
  while ((m = methodRe.exec(body)) !== null) {
    const name = m[1]
    if (!keywords.has(name)) count++
  }
  if (/constructor\s*\(/.test(body)) {
    count += 1
  }
  return count
}

function findBlockAfterIndex(source, openIndex, openChar, closeChar) {
  let depth = 0
  let end = openIndex
  for (let i = openIndex; i < source.length; i++) {
    if (source[i] === openChar) depth++
    else if (source[i] === closeChar) {
      depth--
      if (depth === 0) {
        end = i
        break
      }
    }
  }
  return { start: openIndex, end, content: source.slice(openIndex + 1, end) }
}

function findMatchingParen(source, openIndex) {
  return findBlockAfterIndex(source, openIndex, '(', ')')
}

function findMatchingBrace(source, openIndex) {
  return findBlockAfterIndex(source, openIndex, '{', '}')
}

function extractClassBodies(source) {
  const results = []
  const classRe = /\bclass\s+(\w+)/g
  let m
  while ((m = classRe.exec(source)) !== null) {
    const name = m[1]
    const openBrace = source.indexOf('{', m.index + m[0].length)
    if (openBrace === -1) continue

    const block = findMatchingBrace(source, openBrace)
    const startLine = getLineNumber(source, m.index)
    const endLine = getLineNumber(source, block.end)
    results.push({ name, body: block.content, startLine, endLine })
  }
  return results
}

/** @returns {Violation[]} */
export function detectLazyClass(source) {
  const violations = []
  const isCpp = isCppSource(source)

  for (const { name, body, startLine, endLine } of extractClassBodies(source)) {
    const methodCount = countClassMethods(body, isCpp)
    if (methodCount < 2) {
      violations.push({
        rule: 'Lazy Class',
        lines: [startLine, endLine],
        message: `Class '${name}' has fewer than 2 methods — consider inlining or merging.`,
      })
    }
  }
  return violations
}

function extractComponentBodies(source) {
  const components = []
  const fnRe = /function\s+([A-Z]\w*)\s*\(/g
  let m
  while ((m = fnRe.exec(source)) !== null) {
    const name = m[1]
    const paramOpen = source.indexOf('(', m.index)
    if (paramOpen === -1) continue
    const params = findMatchingParen(source, paramOpen)
    const bodyOpen = source.indexOf('{', params.end)
    if (bodyOpen === -1) continue

    const block = findMatchingBrace(source, bodyOpen)
    const body = block.content
    const bodyLines = body.split('\n').length
    const startLine = getLineNumber(source, bodyOpen)
    const endLine = getLineNumber(source, block.end)
    components.push({ name, body, bodyLines, startLine, endLine, fnIndex: m.index })
  }

  const arrowRe =
    /(?:const|let|var)\s+([A-Z]\w*)\s*=\s*(?:\([^)]*\)|\w+)\s*=>\s*\{/g
  while ((m = arrowRe.exec(source)) !== null) {
    const name = m[1]
    const openBrace = source.indexOf('{', m.index)
    if (openBrace === -1) continue
    const block = findMatchingBrace(source, openBrace)
    const body = block.content
    const bodyLines = body.split('\n').length
    const startLine = getLineNumber(source, openBrace)
    const endLine = getLineNumber(source, block.end)
    components.push({ name, body, bodyLines, startLine, endLine, fnIndex: m.index })
  }

  return components
}

function countDestructuredProps(source, fnIndex) {
  const slice = source.slice(fnIndex, fnIndex + 400)
  const propsMatch = slice.match(/function\s+[A-Z]\w*\s*\(\s*\{([^}]+)\}/)
  if (!propsMatch) return 0
  return propsMatch[1].split(',').filter((p) => p.trim()).length
}

function countCppMemberFields(body) {
  const fieldRe =
    /(?:^\s*|\n\s*)(?:int|double|float|bool|std::\w+(?:\s*<[^>]*>)?)\s+(\w+)\s*;/gm
  return [...body.matchAll(fieldRe)].length
}

function detectCppGodClass(source) {
  const violations = []

  for (const { name, body, startLine, endLine } of extractClassBodies(source)) {
    let score = 0
    const bodyLines = body.split('\n').length
    const methodCount = countClassMethods(body, true)
    const fieldCount = countCppMemberFields(body)

    if (bodyLines > 35) score++
    if (methodCount > 6) score++
    if (fieldCount > 5) score++
    if (/fetch|sync|render|validate|write/i.test(body) && methodCount > 4) score++

    if (score >= 2) {
      violations.push({
        rule: 'God Component',
        lines: [startLine, endLine],
        message: `Class '${name}' is a God Class (score: ${score}/4). Split into smaller, focused classes.`,
      })
    }
  }

  return violations
}

function detectJsGodComponent(source) {
  const violations = []

  for (const comp of extractComponentBodies(source)) {
    const { name, body, bodyLines, startLine, endLine } = comp
    let score = 0

    if (bodyLines > 80) score++

    const useStateCount = (body.match(/useState/g) || []).length
    if (useStateCount > 3) score++

    const hasFetch =
      /fetch\s*\(|axios\.|useEffect\s*\(/.test(body) &&
      /(?:https?:\/\/|['"`]\/api|['"`]\/)/.test(body)
    const hasJsxReturn = /<[A-Z]/.test(body) && /return\s*</.test(body)
    if (hasFetch && hasJsxReturn) score++

    const propCount = countDestructuredProps(source, comp.fnIndex)
    if (propCount > 5) score++

    if (score >= 2) {
      violations.push({
        rule: 'God Component',
        lines: [startLine, endLine],
        message: `Component '${name}' is a God Component (score: ${score}/4). Split into smaller components.`,
      })
    }
  }

  return violations
}

/** @returns {Violation[]} */
export function detectGodComponent(source) {
  return isCppSource(source)
    ? detectCppGodClass(source)
    : detectJsGodComponent(source)
}

function normalizeWindow(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\b\w+\b/g, 'TOKEN')
    .trim()
}

function isSignificantLine(line) {
  const t = line.trim()
  if (!t) return false
  if (isCommentLine(line)) return false
  return true
}

/** @returns {Violation[]} */
export function detectCopyPaste(source) {
  const violations = []
  const rawLines = source.split('\n')
  const entries = []

  for (let i = 0; i < rawLines.length; i++) {
    if (!isSignificantLine(rawLines[i])) continue
    entries.push({ rawIndex: i, line: rawLines[i] })
  }

  const WINDOW = 4
  if (entries.length < WINDOW * 2) return violations

  const windows = []
  for (let i = 0; i <= entries.length - WINDOW; i++) {
    const slice = entries.slice(i, i + WINDOW)
    const text = slice.map((e) => e.line).join('\n')
    const normalized = normalizeWindow(text)
    const startLine = slice[0].rawIndex + 1
    const endLine = slice[WINDOW - 1].rawIndex + 1
    windows.push({ normalized, startLine, endLine, startIdx: i })
  }

  const reported = new Set()

  for (let a = 0; a < windows.length; a++) {
    for (let b = a + 1; b < windows.length; b++) {
      if (windows[a].normalized !== windows[b].normalized) continue
      if (windows[a].normalized.length < 8) continue

      const key = `${windows[a].startLine}-${windows[b].startLine}`
      if (reported.has(key)) continue
      reported.add(key)

      violations.push({
        rule: 'Copy-Paste',
        lines: [windows[b].startLine, windows[b].endLine],
        message: `Lines ${windows[b].startLine}–${windows[b].endLine} appear to be a duplicate of lines ${windows[a].startLine}–${windows[a].endLine}.`,
      })
    }
  }

  return violations
}

export const DETECTORS = {
  'Unused Imports': detectUnusedImports,
  'Dead Code': detectDeadCode,
  'Magic Numbers': detectMagicNumbers,
  'Lazy Class': detectLazyClass,
  'God Component': detectGodComponent,
  'Copy-Paste': detectCopyPaste,
}

export const FILTER_OPTIONS = [
  'Dead Code',
  'Magic Numbers',
  'Lazy Class',
  'God Component',
  'Copy-Paste',
  'Unused Imports',
]

export function runDetectors(source, activeFilters) {
  const all = []
  for (const filter of activeFilters) {
    const fn = DETECTORS[filter]
    if (fn) all.push(...fn(source))
  }
  return all
}

export function buildHighlightedLines(violations) {
  const set = new Set()
  for (const v of violations) {
    const [start, end] = v.lines
    for (let line = start; line <= end; line++) {
      set.add(line)
    }
  }
  return set
}

/** @returns {Map<number, string>} line number → rule name */
export function buildLineRuleMap(violations) {
  const map = new Map()
  for (const v of violations) {
    const [start, end] = v.lines
    for (let line = start; line <= end; line++) {
      if (!map.has(line)) map.set(line, v.rule)
    }
  }
  return map
}
