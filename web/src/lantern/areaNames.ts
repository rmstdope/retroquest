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
  /** True for a mark that found no free picture beside the words and stands on their nearest edge, half over them (`clearOfWords`). */
  onWords?: true
}

/** A name's place: its top-left corner and size, and the thin line back to its mark when it had to move (null when it sits by its mark). */
export interface NamedSpot extends PlacedName {
  left: number
  top: number
  width: number
  height: number
  leader: { x1: number; y1: number; x2: number; y2: number } | null
  /** True when the words are open and no free spot lies near the mark: the mark stays, the name and its line are left off. */
  leftOff?: true
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
    // Moved only when pushed more than a mark's radius off its point (or, with
    // none, off the middle of what is in view): merely trimmed by the drift's
    // edge, a mark still stands on its thing.
    const wantedX = entry.point?.x ?? (x0 + x1) / 2
    const wantedY = entry.point?.y ?? (y0 + y1) / 2
    const moved = Math.hypot(x - wantedX, y - wantedY) > MARK_RADIUS
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
  return !isFree(pointBox(x, y), [panel], REACH)
}

/** Whether (`x`, `y`) lies under the words' rectangle `words`, where a mark would be covered. */
function inWords(x: number, y: number, words: Rect): boolean {
  return !isFree(pointBox(x, y), [words], ON_EDGE)
}

/**
 * The marks of `marks` moved clear of the `panels` (the room plate and the
 * buttons in the picture's corner, in the layer's pixels). A mark under a
 * panel steps to the nearest spot just outside it, straight below, above or
 * to either side, that is on the `visible` part (a spot that lands under another
 * panel goes on past it); a
 * panel that spans the width leaves only below or above. A spot under the
 * `words` (where the mark would be covered; `clearOfWords` moves it on) is taken only when no other is
 * clear. A mark under no panel stays; one with no such spot is left where it
 * is. `rect`, what can be pressed, stays whole, so a thing wholly under a
 * panel is still marked.
 */
