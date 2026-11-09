/**
 * The ring of actions offered for a thing or person pressed on a room's
 * picture, as pure logic and geometry: which actions are on it (every action
 * that can be performed on that kind of thing, in the agreed order, leaving
 * out those with nothing to choose from), the command each sends (always the
 * one the Actions row would send, built with `buildCommand`), the second
 * choices that fan out beside an action, and where the buttons and the fan
 * sit so they stay inside the picture. Knows nothing of Vue or the game.
 */
import {
  buildCommand,
  targetsFor,
  verbById,
  type ActionContext,
  type Slot,
} from './actions'
import type { AreaThing } from './areaThings'
import { parseCountedName } from './inventoryChanges'

/** What a ring button takes in hand, to be used on the next thing pressed. */
export type HandVerb = 'usewith' | 'give' | 'caston'

/** What a ring is drawn round: a thing of the picture, or a carried thing or spell on the belt. */
export interface RingSubject {
  areaId: string
  /** The engine's name, as a command puts it. */
  name: string
  /** The name shown in the middle of the ring. */
  label: string
  /** Decides the colour of the name. */
  kind: AreaThing['kind'] | 'spell'
}

/** A second choice in a fan: its words and the command it sends. */
export interface RingChoice {
  label: string
  command: string
}

/** One button of the ring. */
export interface RingAction {
  id: string
  label: string
  /** A small picture for the button: one glyph. */
  icon: string
  /** The command it sends at once (absent when it asks for more first). */
  command?: string
  /** The second choices it fans out (absent when it does not). */
  choices?: RingChoice[]
  /** It opens a words box (Say…). */
  say?: boolean
  /** It closes the ring and takes the subject in hand for the next press. */
  hand?: HandVerb
}

/** A point, in the picture's pixels. */
export interface Point {
  x: number
  y: number
}

/** The glyph on each action's button. */
export const ICONS: Record<string, string> = {
  take: '✋',
  use: '⚙',
  usewith: '⚯',
  open: '▯',
  close: '▮',
  caston: '✦',
  examine: '◉',
  talk: '☺',
  say: '❝',
  buy: '¤',
  give: '❖',
}

/** A button with a command that is sent at once. */
export function plain(id: string, label: string, command: string): RingAction {
  return { id, label, icon: ICONS[id] ?? '•', command }
}

/** The command of `verbId` with `args`; every ring verb is complete with them. */
export function commandOf(verbId: string, args: string[]): string {
  return buildCommand(verbById(verbId), args) ?? ''
}

/** A button that fans out the choices of the verb's slot, or null when there are none. */
export function fanned(
  verbId: string,
  label: string,
  slot: Slot,
  ctx: ActionContext,
  second: (value: string) => string[],
  counts = false,
): RingAction | null {
  const counted = new Map(
    ctx.inventory.map((entry) => {
      const { name, count } = parseCountedName(entry)
      return [name.toLowerCase(), count] as const
    }),
  )
  const choices = targetsFor(slot, ctx).map((target) => {
    const count = counts ? (counted.get(target.value.toLowerCase()) ?? 1) : 1
    return {
      label: count > 1 ? `${target.label} ×${count}` : target.label,
      command: commandOf(verbId, second(target.value)),
    }
  })
  return choices.length
    ? { id: verbId, label, icon: ICONS[verbId] ?? '•', choices }
    : null
}

/**
 * The ring of `thing`, clockwise from the top: for a thing Take, Use, Use
 * with…, Open, Close, Cast on…, Examine; for a person Talk to, Say…, Buy…
 * (sellers only), Give…, Use with…, Cast on…, Examine. Nothing is left out
 * for what will work, only for having nothing to choose from (nothing
 * carried, no spells, nothing to sell).
 */
export function ringActions(
  thing: AreaThing,
  ctx: ActionContext,
): RingAction[] {
  const name = thing.name
  const person = thing.kind === 'character'
  /** Only what is carried: the Actions row's slot also lists the ground. */
  const carried: Slot = { sources: ['inventory'] }
  const useWith = fanned(
    'usewith',
    'Use with…',
    carried,
    ctx,
    (carriedName) => [carriedName, name],
    true,
  )
  const castOn = fanned(
    'caston',
    'Cast on…',
    verbById('caston').slots[0],
    ctx,
    (spell) => [spell, name],
  )
  const examine = plain('examine', 'Examine', commandOf('examine', [name]))
  const present = (action: RingAction | null): RingAction[] =>
    action ? [action] : []
  if (person) {
    const sells = ctx.wares.some((ware) => ware.seller === name)
    const buy = sells
      ? fanned(
          'buy',
          'Buy…',
          verbById('buy').slots[0],
          { ...ctx, wares: ctx.wares.filter((ware) => ware.seller === name) },
          (ware) => [ware, name],
        )
      : null
    const give = fanned(
      'give',
      'Give…',
      verbById('give').slots[0],
      ctx,
      (carriedName) => [carriedName, name],
      true,
    )
    return [
      plain('talk', 'Talk to', commandOf('talk', [name])),
      { id: 'say', label: 'Say…', icon: ICONS.say, say: true },
      ...present(buy),
      ...present(give),
      ...present(useWith),
      ...present(castOn),
      examine,
    ]
  }
  return [
    plain('take', 'Take', commandOf('take', [name])),
    plain('use', 'Use', commandOf('use', [name])),
    ...present(useWith),
    plain('open', 'Open', commandOf('open', [name])),
    plain('close', 'Close', commandOf('close', [name])),
    ...present(castOn),
    examine,
  ]
}

