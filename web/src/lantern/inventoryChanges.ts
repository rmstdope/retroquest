/**
 * Work out what the player gained or lost in a turn by comparing the bag or
 * spell list before and after it. The engine lists stacks as "3 apple"
 * (count prefix only when more than one) inside `[item_name]` / `[spell_name]`.
 */

export type ChipKind = 'item' | 'spell'

export interface Chip {
  kind: ChipKind
  name: string
  count: number
}

export interface Changes {
  gained: Chip[]
  lost: Chip[]
}

const MARKUP_TAG = /\[\/?[a-z_]+\]/g
const COUNT_PREFIX = /^(\d+) (.+)$/

/** Plain name and stack size of one bridge entry, e.g. "3 apple" → apple ×3. */
export function parseCountedName(markup: string): {
  name: string
  count: number
} {
  const text = markup.replace(MARKUP_TAG, '').trim()
  const match = COUNT_PREFIX.exec(text)
  const count = match ? Number(match[1]) : 1
  return count > 1 && match
    ? { name: match[2], count }
    : { name: text, count: 1 }
}

function tally(
  entries: string[],
): Map<string, { name: string; count: number }> {
  const totals = new Map<string, { name: string; count: number }>()
  for (const entry of entries) {
    const { name, count } = parseCountedName(entry)
    const key = name.toLowerCase()
    const existing = totals.get(key)
    totals.set(key, { name, count: (existing?.count ?? 0) + count })
  }
  return totals
}

/** Differences between two bridge lists (names as returned by the bridge). */
export function inventoryChanges(
  before: string[],
  after: string[],
  kind: ChipKind,
): Changes {
  const was = tally(before)
  const now = tally(after)
  const gained: Chip[] = []
  const lost: Chip[] = []
  for (const [key, { name, count }] of now) {
    const delta = count - (was.get(key)?.count ?? 0)
    if (delta > 0) gained.push({ kind, name, count: delta })
  }
  for (const [key, { name, count }] of was) {
    const delta = count - (now.get(key)?.count ?? 0)
    if (delta > 0) lost.push({ kind, name, count: delta })
  }
  return { gained, lost }
}
