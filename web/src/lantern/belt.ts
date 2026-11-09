/**
 * The belt of pictures across the foot of a room's picture, as pure logic:
 * which pictures are on it (the carried things or the spells known), the ring
 * offered for one of them, and what a thing taken in hand sends when the next
 * press decides. Every command is the one the Actions row would send, built
 * with `buildCommand`; none is new. Knows nothing of Vue or the game.
 */
import type { NamedItem } from '@/engine'
import {
  buildCommand,
  verbById,
  type ActionContext,
  type Slot,
} from './actions'
import { displayName } from './displayName'
import { parseCountedName } from './inventoryChanges'
import {
  commandOf,
  fanned,
  ICONS,
  plain,
  type HandVerb,
  type RingAction,
  type RingSubject,
} from './pressRing'

export type { HandVerb }

/** Which list the belt shows. */
export type BeltList = 'bag' | 'spells'

/** One picture on the belt: a carried thing or a known spell. */
export interface BeltPicture {
  /** Unique on the belt. */
  key: string
  kind: 'item' | 'spell'
  /** The engine's name, as a command puts it. */
  name: string
  /** The name shown beneath the picture. */
  label: string
  /** How many are carried (1 for a spell). */
  count: number
  /** The short description the caption shows (with markup). */
  note: string
  /** The first letter of the name, shown until the picture is made. */
  letter: string
}

/** A thing or spell taken in hand, waiting for the press that decides where it goes. */
export interface Hand {
  kind: 'item' | 'spell'
  name: string
  label: string
  verb: HandVerb
}

/** The pictures of the list that shows, in the order the Bag or Spells keep them. */
export function beltPictures(
  items: NamedItem[],
  spells: NamedItem[],
  list: BeltList,
): BeltPicture[] {
  const kind = list === 'bag' ? 'item' : 'spell'
  return (list === 'bag' ? items : spells).map((entry) => {
    const { name, count } = parseCountedName(entry.name)
    const label = displayName(name)
    return {
      key: `${kind}:${name}`,
      kind,
      name,
      label,
      count,
      note: entry.description,
      letter: label.charAt(0).toUpperCase(),
    }
  })
}

/** The subject a ring is drawn round for a belt picture. */
export function subjectOf(picture: BeltPicture): RingSubject {
  return {
    areaId: `belt:${picture.key}`,
    name: picture.name,
    label: picture.label,
    kind: picture.kind,
  }
}

/** A button that takes the subject in hand. */
function taking(id: string, label: string, verb: HandVerb): RingAction {
  return { id, label, icon: ICONS[id] ?? '•', hand: verb }
}

/**
 * The ring of a carried thing, clockwise from the top: Use, Use with…,
 * Give…, Open, Close, Cast on…, Examine; of a spell: Cast, Cast on…. An
 * action with nothing to choose from is left out: Use with… when nothing else
 * is carried and nothing is placed in the room (`placed`), Give… with nobody
 * here, Cast on… with no spells. Use, Open, Close, Examine and Cast send at
 * once; Cast on… on a thing fans the spells known; Use with…, Give… and a
 * spell's Cast on… take it in hand.
 */
export function carriedRing(
  subject: RingSubject,
  ctx: ActionContext,
  placed: number,
): RingAction[] {
  const name = subject.name
  if (subject.kind === 'spell') {
    return [
      plain('cast', 'Cast', commandOf('cast', [name])),
      taking('caston', 'Cast on…', 'caston'),
    ]
  }
  const others = ctx.inventory.some(
    (entry) =>
      parseCountedName(entry).name.toLowerCase() !== name.toLowerCase(),
  )
  const castOn = fanned(
    'caston',
    'Cast on…',
    verbById('caston').slots[0] as Slot,
    ctx,
    (spell) => [spell, name],
  )
  return [
    plain('use', 'Use', commandOf('use', [name])),
    ...(others || placed > 0
      ? [taking('usewith', 'Use with…', 'usewith')]
      : []),
    ...(ctx.characters.length > 0 ? [taking('give', 'Give…', 'give')] : []),
    plain('open', 'Open', commandOf('open', [name])),
    plain('close', 'Close', commandOf('close', [name])),
    ...(castOn ? [castOn] : []),
    plain('examine', 'Examine', commandOf('examine', [name])),
  ]
}

/** What the strip says while `hand` waits: "Use Bread with…", "Give Bread to…", "Cast Light on…". */
export function handStrip(hand: Hand): string {
  if (hand.verb === 'usewith') return `Use ${hand.label} with…`
  if (hand.verb === 'give') return `Give ${hand.label} to…`
  return `Cast ${hand.label} on…`
}

/** The command `hand` sends once `pressed` is chosen: use with, give to or cast on. */
export function handCommand(hand: Hand, pressed: { name: string }): string {
  const verb = verbById(hand.verb)
  return buildCommand(verb, [hand.name, pressed.name]) ?? ''
}

/** The command for a picture pressed on the belt while `hand` waits; null for a spell or the picture in hand itself, which do nothing. */
export function pressedOnBelt(hand: Hand, picture: BeltPicture): string | null {
  if (picture.kind === 'spell') return null
  if (picture.kind === hand.kind && picture.name === hand.name) return null
  return handCommand(hand, picture)
}