export function clearOfPanels(
  marks: readonly PlacedName[],
  panels: readonly Rect[],
  visible: Rect,
  words: readonly Rect[] = [],
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
    let bestHidden = true
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
      const hidden = words.some((r) => inWords(kx, ky, r))
      if (
        !best ||
        (bestHidden && !hidden) ||
        (hidden === bestHidden &&
          Math.hypot(kx - x, ky - y) < Math.hypot(best[0] - x, best[1] - y))
      ) {
        best = [kx, ky]
        bestHidden = hidden
      }
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

/**
 * The marks of `marks` that lie under the `words` (the narrator's cards and
 * spoken lines in view) moved out from under them, so the thing keeps a dot
 * that can be seen and pressed. Such a mark steps straight above or below the
 * words to the nearest spot just outside them (`REACH` from their edge; a spot
 * under further words goes on past them), on the `visible` part and under none
 * of the `panels`; below wins a tie. Where neither side has such a spot the mark
 * stands on the nearest edge of the words, straight above or below its thing,
 * half over them, and is flagged `onWords`. `rect`, what can be pressed,
 * stays whole; a mark under no words stays.
 */
export function clearOfWords(
  marks: readonly PlacedName[],
  words: readonly Rect[],
  panels: readonly Rect[],
  visible: Rect,
): PlacedName[] {
  const left = visible.x + MARK_RADIUS
  const right = visible.x + visible.w - MARK_RADIUS
  const top = visible.y + MARK_RADIUS
  const bottom = visible.y + visible.h - MARK_RADIUS
  /** The edge of the words past `y` in the direction `dir` (1 below, -1 above), taking in every words rect it runs into. */
  const edgeOf = (x: number, y: number, dir: 1 | -1): number => {
    let edge = y
    for (let hop = 0; hop <= words.length; hop++) {
      const next = words.find(
        (r) =>
          x >= r.x - REACH &&
          x <= r.x + r.w + REACH &&
          (dir > 0
            ? r.y <= edge + REACH && r.y + r.h > edge
            : r.y < edge && r.y + r.h >= edge - REACH),
      )
      if (!next) break
      edge = dir > 0 ? next.y + next.h : next.y
    }
    return edge
  }
  return marks.map((entry) => {
    const { x, y } = entry
    if (!words.some((r) => inWords(x, y, r))) return entry
    const kx = clamp(x, left, right)
    let best: number | null = null
    /** The edges to stand on: how far the dot would lie inside the words there, and whether a panel covers it. */
    const stands: Array<{ y: number; depth: number; panel: boolean }> = []
    for (const dir of [1, -1] as const) {
      const edge = edgeOf(x, y, dir)
      const ky = clamp(edge + dir * REACH, top, bottom)
      const clear =
        !words.some((r) => inWords(kx, ky, r)) &&
        !panels.some((p) => underPanel(kx, ky, p)) &&
        Math.abs(edge + dir * REACH - ky) <= REACH
      if (clear && (best === null || Math.abs(ky - y) < Math.abs(best - y)))
        best = ky
      const stand = clamp(edge, top, bottom)
      stands.push({
        y: stand,
        depth: Math.max(0, dir > 0 ? edge - stand : stand - edge),
        panel: panels.some((p) => underPanel(kx, stand, p)),
      })
    }
    const from = entry.from ?? { x, y }
    if (best !== null) return { ...entry, x: kx, y: best, from }
    // No free picture: the edge that is half over the words at most and under no panel, nearest first.
    const rank = (e: {
      y: number
      depth: number
      panel: boolean
    }): number[] => [
      Number(e.panel),
      Number(e.depth > MARK_RADIUS / 2),
      e.depth,
      Math.abs(e.y - y),
    ]
    const stand = stands.reduce((a, b) => {
      const ra = rank(a)
      const rb = rank(b)
      for (let i = 0; i < ra.length; i++)
        if (ra[i] !== rb[i]) return ra[i] < rb[i] ? a : b
      return a
    })
    return { ...entry, x: kx, y: stand.y, from, onWords: true as const }
  })
}

/** How far apart two marks' middles stand: a mark's 12 px and as much again of clear space. */
const MARK_APART = 24

/**
 * The marks of `marks` kept off every other mark, so two never land on each
 * other. Marks that stand on their things (no `from`) are placed first, from
 * left to right by where they stand (a tie keeps the input order); the further
 * left one keeps its place. Moved marks (they have a `from`) are placed after
 * them, from left to right by where their things lie, and give way to any mark
 * already placed. A mark that would stand within `MARK_APART` of one already
 * placed slides sideways along its line (down it, for a mark moved to the side
 * of a panel), onward in steps of `MARK_APART` to the first free spot, then to
 * the other side of where it landed when the line runs out, and only when the
 * whole line is full onto a row one `MARK_APART` further from where it came
 * from (below the line, for a mark that stands on its thing). A spot must be on
 * the `visible` part, under none of the `panels` and not under the `words`
 * (which would cover it); a spot the mark slides to keeps its whole dot
 * (`MARK_RADIUS` from its middle) off the words, so a press anywhere on it
 * reaches it. The words end a slide, which never goes across them: a mark
 * whose slide reaches them goes on to the next row further out rather than
 * to the other side, and tries the other side only when no row has a spot.
 * A mark with no such spot keeps where it is. A mark stepped out vertically
 * gives way level with the nearest mark it gives way to when it can, first
 * to the side its thing lies on (left when its thing lies left of that
 * mark's thing, else right). A mark standing on the edge of
 * the words (`onWords`) slides only along that edge, in the words' own band.
 */
export function keepMarksApart(
  marks: readonly PlacedName[],
  panels: readonly Rect[],
  visible: Rect,
  words: readonly Rect[] = [],
): PlacedName[] {
  const left = visible.x + MARK_RADIUS
  const right = visible.x + visible.w - MARK_RADIUS
  const top = visible.y + MARK_RADIUS
  const bottom = visible.y + visible.h - MARK_RADIUS
  /** Where each mark was placed, and the x of the thing it stands for. */
  const placedAt: Array<[number, number, number]> = []
  const order = marks
    .map((entry, index) => ({ entry, index }))
    .sort(
      (a, b) =>
        Number(!!a.entry.from) - Number(!!b.entry.from) ||
        (a.entry.from?.x ?? a.entry.x) - (b.entry.from?.x ?? b.entry.x) ||
        a.index - b.index,
    )
  const result = [...marks]
  const underWords = (x: number, y: number): boolean =>
    words.some((r) => inWords(x, y, r))
  /** Whether a dot with its middle at (`x`, `y`) would lie even partly under the words. */
  const touchesWords = (x: number, y: number): boolean =>
    !isFree(pointBox(x, y), words, MARK_RADIUS)
  // A mark standing on its thing, clear of every other such mark, holds its
  // own spot: no mark that slides lands on it, so it never has to move.
  const holding = marks.filter(
    (entry, i) =>
      !entry.from &&
      !underWords(entry.x, entry.y) &&
      marks.every(
        (other, j) =>
          i === j ||
          !!other.from ||
          Math.hypot(other.x - entry.x, other.y - entry.y) >= MARK_APART - 0.5,
      ),
  )
  const free = (x: number, y: number, self: PlacedName): boolean =>
    holding.every(
      (h) => h === self || Math.hypot(h.x - x, h.y - y) >= MARK_APART - 0.5,
    ) &&
    x >= left - 0.5 &&
    x <= right + 0.5 &&
    y >= top - 0.5 &&
    y <= bottom + 0.5 &&
    !panels.some((panel) => underPanel(x, y, panel)) &&
    (self.onWords
      ? Math.abs(y - self.y) < 0.5 &&
        words.some((r) => x >= r.x && x <= r.x + r.w)
      : Math.hypot(x - self.x, y - self.y) < 0.5
        ? !underWords(x, y)
        : !touchesWords(x, y)) &&
    placedAt.every(([px, py]) => Math.hypot(px - x, py - y) >= MARK_APART - 0.5)
  for (const { entry, index } of order) {
    // A mark standing on its thing under the words (none, once `clearOfWords` has run) is covered with them: it
    // stays, and neither moves nor pushes another.
    if (!entry.from && underWords(entry.x, entry.y)) continue
    const from = entry.from ?? entry
    const sideways =
      !entry.onWords && Math.abs(entry.x - from.x) > Math.abs(entry.y - from.y)
    // The line the mark slid along, and which way a further row lies.
    const along: [number, number] = sideways ? [0, 1] : [1, 0]
    const away: [number, number] = sideways
      ? [Math.sign(entry.x - from.x) || 1, 0]
      : [0, Math.sign(entry.y - from.y) || 1]
    const reach = Math.ceil(Math.max(visible.w, visible.h) / MARK_APART)
    // A mark stepped out vertically (from under a panel) gives way level with
    // the nearest mark it gives way to, first on the side its thing lies on
    // (compared with that mark's thing), so the order of the things is kept;
    // every other mark slides right first, along its own line.
    const stepped = !sideways && !!entry.from && !entry.onWords
    const blocker = placedAt
      .filter(
        ([px, py]) => Math.hypot(px - entry.x, py - entry.y) < MARK_APART - 0.5,
      )
      .sort(
        (a, b) =>
          Math.hypot(a[0] - entry.x, a[1] - entry.y) -
          Math.hypot(b[0] - entry.x, b[1] - entry.y),
      )[0]
    const first = stepped && blocker && from.x < blocker[2] ? -1 : 1
    const level = stepped && blocker ? blocker[1] - entry.y : 0
    let spot: [number, number] | null = null
    // The words end a slide: first the mark gives way a row further out
    // rather than to the other side of its neighbour; only when no row has a
    // spot does it try the other side as well. It never slides across them.
    find: for (const otherSide of [false, true]) {
      search: for (let row = 0; row <= reach; row++) {
        const bx = entry.x + away[0] * row * MARK_APART
        const by = entry.y + away[1] * row * MARK_APART
        slide: for (let n = 0; n <= reach * 2; n++) {
          // 0, then onward along the line, then the other side of where it landed.
          const back = n > reach
          const k = (back ? -(n - reach) : n) * first
          const cx = bx + along[0] * k * MARK_APART
          // At each step the level spot first, then the mark's own line.
          for (const lift of row === 0 && level !== 0 ? [level, 0] : [0]) {
            const cy = by + lift + along[1] * k * MARK_APART
            if (
              k !== 0 &&
              lift === 0 &&
              !entry.onWords &&
              touchesWords(cx, cy)
            ) {
              if (back || !otherSide) continue search
              n = reach
              continue slide
            }
            if (free(cx, cy, entry)) {
              spot = [cx, cy]
              break find
            }
          }
        }
      }
    }
    const [x, y] = spot ?? [entry.x, entry.y]
    placedAt.push([x, y, from.x])
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

/**
 * The one answer to "is this spot free": whether `box` (a mark's spot is a
 * zero-size box) lies clear of every one of the `obstacles` by at least
 * `margin`. A box that only touches an obstacle is free; one nearer than
 * `margin` (or overlapping it) is not. Every pass that places a mark or a name
 * asks this, so what the layer keeps clear of is one set of rectangles tested
 * one way.
 */
export function isFree(
  box: Rect,
  obstacles: readonly Rect[],
  margin = 0,
): boolean {
  return !obstacles.some(
    (o) =>
      box.x < o.x + o.w + margin &&
      o.x < box.x + box.w + margin &&
      box.y < o.y + o.h + margin &&
      o.y < box.y + box.h + margin,
  )
}

/** A margin so small that only a spot on an obstacle's very edge (or inside it) is taken: how a mark is "under" words. */
export const ON_EDGE = 1e-6

/** The zero-size box of the spot (`x`, `y`). */
function pointBox(x: number, y: number): Rect {
  return { x, y, w: 0, h: 0 }
}

/** Whether two rectangles overlap, with `MARGIN` kept between them. */
export function overlaps(a: Rect, b: Rect): boolean {
  return !isFree(a, [b], MARGIN)
}

/** `rect` moved to lie wholly inside the `bounds`. */
function inside(rect: Rect, bounds: Rect): Rect {
  return {
    ...rect,
    x: clamp(rect.x, bounds.x, bounds.x + bounds.w - rect.w),
    y: clamp(rect.y, bounds.y, bounds.y + bounds.h - rect.h),
  }
}

/** How far from its mark a name may be while the words are open (the nearest edge of the name to the mark), in pixels. */
export const NAME_REACH = 150

/** Whether the straight line from (`x1`, `y1`) to (`x2`, `y2`) passes through `rect` (touching its edge does not count). */
function crosses(
  line: { x1: number; y1: number; x2: number; y2: number },
  rect: Rect,
): boolean {
  const dx = line.x2 - line.x1
  const dy = line.y2 - line.y1
  const edges: Array<[number, number]> = [
    [-dx, line.x1 - rect.x],
    [dx, rect.x + rect.w - line.x1],
    [-dy, line.y1 - rect.y],
    [dy, rect.y + rect.h - line.y1],
  ]
  let enter = 0
  let leave = 1
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q <= 0) return false
    } else if (p < 0) {
      enter = Math.max(enter, q / p)
    } else {
      leave = Math.min(leave, q / p)
    }
  }
  return enter < leave || (enter === leave && enter > 0 && enter < 1)
}