/** The command that says `words` to `person`; null while the box is empty. */
export function sayCommand(
  words: string,
  person: { name: string },
): string | null {
  return buildCommand(verbById('say'), [words, person.name])
}

/** The diameter of a ring button. */
export const RING_BUTTON = 62
/** The least gap kept between two neighbouring buttons. */
const RING_GAP = 8
/** The nearest a ring's buttons sit to the spot pressed, to the middle of a button. */
const MIN_RADIUS = 60
/** The room kept between a button and the edge of the picture. */
const EDGE = 2

/**
 * Where the buttons of a ring of `count` sit, in the picture's pixels: evenly
 * round the centre, the first at the top and the rest clockwise, on a circle
 * that grows with the count so neighbours never touch. The centre is the spot
 * pressed, slid inward (off the thing if need be) until the whole ring lies
 * inside `bounds`; a picture too small for the ring puts it in the middle.
 */
export function ringLayout(
  at: Point,
  count: number,
  bounds: { w: number; h: number },
): { center: Point; radius: number; buttons: Point[] } {
  const half = RING_BUTTON / 2
  const wanted =
    count > 1
      ? (RING_BUTTON + RING_GAP) / (2 * Math.sin(Math.PI / count))
      : MIN_RADIUS
  const room = Math.min(bounds.w, bounds.h) / 2 - half - EDGE
  const radius = Math.max(0, Math.min(Math.max(wanted, MIN_RADIUS), room))
  const reach = radius + half + EDGE
  const clamp = (value: number, size: number): number =>
    size < reach * 2 ? size / 2 : Math.max(reach, Math.min(size - reach, value))
  const center = { x: clamp(at.x, bounds.w), y: clamp(at.y, bounds.h) }
  const buttons = Array.from({ length: count }, (_, i) => {
    const angle = (i * 2 * Math.PI) / count - Math.PI / 2
    return {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    }
  })
  return { center, radius, buttons }
}

/** The height of one name in a fan, and the pitch between two. */
export const FAN_PILL = 32
const FAN_PITCH = 36
/** The gap between the pressed button and its fan. */
const FAN_GAP = 10
/** The room a fan wants on its outer side before it bends toward the other. */
const FAN_ROOM = 150

/** Where a fan of `count` names goes beside the button at `from`. */
export interface FanLayout {
  /** The side the names bend toward: the one with more room. */
  side: 'left' | 'right'
  /** Where the names' edge nearest the button sits across the picture. */
  x: number
  /** The top of the fan, its height, and how many names show at once. */
  top: number
  height: number
  visible: number
  /** More names than show: the fan scrolls and carries a thin bar. */
  scrolls: boolean
}

/**
 * Where the fan of `count` names goes for the button at `from` on a ring
 * round `center`: on its outer side (away from the ring's middle), bending
 * toward the other side only when the outer one has too little room, centred
 * on the button and kept inside `bounds`; as many names as fit are shown and
 * the fan scrolls for the rest.
 */
export function fanLayout(
  from: Point,
  count: number,
  bounds: { w: number; h: number },
  center: Point = { x: bounds.w / 2, y: bounds.h / 2 },
): FanLayout {
  const room = (side: 'left' | 'right'): number =>
    side === 'right' ? bounds.w - from.x : from.x
  const outward =
    from.x > center.x + 1
      ? 'right'
      : from.x < center.x - 1
        ? 'left'
        : room('right') >= room('left')
          ? 'right'
          : 'left'
  const other = outward === 'right' ? 'left' : 'right'
  const side =
    room(outward) < FAN_ROOM && room(other) > room(outward) ? other : outward
  const fits = Math.max(1, Math.floor((bounds.h - 2 * EDGE) / FAN_PITCH))
  const visible = Math.min(count, fits)
  const height = visible * FAN_PITCH
  const top = Math.max(
    EDGE,
    Math.min(bounds.h - height - EDGE, from.y - height / 2),
  )
  const offset = RING_BUTTON / 2 + FAN_GAP
  return {
    side,
    x: side === 'right' ? from.x + offset : from.x - offset,
    top,
    height,
    visible,
    scrolls: count > visible,
  }
}

/** A rectangle, in the window's pixels. */
export interface Box {
  left: number
  top: number
  width: number
  height: number
}

/**
 * The part of the `stage` a person can see and press: the stage less any of
 * the `covers` (the command bar, the dock, the phone's panel) that lie over
 * its foot or its head. A cover whose middle is in the lower half cuts the
 * foot, one in the upper half cuts the head; a cover outside the stage, or
 * not across it, or as tall as the stage itself, cuts nothing.
 */
export function visibleBox(stage: Box, covers: Box[]): Box {
  let top = stage.top
  let bottom = stage.top + stage.height
  const middle = stage.top + stage.height / 2
  for (const cover of covers) {
    const coverBottom = cover.top + cover.height
    const across =
      cover.left < stage.left + stage.width &&
      cover.left + cover.width > stage.left
    if (!across || cover.height >= stage.height) continue
    if (coverBottom <= top || cover.top >= bottom) continue
    if (cover.top + cover.height / 2 >= middle)
      bottom = Math.min(bottom, cover.top)
    else top = Math.max(top, coverBottom)
  }
  // Named, not spread: a DOMRect keeps its sides on the prototype.
  return {
    left: stage.left,
    top,
    width: stage.width,
    height: Math.max(0, bottom - top),
  }
}
