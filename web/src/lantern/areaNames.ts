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
  /** Where the mark would have stood had it not been moved (off a panel, or in off the edge of what can be seen); absent when it was never moved. */
  from?: { x: number; y: number }
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
    const x = clamp(
      clamp(entry.point?.x ?? (x0 + x1) / 2, x0, x1),
      visible.x + MARK_RADIUS,
      visible.x + visible.w - MARK_RADIUS,
    )
    const y = clamp(
      clamp(entry.point?.y ?? (y0 + y1) / 2, y0, y1),
      visible.y + MARK_RADIUS,
      visible.y + visible.h - MARK_RADIUS,
    )
    const wantedX = entry.point?.x ?? rect.x + rect.w / 2
    const wantedY = entry.point?.y ?? rect.y + rect.h / 2
    const moved = Math.abs(x - wantedX) > 0.5 || Math.abs(y - wantedY) > 0.5
    marked.push({
      ...entry,
      x,
      y,
      ...(moved ? { from: { x: wantedX, y: wantedY } } : {}),
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
    return best
      ? {
          ...entry,
          x: best[0],
          y: best[1],
          from: entry.from ?? { x, y },
        }
      : entry
  })
}

/** How far apart two moved marks' middles stand: a mark's 12 px and as much again of clear space. */
const MARK_APART = 24

/**
 * The marks of `marks` that were moved (they have a `from`) kept off every
 * other mark, so two never land on each other. A mark that was never moved
 * stays exactly where it is, and a moved one gives way to it. Moved marks are
 * placed from left to right by where their things lie; one that would stand
 * within `MARK_APART` of a mark already placed slides sideways along its line
 * (down it, for a mark moved to the side of a panel) to the nearest free spot
 * on the near side, then to the other side of where it landed when the line
 * runs out, and only when the whole line is full onto a row one `MARK_APART`
 * further from where it came from. A spot must be on the `visible` part and
 * under none of the `panels`; a mark with no such spot keeps where it is.
 */
export function keepMarksApart(
  marks: readonly PlacedName[],
  panels: readonly Rect[],
  visible: Rect,
): PlacedName[] {
  const left = visible.x + MARK_RADIUS
  const right = visible.x + visible.w - MARK_RADIUS
  const top = visible.y + MARK_RADIUS
  const bottom = visible.y + visible.h - MARK_RADIUS
  const placedAt: Array<[number, number]> = marks
    .filter((entry) => !entry.from)
    .map((entry) => [entry.x, entry.y])
  const order = marks
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.from)
    .sort(
      (a, b) =>
        (a.entry.from?.x ?? 0) - (b.entry.from?.x ?? 0) || a.index - b.index,
    )
  const result = [...marks]
  const free = (x: number, y: number): boolean =>
    x >= left - 0.5 &&
    x <= right + 0.5 &&
    y >= top - 0.5 &&
    y <= bottom + 0.5 &&
    !panels.some((panel) => underPanel(x, y, panel)) &&
    placedAt.every(([px, py]) => Math.hypot(px - x, py - y) >= MARK_APART - 0.5)
  for (const { entry, index } of order) {
    const from = entry.from ?? entry
    const sideways = Math.abs(entry.x - from.x) > Math.abs(entry.y - from.y)
    // The line the mark slid along, and which way a further row lies.
    const along: [number, number] = sideways ? [0, 1] : [1, 0]
    const away: [number, number] = sideways
      ? [Math.sign(entry.x - from.x) || 1, 0]
      : [0, Math.sign(entry.y - from.y) || 1]
    const reach = Math.ceil(Math.max(visible.w, visible.h) / MARK_APART)
    let spot: [number, number] | null = null
    search: for (let row = 0; row <= reach; row++) {
      const bx = entry.x + away[0] * row * MARK_APART
      const by = entry.y + away[1] * row * MARK_APART
      for (let n = 0; n <= reach * 2; n++) {
        // 0, then onward along the line, then the other side of where it landed.
        const k = n <= reach ? n : -(n - reach)
        const cx = bx + along[0] * k * MARK_APART
        const cy = by + along[1] * k * MARK_APART
        if (free(cx, cy)) {
          spot = [cx, cy]
          break search
        }
      }
    }
    const [x, y] = spot ?? [entry.x, entry.y]
    placedAt.push([x, y])
    result[index] = { ...entry, x, y }
  }
  return result
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

/** The radius of a mark's dot as drawn (half the 12 px mark); no name may lie over it. */
const DOT_RADIUS = 6
/** What covering a thing costs a name that finds no free spot: its own dot worst, another's next, anything else least. */
const OWN_DOT_COST = 10000
const OTHER_DOT_COST = 1000

/** The square a mark's dot takes up. */
function dotOf(entry: PlacedName): Rect {
  return {
    x: entry.x - DOT_RADIUS,
    y: entry.y - DOT_RADIUS,
    w: DOT_RADIUS * 2,
    h: DOT_RADIUS * 2,
  }
}

/**
 * Give every placed name its spot, in order. A name sits just above its mark,
 * centred (kept inside the edge); if that overlaps an earlier name, an obstacle
 * (a button, a plate, the words) or any mark's dot, it sits just below, centred
 * and with no line; if that is taken too it goes to the nearest free spot
 * around its mark, with a thin line back to the mark. If no spot is free the
 * one with least overlap is kept, also with its line, where covering a dot
 * counts for more than covering anything else and covering its own dot for most.
 */
export function layoutNames(
  placed: readonly PlacedName[],
  measure: (label: string) => { w: number; h: number },
  obstacles: readonly Rect[],
  bounds: Rect,
): NamedSpot[] {
  const taken: Rect[] = [...obstacles]
  const dots = placed.map(dotOf)
  const spots: NamedSpot[] = []
  placed.forEach((entry, index) => {
    const { w, h } = measure(entry.label)
    const cost = (rect: Rect): number =>
      taken.filter((t) => overlaps(rect, t)).length +
      dots.reduce(
        (sum, dot, i) =>
          overlaps(rect, dot)
            ? sum + (i === index ? OWN_DOT_COST : OTHER_DOT_COST)
            : sum,
        0,
      )
    const above = inside(
      { x: entry.x - w / 2, y: entry.y - GAP - h, w, h },
      bounds,
    )
    const below = inside({ x: entry.x - w / 2, y: entry.y + GAP, w, h }, bounds)
    let chosen = above
    let moved = false
    if (cost(above) > 0) {
      if (cost(below) === 0) {
        chosen = below
      } else {
        moved = true
        let best: { rect: Rect; cost: number } | null = null
        search: for (let ring = 1; ring <= RINGS; ring++) {
          const d = ring * STEP
          for (const [dx, dy] of ringOffsets(d, w)) {
            const rect = inside(
              { x: above.x + dx, y: above.y + dy, w, h },
              bounds,
            )
            const c = cost(rect)
            if (c === 0) {
              best = { rect, cost: c }
              break search
            }
            if (!best || c < best.cost) best = { rect, cost: c }
          }
        }
        chosen = best?.rect ?? above
      }
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
  })
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
