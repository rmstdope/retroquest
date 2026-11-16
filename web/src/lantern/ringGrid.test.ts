import { describe, expect, it } from 'vitest'
import { gridTarget, type GridRect } from './ringGrid'

/** A grid of `count` cells, `cols` wide, 100x50 each. */
function grid(count: number, cols: number): GridRect[] {
  return Array.from({ length: count }, (_, i) => ({
    left: (i % cols) * 100,
    top: Math.floor(i / cols) * 50,
    width: 90,
  }))
}

describe('gridTarget', () => {
  it('moves right and left within a row, wrapping inside the row', () => {
    const g = grid(6, 2)
    expect(gridTarget(g, 0, 'ArrowRight')).toBe(1)
    expect(gridTarget(g, 1, 'ArrowRight')).toBe(0)
    expect(gridTarget(g, 0, 'ArrowLeft')).toBe(1)
    expect(gridTarget(g, 3, 'ArrowLeft')).toBe(2)
  })

  it('moves down to the slot below and up to the slot above', () => {
    const g = grid(6, 2)
    expect(gridTarget(g, 0, 'ArrowDown')).toBe(2)
    expect(gridTarget(g, 3, 'ArrowUp')).toBe(1)
    expect(gridTarget(g, 4, 'ArrowUp')).toBe(2)
  })

  it('goes to the nearest slot in the next row when nothing is directly below', () => {
    const g = [...grid(4, 2), { left: 0, top: 100, width: 90 }]
    expect(gridTarget(g, 3, 'ArrowDown')).toBe(4)
    expect(gridTarget(g, 4, 'ArrowUp')).toBe(2)
  })

  it('wraps past the last slot to the first and before the first to the last', () => {
    const g = grid(6, 2)
    expect(gridTarget(g, 5, 'ArrowDown')).toBe(0)
    expect(gridTarget(g, 0, 'ArrowUp')).toBe(5)
  })

  it('wraps from a non-final bottom-row slot to the nearest column of the top row', () => {
    const g = grid(6, 2)
    expect(gridTarget(g, 4, 'ArrowDown')).toBe(0)
    expect(gridTarget(g, 1, 'ArrowUp')).toBe(5)
  })

  it('uses one column on a narrow window and ignores left and right there', () => {
    const g = grid(3, 1)
    expect(gridTarget(g, 0, 'ArrowDown')).toBe(1)
    expect(gridTarget(g, 2, 'ArrowDown')).toBe(0)
    expect(gridTarget(g, 1, 'ArrowRight')).toBe(1)
  })

  it('stays put when there is a single slot', () => {
    expect(gridTarget(grid(1, 2), 0, 'ArrowDown')).toBe(0)
    expect(gridTarget(grid(1, 2), 0, 'ArrowLeft')).toBe(0)
  })
})
