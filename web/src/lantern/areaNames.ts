/**
 * Where the room picture's marks and names go, as pure geometry: which placed
 * things are in view of a picture trimmed to fill its stage, where the mark of
 * each sits, which thing the pointer is over, and where each name goes so no
 * two names, and no name and button, overlap and every name stays on the part
 * of the picture that can be seen. Knows nothing of Vue or the game.
 */
import type { AreaThing } from './areaThings'
import type { AreaBox } from './roomMotion'
import {
  boxRect,
  pointPosition,
  type PictureSize,
  type Rect,
} from './roomMotionScene'

/** A thing with its mark: `x`, `y` the mark's place, `rect` the part of the thing in view and `point` the mark point chosen in the studio (absent: the middle), in stage pixels. */
export interface PlacedName extends AreaThing {
  x: number
  y: number
  rect: Rect
  point?: { x: number; y: number }
}

/** A name's place: its top-left corner and size, and the thin line back to its mark when it had to move (null when it sits by its mark). */
export interface NamedSpot extends PlacedName {
  left: number
  top: number
  width: number
  height: number
  leader: { x1: number; y1: number; x2: number; y2: number } | null
}

/** The peak of the picture's drift (`lq-drift` in `StagePicture.vue`): how much larger, and how far over as a share of its size. */
const DRIFT_SCALE = 1.03
const DRIFT_SHIFT_X = -0.005
const DRIFT_SHIFT_Y = -0.003
/** How far a mark's middle is kept in from the edge of the visible part: half the 12 px mark and a little of its glow. */
const MARK_RADIUS = 8

/** How far outside a panel a stepped mark's middle stands, beyond the mark's own radius. */
const PANEL_GAP = 4
/** How close to a panel a mark's middle may stand: a stepped mark stands exactly this far from it. */
const REACH = MARK_RADIUS + PANEL_GAP

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
 * view as its mark, and the studio's mark point beside it when one was chosen. A thing with no box, or wholly out of view, is left out.
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
      ...(box.mark ? { point: pointPosition(box.mark, view, picture) } : {}),
    })
  }
  return placed
}

/**
 * The part of the layer the marks and names may use, in the layer's pixels: on
 * the stage at every moment of the picture's drift, and above the `footCover`
 * pixels at the stage's foot that lie over the picture (the action bar). The
 * layer has the stage's own size; the drift only ever pulls its edges out of
 * sight, furthest at its peak.
 */
export function visiblePart(view: PictureSize, footCover: number): Rect {
  const atPeak = (at: number, size: number, shift: number): number =>
    size / 2 + (at - size / 2) / DRIFT_SCALE - shift * size
  const x = Math.max(0, atPeak(0, view.width, DRIFT_SHIFT_X))
  const y = Math.max(0, atPeak(0, view.height, DRIFT_SHIFT_Y))
  const right = Math.min(
    view.width,
    atPeak(view.width, view.width, DRIFT_SHIFT_X),
  )
  const foot = view.height - footCover
  const bottom = Math.min(foot, atPeak(foot, view.height, DRIFT_SHIFT_Y))
  return { x, y, w: Math.max(0, right - x), h: Math.max(0, bottom - y) }
}

/** `value` held between `low` and `high` (`low` when they cross). */
function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value))
}

/**
 * The things with some part on the `visible` part of the picture, each with its
 * mark on its chosen point, or at the middle of that part when it has none; a
 * point out of sight moves to the nearest spot of the part that is, and the
 * mark is wholly on the visible part. A thing with no part
 * there is left out. `rect`, what the pointer can be over, stays whole.
 */
