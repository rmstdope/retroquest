/** Where an element is drawn: the parts of its bounding box the grid walk needs. */
export interface GridRect {
  left: number
  top: number
  width: number
}

/** The arrow keys the grid walk answers. */
export type GridKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'

/** Two tops closer than this (in pixels) are the same row. */
const SAME_ROW = 4

/** The centre of a rect, sideways. */
function centre(rect: GridRect): number {
  return rect.left + rect.width / 2
}

/** The indexes of the rects in each row, rows top to bottom, each row left to right. */
function rows(rects: GridRect[]): number[][] {
  const order = rects
    .map((_, i) => i)
    .sort((a, b) => rects[a].top - rects[b].top)
  const result: number[][] = []
  for (const i of order) {
    const row = result.at(-1)
    if (row && Math.abs(rects[row[0]].top - rects[i].top) < SAME_ROW)
      row.push(i)
    else result.push([i])
  }
  for (const row of result) row.sort((a, b) => rects[a].left - rects[b].left)
  return result
}

/** The member of `row` whose centre is nearest to `x` (the left one on a tie). */
function nearest(rects: GridRect[], row: number[], x: number): number {
  let best = row[0]
  for (const i of row)
    if (Math.abs(centre(rects[i]) - x) < Math.abs(centre(rects[best]) - x))
      best = i
  return best
}

/**
 * The slot the ring goes to from `from` when an arrow key is pressed, walking
 * the grid as it is drawn (`rects`, one per slot that can take the ring, in
 * reading order). ← → move within the row and wrap inside it; ↑ ↓ go to the
 * slot directly above or below, or the nearest one in the neighbouring row,
 * and wrap round the ends: past the last slot is the first, before the first
 * is the last, and from any other end-row slot the nearest in the opposite end
 * row. Returns `from` when nothing moves.
 */
export function gridTarget(
  rects: GridRect[],
  from: number,
  key: GridKey,
): number {
  const all = rows(rects)
  const at = all.findIndex((row) => row.includes(from))
  if (at < 0) return from
  const row = all[at]
  if (key === 'ArrowLeft' || key === 'ArrowRight') {
    const step = key === 'ArrowRight' ? 1 : -1
    return row[(row.indexOf(from) + step + row.length) % row.length]
  }
  const down = key === 'ArrowDown'
  const next = at + (down ? 1 : -1)
  if (next >= 0 && next < all.length)
    return nearest(rects, all[next], centre(rects[from]))
  const last = rects.length - 1
  if (down && from === last) return 0
  if (!down && from === 0) return last
  const end = down ? all[0] : all[all.length - 1]
  return nearest(rects, end, centre(rects[from]))
}
