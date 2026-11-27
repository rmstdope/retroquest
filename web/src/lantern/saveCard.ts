import type { SaveSlot } from '@/types/bridge'
import { roomPatchUrl, roomPictureUrl } from './roomPicture'

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
 * the quick save, a slot or a named save. The first listed wins a tie; null when none.
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
 * The oldest filled save (the quick save is not a slot, so callers pass slots
 * only). A save with no time counts as the oldest; the first listed wins a
 * tie; null when none is filled.
 */
export function oldestFilled(saves: SaveSlot[]): SaveSlot | null {
  let best: SaveSlot | null = null
  let bestTime = Infinity
  for (const save of saves) {
    if (!filled(save)) continue
    const time = save.timestamp ? new Date(save.timestamp).getTime() : NaN
    const at = Number.isNaN(time) ? -Infinity : time
    if (best === null || at < bestTime) {
      best = save
      bestTime = at
    }
  }
  return best
}

/** What the title page's Continue card says about a save: a name in large type and a line under it. */
export interface ContinueCard {
  title: string
  line: string
}

/**
 * The Continue card for a save: the place it was made ("The Old Mill") over
 * "Act II · Yesterday · 21:14". A named save starts the line with its name, or
 * is titled by it when it has no place; a quick save with no place is "Quick
 * save".
 */
export function continueCard(card: SaveSlot, now = new Date()): ContinueCard {
  const title = card.room ?? card.name ?? 'Quick save'
  const line = [
    card.room === null ? null : card.name,
    actLabel(card.act),
    savedWhen(card.timestamp, now),
  ]
    .filter(Boolean)
    .join(' · ')
  return { title, line }
}

/** The files that make up a save's thumbnail: the room's pictures to try in order, and the patches that go over the one that loads. */
export interface ContinuePictureUrls {
  base: string[]
  patches: string[]
}

/**
 * The files of the picture a save was made looking at, or null for a save
 * that kept none. The room's other picture comes first and its plain one
 * stands in for it, as on the stage.
 */
export function continuePictureUrls(
  card: SaveSlot,
): ContinuePictureUrls | null {
  const { picture } = card
  if (!picture) return null
  const { actName, roomKey, variant, patchIds } = picture
  const plain = roomPictureUrl(actName, roomKey)
  if (!plain) return null
  return {
    base: variant
      ? [roomPictureUrl(actName, roomKey, variant), plain]
      : [plain],
    patches: patchIds.map((id) => roomPatchUrl(actName, roomKey, id, variant)),
  }
}
