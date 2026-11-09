/**
 * Where the room picture's marks and names go, as pure geometry: which placed
 * things are in view of a picture trimmed to fill its stage, where the mark of
 * each sits, which thing the pointer is over, and where each name goes so no
 * two names, and no name and button, overlap and every name stays inside the
 * picture. Knows nothing of Vue or the game.
 */
import type { AreaThing } from './areaThings'
import type { AreaBox } from './roomMotion'
import { boxRect, type PictureSize, type Rect } from './roomMotionScene'

/** A thing with its mark: `x`, `y` the mark's place and `rect` the part of the thing in view, in stage pixels. */
export interface PlacedName extends AreaThing {
  x: number
  y: number
  rect: Rect
}

/** A name's place: its top-left corner and size, and the thin line back to its mark when it had to move (null when it sits by its mark). */
export interface NamedSpot extends PlacedName {
  left: number
  top: number
  width: number
  height: number
  leader: { x1: number; y1: number; x2: number; y2: number } | null
}

/** The gap between a mark and its name. */
const GAP = 10
/** The gap kept between names, and between a name and a button. */
const MARGIN = 3
/** How far a moved name may stray from its mark, in steps of `STEP`. */
const STEP = 12
const RINGS = 40

/**
 * The things that have a placed box and are in view of `view` (the stage, which
 * shows the `picture` trimmed to fill it), each with the middle of the part in
 * view as its mark. A thing with no box, or wholly out of view, is left out.
 */
export function placeNames(
  things: readonly AreaThing[],
  boxes: Readonly<Record<string, AreaBox>>,
  view: PictureSize,
  picture: PictureSize,
): PlacedName[] {
  const placed: PlacedName[] = []
  for (const thing of things) {
    const box = boxes[thing.areaId]
    if (!box) continue
    const rect = boxRect(box, view, picture)
    if (!rect) continue
    placed.push({
      ...thing,
      x: rect.x + rect.w / 2,
      y: rect.y + rect.h / 2,
      rect,
    })
  }
  return placed
}

/** The placed thing under (`x`, `y`): the smallest when several overlap, null over nothing. */
export function nameAt(
  placed: readonly PlacedName[],
  x: number,
  y: number,
): PlacedName | null {
  let found: PlacedName | null = null
  for (const entry of placed) {
    const { rect } = entry
    if (x < rect.x || x > rect.x + rect.w || y < rect.y || y > rect.y + rect.h)
      continue
    if (!found || rect.w * rect.h < found.rect.w * found.rect.h) found = entry
  }
  return found
}

/** What a press on the picture goes to: the direction of a way out, and whether the way is open right now. */
export interface WayPress {
  direction: string
  open: boolean
}

/**
 * The placed exit areas that are not open now (`declared` ids against the
 * `open` things), as things with no name, each with the direction the game is
 * asked for (`exit-secret-passage` goes `secret_passage`). They are drawn as
 * plain painting and only answer a press.
 */
export function closedWayThings(
  declared: readonly string[],
  open: readonly AreaThing[],
  boxes: Readonly<Record<string, AreaBox>>,
): AreaThing[] {
  const isOpen = new Set(open.map((thing) => thing.areaId))
  return declared
    .filter((id) => id.startsWith('exit-') && id in boxes && !isOpen.has(id))
    .map((id) => ({
      areaId: id,
      label: '',
      kind: 'exit' as const,
      direction: id.slice('exit-'.length).replaceAll('-', '_'),
    }))
}

/**
 * The way a press at (`x`, `y`) goes: the smallest named thing or open way
 * there wins (a thing that is not a way means no way); only over nothing
 * named does a closed way answer, so one never answers from beneath a thing.
 */
export function pressAt(
  placed: readonly PlacedName[],
  closed: readonly PlacedName[],
  x: number,
  y: number,
): WayPress | null {
  const hit = nameAt(placed, x, y)
  if (hit) {
    return hit.kind === 'exit' && hit.direction
      ? { direction: hit.direction, open: true }
      : null
  }
  const shut = nameAt(closed, x, y)
  return shut?.direction ? { direction: shut.direction, open: false } : null
}

/** Whether two rectangles overlap, with `MARGIN` kept between them. */
function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w + MARGIN &&
    b.x < a.x + a.w + MARGIN &&
    a.y < b.y + b.h + MARGIN &&
    b.y < a.y + a.h + MARGIN
  )
}

/** `rect` moved to lie wholly inside the `bounds`. */
function inside(rect: Rect, bounds: { w: number; h: number }): Rect {
  return {
    ...rect,
    x: Math.max(0, Math.min(bounds.w - rect.w, rect.x)),
    y: Math.max(0, Math.min(bounds.h - rect.h, rect.y)),
  }
}

/**
 * Give every placed name its spot, in order. A name sits just above its mark,
 * centred (nearer the foot it is above the mark all the same, kept inside the
 * edge); one that would overlap an earlier name or an obstacle (a button, a
 * plate, the words) goes to the nearest free spot around its mark, with a thin
 * line back to the mark. If no spot is free the one with least overlap is
 * kept, also with its line.
 */
export function layoutNames(
  placed: readonly PlacedName[],
  measure: (label: string) => { w: number; h: number },
  obstacles: readonly Rect[],
  bounds: { w: number; h: number },
): NamedSpot[] {
  const taken: Rect[] = [...obstacles]
  const spots: NamedSpot[] = []
  for (const entry of placed) {
    const { w, h } = measure(entry.label)
    const wanted = inside(
      { x: entry.x - w / 2, y: entry.y - GAP - h, w, h },
      bounds,
    )
    let chosen = wanted
    let moved = false
    if (taken.some((t) => overlaps(wanted, t))) {
      moved = true
      let best: { rect: Rect; cost: number } | null = null
      search: for (let ring = 1; ring <= RINGS; ring++) {
        const d = ring * STEP
        for (const [dx, dy] of ringOffsets(d, w)) {
          const rect = inside(
            { x: entry.x - w / 2 + dx, y: entry.y - GAP - h + dy, w, h },
            bounds,
          )
          const cost = taken.filter((t) => overlaps(rect, t)).length
          if (cost === 0) {
            best = { rect, cost }
            break search
          }
          if (!best || cost < best.cost) best = { rect, cost }
        }
      }
      chosen = best?.rect ?? wanted
    }
    taken.push(chosen)
    spots.push({
      ...entry,
      left: chosen.x,
      top: chosen.y,
      width: chosen.w,
      height: chosen.h,
      leader: moved ? leaderFor(entry, chosen) : null,
    })
  }
  return spots
}

/** The offsets to try at distance `d` from the wanted spot: below, either side, above, then the corners. */
function ringOffsets(d: number, w: number): Array<[number, number]> {
  const side = d + w / 2
  return [
    [0, d],
    [0, -d],
    [side, 0],
    [-side, 0],
    [side, d],
    [-side, d],
    [side, -d],
    [-side, -d],
  ]
}

/** The line from the mark to the nearest point of its name's rectangle. */
function leaderFor(
  entry: PlacedName,
  rect: Rect,
): { x1: number; y1: number; x2: number; y2: number } {
  return {
    x1: entry.x,
    y1: entry.y,
    x2: Math.max(rect.x, Math.min(rect.x + rect.w, entry.x)),
    y2: Math.max(rect.y, Math.min(rect.y + rect.h, entry.y)),
  }
}
