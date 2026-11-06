import type { MapPlace } from '@/engine'

/**
 * The directions that walk the player from the current place to `targetKey`
 * through the places already visited, the last step possibly entering a seen
 * place; the shortest such way, or null when there is none (or the target is
 * the current place).
 */
export function routeTo(
  places: MapPlace[],
  targetKey: string,
): string[] | null {
  const start = places.find((place) => place.current)
  if (!start || start.key === targetKey) return null
  const byKey = new Map(places.map((place) => [place.key, place]))
  const reached = new Map<string, string[]>([[start.key, []]])
  const queue: MapPlace[] = [start]
  for (let next = queue.shift(); next; next = queue.shift()) {
    const way = reached.get(next.key) ?? []
    for (const [direction, exit] of Object.entries(next.exits)) {
      if (reached.has(exit.to)) continue
      const there = byKey.get(exit.to)
      if (!there) continue
      reached.set(exit.to, [...way, direction])
      if (exit.to === targetKey) return reached.get(exit.to) ?? null
      if (there.visited) queue.push(there)
    }
  }
  return null
}
