import { RULE_TITLES } from './smellColors.js'

const GROQ_MODEL = 'llama-3.3-70b-versatile'

export function extractSnippet(source, lines) {
  const [start, end] = lines
  const allLines = source.split('\n')
  return allLines.slice(start - 1, end).join('\n')
}

function stripCodeFences(text) {
  return text
    .replace(/^```(?:cpp|c\+\+|c)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim()
}

function buildPrompt(violation, snippet) {
  const smell = RULE_TITLES[violation.rule] ?? violation.rule
  return `You are an expert C++ refactoring assistant.

Fix this code smell in the snippet below:
- Smell type: ${smell}
- Issue: ${violation.message}

Rules:
1. Refactor ONLY the snippet to remove this smell.
2. Preserve behavior and valid C++ syntax.
3. Return ONLY the refactored C++ code — no markdown fences, no explanation.

Snippet to refactor:
${snippet}`
}

export async function requestRefactor(violation, fullSource) {
  const snippet = extractSnippet(fullSource, violation.lines)
  if (!snippet.trim()) {
    throw new Error('Could not extract code for this violation.')
  }

  const body = {
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: buildPrompt(violation, snippet) }],
    temperature: 0.2,
    max_tokens: 2048,
  }

  const response = await fetch('/api/groq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    const message =
      data?.error?.message ?? data?.error ?? 'Groq request failed.'
    throw new Error(message)
  }

  const text = data?.choices?.[0]?.message?.content
  if (!text?.trim()) {
    throw new Error('Groq returned an empty response.')
  }

  return {
    originalSnippet: snippet,
    refactoredSnippet: stripCodeFences(text),
  }
}