/** The distance from a mark to the nearest edge of `rect`. */
function distanceTo(entry: PlacedName, rect: Rect): number {
  const dx = Math.max(rect.x - entry.x, 0, entry.x - (rect.x + rect.w))
  const dy = Math.max(rect.y - entry.y, 0, entry.y - (rect.y + rect.h))
  return Math.hypot(dx, dy)
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
 *
 * With `words` (the cards and spoken lines in view, which `obstacles` also
 * holds) a moved name must lie within `NAME_REACH` of its mark with its line
 * crossing none of them, and only a wholly free spot is taken: a name that has
 * none is `leftOff` (its mark stays, it has no name or line).
 */
export function layoutNames(
  placed: readonly PlacedName[],
  measure: (label: string) => { w: number; h: number },
  obstacles: readonly Rect[],
  bounds: Rect,
  words?: readonly Rect[],
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
    let leftOff = false
    if (cost(above) > 0) {
      if (cost(below) === 0) {
        chosen = below
      } else {
        moved = true
        let best: { rect: Rect; cost: number } | null = null
        search: for (let ring = 1; ring <= RINGS; ring++) {
          const d = ring * STEP
          // Past the reach every spot is too far: the search is over.
          if (words && d > NAME_REACH + w + h) break
          for (const [dx, dy] of ringOffsets(d, w)) {
            const rect = inside(
              { x: above.x + dx, y: above.y + dy, w, h },
              bounds,
            )
            const c = cost(rect)
            if (
              words &&
              (c > 0 ||
                distanceTo(entry, rect) > NAME_REACH ||
                words.some((r) => crosses(leaderFor(entry, rect), r)))
            )
              continue
            if (c === 0) {
              best = { rect, cost: c }
              break search
            }
            if (!best || c < best.cost) best = { rect, cost: c }
          }
        }
        if (words && !best) leftOff = true
        chosen = best?.rect ?? above
      }
    }
    if (leftOff) {
      spots.push({
        ...entry,
        left: chosen.x,
        top: chosen.y,
        width: chosen.w,
        height: chosen.h,
        leader: null,
        leftOff: true,
      })
      return
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
  entry: { x: number; y: number },
  rect: Rect,
): { x1: number; y1: number; x2: number; y2: number } {
  return {
    x1: entry.x,
    y1: entry.y,
    x2: Math.max(rect.x, Math.min(rect.x + rect.w, entry.x)),
    y2: Math.max(rect.y, Math.min(rect.y + rect.h, entry.y)),
  }
}

/** How far under the dot a revealed name hangs, and how near the foot of what can be seen it hangs above instead. */
const HANG_GAP = 18
const HANG_FOOT = 60
/** The room a revealed name keeps round it from a card, panel or name when it can. */
const HANG_ROOM = 3

/** Where a revealed name goes: its corner, the line back to its dot when it strays from it, and the shown names it lies over. */
export interface HungName {
  left: number
  top: number
  leader: { x1: number; y1: number; x2: number; y2: number } | null
  /** The `areaId`s of the shown `names` this name lies over (they fade back while it shows); empty when it is clear. */
  covers: string[]
}

/**
 * Where a name of `size` revealed at (`dot`) hangs. It takes the first spot
 * beside the dot (under it, or above it near the foot of the `visible` part,
 * then either side) that is clear of the `obstacles` (cards and panels) and of
 * every shown name in `names`; failing that the nearest clear spot round the
 * dot, with a line back to it; failing that the spot beside the dot that lies
 * least on the `panels` (the buttons and plates among the obstacles, which a
 * name never lies on while a spot on the words will do) and then least on the
 * obstacles, and the names it lies over are listed in `covers`.
 */
export function hangName(
  size: { w: number; h: number },
  dot: { x: number; y: number },
  obstacles: readonly Rect[],
  names: ReadonlyArray<{ areaId: string; rect: Rect }>,
  visible: Rect,
  panels: readonly Rect[] = [],
): HungName {
  const { w, h } = size
  const { x: left, y: top, w: across, h: down } = visible
  const pin = (l: number, t: number): { left: number; top: number } => ({
    left: clamp(l, left, left + across - w),
    top: clamp(t, top, top + down - h),
  })
  const above = dot.y > top + down - HANG_FOOT
  const centred = dot.x - w / 2
  const aboveTop = dot.y - HANG_GAP - h
  const belowTop = dot.y + HANG_GAP
  const beside = dot.y - h / 2
  // Slid in steps of 2px so a gap only a little taller than the name is still found.
  const slides = [0, 2, -2, 4, -4, 6, -6, 8, -8, 10, -10, 12, -12]
  const tries = [
    pin(centred, above ? aboveTop : belowTop),
    pin(centred, above ? belowTop : aboveTop),
    ...slides.map((d) => pin(dot.x + HANG_GAP, beside + d)),
    ...slides.map((d) => pin(dot.x - HANG_GAP - w, beside + d)),
  ]
  const lie = (
    at: { left: number; top: number },
    pad: number,
    rs: readonly Rect[],
  ): number =>
    rs.reduce((sum, o) => {
      const x =
        Math.min(at.left + w + pad, o.x + o.w) - Math.max(at.left - pad, o.x)
      const y =
        Math.min(at.top + h + pad, o.y + o.h) - Math.max(at.top - pad, o.y)
      return x > 0 && y > 0 ? sum + x * y : sum
    }, 0)
  const boxes = [...obstacles, ...names.map((n) => n.rect)]
  const clear = (at: { left: number; top: number }, pad: number): boolean =>
    isFree({ x: at.left, y: at.top, w, h }, boxes, pad)
  const near =
    tries.find((t) => clear(t, HANG_ROOM)) ?? tries.find((t) => clear(t, 0))
  if (near) return { ...near, leader: null, covers: [] }
  const wanted = pin(centred, above ? aboveTop : belowTop)
  for (let ring = 1; ring <= RINGS; ring++) {
    const side = ring * STEP + w / 2
    // The ring's own spots, then either side level with the dot (where a line runs straight to it).
    const offsets: Array<[number, number]> = [
      ...ringOffsets(ring * STEP, w),
      [side, beside - wanted.top],
      [-side, beside - wanted.top],
    ]
    for (const [dx, dy] of offsets) {
      const at = pin(wanted.left + dx, wanted.top + dy)
      if (!clear(at, HANG_ROOM)) continue
      const rect = { x: at.left, y: at.top, w, h }
      const leader = leaderFor(dot, rect)
      // Near the dot, with a line that crosses no card, panel or name.
      if (
        Math.hypot(leader.x2 - dot.x, leader.y2 - dot.y) > NAME_REACH ||
        boxes.some((b) => crosses(leader, b))
      )
        continue
      return { ...at, leader, covers: [] }
    }
  }
  const cost = (at: { left: number; top: number }): [number, number] => [
    lie(at, 0, panels),
    lie(at, 0, obstacles),
  ]
  const best = tries.reduce((a, b) => {
    const [panelB, allB] = cost(b)
    const [panelA, allA] = cost(a)
    return panelB < panelA || (panelB === panelA && allB < allA) ? b : a
  })
  const covers = names
    .filter((n) => overlaps({ x: best.left, y: best.top, w, h }, n.rect))
    .map((n) => n.areaId)
  return { ...best, leader: null, covers }
}