export function markInside(
  placed: readonly PlacedName[],
  visible: Rect,
): PlacedName[] {
  const marked: PlacedName[] = []
  for (const entry of placed) {
    const { rect } = entry
    const x0 = Math.max(rect.x, visible.x)
    const y0 = Math.max(rect.y, visible.y)
    const x1 = Math.min(rect.x + rect.w, visible.x + visible.w)
    const y1 = Math.min(rect.y + rect.h, visible.y + visible.h)
    if (x1 - x0 < 1 || y1 - y0 < 1) continue
    marked.push({
      ...entry,
      x: clamp(
        clamp(entry.point?.x ?? (x0 + x1) / 2, x0, x1),
        visible.x + MARK_RADIUS,
        visible.x + visible.w - MARK_RADIUS,
      ),
      y: clamp(
        clamp(entry.point?.y ?? (y0 + y1) / 2, y0, y1),
        visible.y + MARK_RADIUS,
        visible.y + visible.h - MARK_RADIUS,
      ),
    })
  }
  return marked
}

/** Whether (`x`, `y`) lies under `panel`, grown by `REACH` so a mark's glow never touches it. */
function underPanel(x: number, y: number, panel: Rect): boolean {
  return (
    x > panel.x - REACH &&
    x < panel.x + panel.w + REACH &&
    y > panel.y - REACH &&
    y < panel.y + panel.h + REACH
  )
}

/**
 * The marks of `marks` moved clear of the `panels` (the room plate and the
 * buttons in the picture's corner, in the layer's pixels). A mark under a
 * panel steps to the nearest spot just outside it, straight below, above or
 * to either side, that is on the `visible` part (a spot that lands under another
 * panel goes on past it); a
 * panel that spans the width leaves only below or above. A mark under no panel
 * stays; one with no such spot is left where it is. `rect`, what can be
 * pressed, stays whole, so a thing wholly under a panel is still marked.
 */
export function clearOfPanels(
  marks: readonly PlacedName[],
  panels: readonly Rect[],
  visible: Rect,
): PlacedName[] {
  const left = visible.x + MARK_RADIUS
  const right = visible.x + visible.w - MARK_RADIUS
  const top = visible.y + MARK_RADIUS
  const bottom = visible.y + visible.h - MARK_RADIUS
  const reach = REACH
  /** The spot just outside `panel` in the direction (`dx`, `dy`), moved on past any panel it lands under. */
  const outside = (
    x: number,
    y: number,
    panel: Rect,
    dx: number,
    dy: number,
  ): [number, number] => {
    let edge = panel
    let spot: [number, number] = [x, y]
    for (let hop = 0; hop <= panels.length; hop++) {
      spot = [
        dx === 0 ? x : dx > 0 ? edge.x + edge.w + reach : edge.x - reach,
        dy === 0 ? y : dy > 0 ? edge.y + edge.h + reach : edge.y - reach,
      ]
      const next = panels.find((p) => underPanel(spot[0], spot[1], p))
      if (!next) break
      edge = next
    }
    return spot
  }
  return marks.map((entry) => {
    const { x, y } = entry
    const under = panels.find((panel) => underPanel(x, y, panel))
    if (!under) return entry
    let best: [number, number] | null = null
    for (const [dx, dy] of [
      [0, 1],
      [1, 0],
      [-1, 0],
      [0, -1],
    ]) {
      const [cx, cy] = outside(x, y, under, dx, dy)
      if (cx < left - reach || cx > right + reach) continue
      if (cy < top - reach || cy > bottom + reach) continue
      const kx = clamp(cx, left, right)
      const ky = clamp(cy, top, bottom)
      if (panels.some((panel) => underPanel(kx, ky, panel))) continue
      if (
        !best ||
        Math.hypot(kx - x, ky - y) < Math.hypot(best[0] - x, best[1] - y)
      )
        best = [kx, ky]
    }
    return best ? { ...entry, x: best[0], y: best[1] } : entry
  })
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
    .map((id) => {
      const direction = id.slice('exit-'.length).replaceAll('-', '_')
      return {
        areaId: id,
        name: direction,
        label: '',
        kind: 'exit' as const,
        direction,
      }
    })
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
function inside(rect: Rect, bounds: Rect): Rect {
  return {
    ...rect,
    x: clamp(rect.x, bounds.x, bounds.x + bounds.w - rect.w),
    y: clamp(rect.y, bounds.y, bounds.y + bounds.h - rect.h),
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
  bounds: Rect,
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
