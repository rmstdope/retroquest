import type { MapPlace } from '@/engine'
import { displayName } from './displayName'

/** A place on the drawn map, at a grid cell (the layout starts from the current place at 0, 0; rows grow southwards). */
export interface MapBox {
  key: string
  name: string
  visited: boolean
  current: boolean
  col: number
  row: number
}

/** A path between two boxes. */
export interface MapPath {
  from: string
  to: string
  /** True when one end is a place not yet visited. */
  dashed: boolean
  /** The way's name for up, down and other named ways; null for the compass ways. */
  tag: string | null
}

/** The drawn map. */
export interface MapLayout {
  boxes: MapBox[]
  paths: MapPath[]
}

/** Grid step (columns, rows) for each way; up and down sit beside the place, to its right. */
const STEPS: Readonly<Record<string, readonly [number, number]>> = {
  north: [0, -1],
  east: [1, 0],
  south: [0, 1],
  west: [-1, 0],
  up: [1, -1],
  down: [1, 1],
}
/** Where any other named way (a secret passage) puts its place: diagonally beside, up and to the right first. */
const NAMED_WAY_STEPS: ReadonlyArray<readonly [number, number]> = [
  [1, -1],
  [-1, -1],
  [1, 1],
  [-1, 1],
]

/** Tags for the ways that are not on the compass. */
const WAY_TAGS: Readonly<Record<string, string>> = {
  up: '\u2191 Up',
  down: '\u2193 Down',
}

const COMPASS = ['north', 'east', 'south', 'west']

/** The grid steps (columns, rows) a way may put its place at, the best first. */
function stepsOf(direction: string): ReadonlyArray<readonly [number, number]> {
  return Object.hasOwn(STEPS, direction) ? [STEPS[direction]] : NAMED_WAY_STEPS
}

/** The tag a path carries for its way: none for the compass, the way's name for the rest. */
function tagOf(direction: string): string | null {
  if (COMPASS.includes(direction)) return null
  return Object.hasOwn(WAY_TAGS, direction)
    ? WAY_TAGS[direction]
    : displayName(direction)
}

/** How far (in columns and rows) a box reaches from its cell's centre: the box is 136 × 52 px in a 170 × 96 px cell. */
const HALF_WIDTH = 0.4
const HALF_HEIGHT = 0.27

/** True when the line from one box to another runs the way `direction` says (a compass way keeps its heading; other ways may go anywhere). */
function alignedWith(direction: string, from: MapBox, to: MapBox): boolean {
  if (!COMPASS.includes(direction)) return true
  const [dc, dr] = STEPS[direction]
  const dCol = to.col - from.col
  const dRow = to.row - from.row
  return (
    (dc === 0 ? dCol === 0 : Math.sign(dCol) === dc && dRow === 0) &&
    (dr === 0 ? dRow === 0 : Math.sign(dRow) === dr && dCol === 0)
  )
}

/** True when the straight line between two cells passes through the box of a third. */
function crossesBox(
  from: MapBox,
  to: MapBox,
  boxes: Iterable<MapBox>,
): boolean {
  for (const box of boxes) {
    if (box.key === from.key || box.key === to.key) continue
    for (let t = 0.05; t < 1; t += 0.05) {
      const col = from.col + (to.col - from.col) * t
      const row = from.row + (to.row - from.row) * t
      if (
        Math.abs(col - box.col) < HALF_WIDTH &&
        Math.abs(row - box.row) < HALF_HEIGHT
      )
        return true
    }
  }
  return false
}

/**
 * Lay the act's places out on a grid, the way the small map does: from the
 * current place outwards, each way putting its place one step north, east,
 * south or west (up and down diagonally to the right). When that cell is
 * taken, the map opens an empty column or row between the place and it,
 * moving the place and everything level with it or behind it one step back,
 * so the path stays one step long. Places seen but not visited are placed
 * from the visited places only, so they are leaves. Two places joined by a
 * way get one path, solid unless one end is unvisited; a path that could only
 * be drawn through another box is left out. Visited places the current place
 * cannot walk to are laid out beneath, from the first of them.
 */
export function layoutMap(places: MapPlace[]): MapLayout {
  const byKey = new Map(places.map((place) => [place.key, place]))
  const start = places.find((place) => place.current) ?? places[0]
  if (!start) return { boxes: [], paths: [] }
  const cells = new Map<string, MapBox>()
  const taken = new Set<string>()
  const put = (place: MapPlace, col: number, row: number): MapBox => {
    const box = {
      key: place.key,
      name: place.name,
      visited: place.visited,
      current: place.current,
      col,
      row,
    }
    cells.set(place.key, box)
    taken.add(`${col},${row}`)
    return box
  }
  const paths: MapPath[] = []
  const joined = new Set<string>()
  const freeAt = (col: number, row: number): boolean =>
    !taken.has(`${col},${row}`)
  /**
   * Make the cell one step (dc, dr) from a box free by opening an empty
   * column and/or row between the box and that cell: every box level with
   * the box, or behind it, moves one step back. Paths that cross the new gap
   * only grow longer and keep their heading.
   */
  const openBeside = (here: MapBox, dc: number, dr: number): void => {
    const origin = { col: here.col, row: here.row }
    for (const box of cells.values()) {
      if (dc !== 0 && (box.col - origin.col) * dc <= 0) box.col -= dc
      if (dr !== 0 && (box.row - origin.row) * dr <= 0) box.row -= dr
    }
    taken.clear()
    for (const box of cells.values()) taken.add(`${box.col},${box.row}`)
  }

  /** Lay out everything reachable from a placed box. */
  const spread = (first: MapPlace): void => {
    const queue: MapPlace[] = [first]
    for (let next = queue.shift(); next; next = queue.shift()) {
      const here = cells.get(next.key)
      if (!here) continue
      for (const [direction, exit] of Object.entries(next.exits)) {
        const there = byKey.get(exit.to)
        if (!there) continue
        let target = cells.get(there.key)
        if (!target) {
          const steps = stepsOf(direction)
          let placed = steps.find(([dc, dr]) =>
            freeAt(here.col + dc, here.row + dr),
          )
          if (!placed) {
            placed = steps[0]
            openBeside(here, placed[0], placed[1])
          }
          target = put(there, here.col + placed[0], here.row + placed[1])
          if (there.visited) queue.push(there)
        }
        if (!alignedWith(direction, here, target)) continue
        const pair = [here.key, target.key].sort().join('\n')
        if (joined.has(pair)) continue
        joined.add(pair)
        paths.push({
          from: here.key,
          to: target.key,
          dashed: !here.visited || !target.visited,
          tag: tagOf(direction),
        })
      }
    }
  }

  put(start, 0, 0)
  spread(start)
  for (const place of places) {
    if (cells.has(place.key) || !place.visited) continue
    const col = Math.min(...[...cells.values()].map((b) => b.col))
    // Room enough below for a chain that runs north from the group's first place.
    const unplaced = places.filter((p) => !cells.has(p.key)).length
    const row =
      Math.max(...[...cells.values()].map((b) => b.row)) + 2 + unplaced
    put(place, col, row)
    spread(place)
  }
  const boxes = [...cells.values()]
  return {
    boxes,
    paths: paths.filter((path) => {
      const from = cells.get(path.from)
      const to = cells.get(path.to)
      return !from || !to || !crossesBox(from, to, boxes)
    }),
  }
}
