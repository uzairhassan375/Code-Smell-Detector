import { FILTER_LABELS, getSmellColor } from './smellColors.js'

/** @param {{ rule: string }[]} violations */
export function computeSmellBreakdown(violations) {
  const counts = new Map()

  for (const v of violations) {
    counts.set(v.rule, (counts.get(v.rule) ?? 0) + 1)
  }

  const total = violations.length
  if (total === 0) return []

  return [...counts.entries()]
    .map(([rule, count]) => ({
      rule,
      label: FILTER_LABELS[rule] ?? rule,
      count,
      percentage: Math.round((count / total) * 1000) / 10,
      color: getSmellColor(rule).accent,
    }))
    .sort((a, b) => b.count - a.count)
}
