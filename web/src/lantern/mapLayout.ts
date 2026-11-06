import type { MapPlace } from '@/engine'
import { displayName } from './displayName'

/** A place on the drawn map, at a grid cell (the current place is at 0, 0; rows grow southwards). */
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
/** Where any other named way (a secret passage) puts its place: up and to the right. */
const NAMED_WAY_STEP: readonly [number, number] = [1, -1]

/** Tags for the ways that are not on the compass. */
const WAY_TAGS: Readonly<Record<string, string>> = {
  up: '\u2191 Up',
  down: '\u2193 Down',
}

const COMPASS = ['north', 'east', 'south', 'west']

function stepOf(direction: string): readonly [number, number] {
  return Object.hasOwn(STEPS, direction) ? STEPS[direction] : NAMED_WAY_STEP
}

function tagOf(direction: string): string | null {
  if (COMPASS.includes(direction)) return null
  return Object.hasOwn(WAY_TAGS, direction)
    ? WAY_TAGS[direction]
    : displayName(direction)
}

/**
 * Lay the act's places out on a grid, the way the small map does: from the
 * current place outwards, each way putting its place one step north, east,
 * south or west (up and down diagonally to the right). A path grows longer,
 * in the same direction, until its place has a cell of its own. Places seen
 * but not visited are placed from the visited places only, so they are leaves.
 * Two places joined by a way get one path, solid unless one end is unvisited.
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
  put(start, 0, 0)
  const paths: MapPath[] = []
  const joined = new Set<string>()
  const queue: MapPlace[] = [start]
  for (let next = queue.shift(); next; next = queue.shift()) {
    const here = cells.get(next.key)
    if (!here) continue
    for (const [direction, exit] of Object.entries(next.exits)) {
      const there = byKey.get(exit.to)
      if (!there) continue
      let target = cells.get(there.key)
      if (!target) {
        const [dc, dr] = stepOf(direction)
        let length = 1
        while (taken.has(`${here.col + dc * length},${here.row + dr * length}`))
          length++
        target = put(there, here.col + dc * length, here.row + dr * length)
        if (there.visited) queue.push(there)
      }
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
  return { boxes: [...cells.values()], paths }
}
