import { vi } from 'vitest'

/**
 * Replaces `Math.random` with a sequence that is the same every time it is
 * called with the same `seed` (the Park-Miller generator), so a test of
 * something random runs on the same numbers every run. The caller hands the
 * real one back with `vi.restoreAllMocks()`.
 */
export function seedRandom(seed = 7): void {
  let state = seed
  vi.spyOn(Math, 'random').mockImplementation(
    () => (state = (state * 16807) % 2147483647) / 2147483647,
  )
}
