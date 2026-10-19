/**
 * A quest's description for its details dialog. Most quests are journals:
 * the engine dims the earlier stages ([dim]…[/dim]) and adds the newest
 * after them. A few are checklists: requirements as [success]/[pending]
 * lines (Act I), or ✓/○ clue lines (Act III).
 */
export type QuestDetails =
  | { kind: 'journal'; latest: string; earlier: string[] }
  | { kind: 'checklist'; intro: string; items: ChecklistItem[] }

export interface ChecklistItem {
  done: boolean
  /** Engine markup (may name characters, items…). */
  text: string
}

const DIM = /\[dim\]([\s\S]*?)\[\/dim\]/g
/** "[success] * Warm clothing[/success]" / "[pending] * …[/pending]". */
const REQUIREMENT = /^\[(success|pending)\]\s*\*?\s*([\s\S]*?)\s*\[\/\1\]$/
/** "✓ Found it." / "[dim]○ Still to find.[/dim]". */
const CLUE = /^(?:\[dim\])?\s*([✓○])\s*([\s\S]*?)\s*(?:\[\/dim\])?$/

function checklistItem(line: string): ChecklistItem | null {
  const requirement = REQUIREMENT.exec(line)
  if (requirement)
    return { done: requirement[1] === 'success', text: requirement[2] }
  const clue = CLUE.exec(line)
  if (clue) return { done: clue[1] === '✓', text: clue[2] }
  return null
}

export function parseQuestDetails(description: string): QuestDetails {
  const lines = description.split('\n').map((line) => line.trim())
  const items = lines.map(checklistItem)
  if (items.some((item) => item)) {
    const intro = lines
      .filter((_, index) => !items[index])
      .join('\n')
      .replace(DIM, '$1')
      .trim()
      .replace(/:\s*$/, ':')
    return {
      kind: 'checklist',
      intro,
      items: items.filter((item): item is ChecklistItem => item !== null),
    }
  }
  const earlier = [...description.matchAll(DIM)]
    .map((match) => match[1].trim())
    .filter(Boolean)
  const latest = description.replace(DIM, '').trim()
  // Nothing after the dimmed stages: the last of them is the newest.
  if (!latest && earlier.length)
    return {
      kind: 'journal',
      latest: earlier.at(-1)!,
      earlier: earlier.slice(0, -1),
    }
  return { kind: 'journal', latest, earlier }
}
