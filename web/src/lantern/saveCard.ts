import type { SaveSlot } from '@/types/bridge'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI']
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/** "Act 1" (as saves store it) → "Act I"; other names stay as they are. */
export function actLabel(act: string | null): string {
  if (!act) return ''
  const match = /^Act (\d+)$/.exec(act)
  return match ? `Act ${ROMAN[Number(match[1]) - 1] ?? match[1]}` : act
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** When a save was made: "Today · 14:51", "Yesterday · 19:40", "14 Oct · 21:14". */
export function savedWhen(timestamp: string | null, now = new Date()): string {
  if (!timestamp) return ''
  const time = new Date(timestamp)
  if (Number.isNaN(time.getTime())) return ''
  const clock = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (sameDay(time, now)) return `Today · ${clock}`
  if (sameDay(time, yesterday)) return `Yesterday · ${clock}`
  return `${time.getDate()} ${MONTHS[time.getMonth()]} · ${clock}`
}

/** A card that holds a save (the quick save and the named saves are only listed when there is one). */
export function filled(card: SaveSlot): boolean {
  return card.slot === 0 || card.name !== undefined || card.room !== null
}

/** What identifies a card in the list: its name for a named save, else its slot number. */
export function cardKey(card: SaveSlot): string | number {
  return card.name === undefined ? card.slot : `name:${card.name}`
}

/**
 * The newest save that can be loaded (not empty, not from an older version),
 * the quick save or a slot. The first listed wins a tie; null when none.
 */
export function newestLoadable(saves: SaveSlot[]): SaveSlot | null {
  let best: SaveSlot | null = null
  let bestTime = -Infinity
  for (const save of saves) {
    if (!filled(save) || save.outdated) continue
    const time = save.timestamp ? new Date(save.timestamp).getTime() : NaN
    const at = Number.isNaN(time) ? -Infinity : time
    if (best === null || at > bestTime) {
      best = save
      bestTime = at
    }
  }
  return best
}

/**
 * The line under Continue: "Act II · The Old Mill · Yesterday · 21:14", as the
 * save card reads; a named save starts with its name, and has no "Quick save"
 * stand-in for a missing room.
 */
export function continueLine(card: SaveSlot, now = new Date()): string {
  return [
    card.name,
    actLabel(card.act),
    card.room ?? (card.name === undefined ? 'Quick save' : null),
    savedWhen(card.timestamp, now),
  ]
    .filter(Boolean)
    .join(' · ')
}
