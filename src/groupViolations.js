/** @typedef {{ rule: string, lines: [number, number], message: string }} Violation */

/** @returns {Violation[]} */
export function groupViolationsForDisplay(violations) {
  const unused = violations.filter((v) => v.rule === 'Unused Imports')
  const rest = violations.filter((v) => v.rule !== 'Unused Imports')

  const grouped = [...rest]

  if (unused.length > 0) {
    const lines = unused.flatMap((v) => [v.lines[0], v.lines[1]])
    const start = Math.min(...lines)
    const end = Math.max(...lines)
    const names = unused
      .map((v) => {
        const match = v.message.match(/'([^']+)'/)
        return match?.[1]
      })
      .filter(Boolean)

    let message
    const isInclude = unused.some((v) => v.message.includes('included'))
    const verb = isInclude ? 'included' : 'imported'

    if (names.length >= 2) {
      const last = names.pop()
      message = `${names.join(', ')}, and ${last} are ${verb} but never referenced in this file.`
    } else if (names.length === 1) {
      message = `${names[0]} is ${verb} but never referenced in this file.`
    } else {
      message = unused[0].message
    }

    grouped.unshift({
      rule: 'Unused Imports',
      lines: [start, end],
      message,
    })
  }

  return grouped.sort((a, b) => a.lines[0] - b.lines[0])
}
