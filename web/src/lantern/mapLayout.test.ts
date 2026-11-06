import { describe, it, expect } from 'vitest'
import type { MapPlace } from '@/engine'
import { layoutMap } from './mapLayout'

function place(
  key: string,
  visited: boolean,
  exits: Record<string, string> = {},
  current = false,
): MapPlace {
  return {
    key,
    name: key,
    visited,
    current,
    exits: Object.fromEntries(
      Object.entries(exits).map(([dir, to]) => [dir, { to, label: to }]),
    ),
  }
}

function at(
  layout: ReturnType<typeof layoutMap>,
  key: string,
): [number, number] {
  const box = layout.boxes.find((b) => b.key === key)
  if (!box) throw new Error(`no box ${key}`)
  return [box.col, box.row]
}

describe('layoutMap', () => {
  it('shows a lone place by itself', () => {
    const layout = layoutMap([place('a', true, {}, true)])
    expect(layout.boxes).toHaveLength(1)
    expect(layout.paths).toEqual([])
    expect(at(layout, 'a')).toEqual([0, 0])
  })

  it('lays the compass ways out north, east, south and west', () => {
    const layout = layoutMap([
      place('c', true, { north: 'n', east: 'e', south: 's', west: 'w' }, true),
      place('n', false),
      place('e', false),
      place('s', false),
      place('w', false),
    ])
    expect(at(layout, 'n')).toEqual([0, -1])
    expect(at(layout, 'e')).toEqual([1, 0])
    expect(at(layout, 's')).toEqual([0, 1])
    expect(at(layout, 'w')).toEqual([-1, 0])
  })

  it('puts up and down diagonally to the right, tagged', () => {
    const layout = layoutMap([
      place('c', true, { up: 'u', down: 'd', secret_passage: 'p' }, true),
      place('u', true),
      place('d', true),
      place('p', true),
    ])
    expect(at(layout, 'u')).toEqual([1, -1])
    expect(at(layout, 'd')).toEqual([1, 1])
    const tags = layout.paths.map((p) => p.tag)
    expect(tags).toEqual(['↑ Up', '↓ Down', 'Secret Passage'])
  })

  it('dashes a path only when one end is not visited, and tags no compass path', () => {
    const layout = layoutMap([
      place('a', true, { east: 'b', south: 'c' }, true),
      place('b', true, { west: 'a' }),
      place('c', false),
    ])
    expect(layout.paths).toHaveLength(2)
    const ab = layout.paths.find((p) => p.to === 'b')
    const ac = layout.paths.find((p) => p.to === 'c')
    expect(ab).toMatchObject({ dashed: false, tag: null })
    expect(ac).toMatchObject({ dashed: true, tag: null })
  })

  it('joins two visited places solidly even when one way was never walked', () => {
    const layout = layoutMap([
      place('a', true, { east: 'b' }, true),
      place('b', true),
    ])
    expect(layout.paths[0].dashed).toBe(false)
  })

  it('lengthens a path so that no two boxes overlap', () => {
    // Up from c lands on (1,-1), where east of n would also land.
    const layout = layoutMap([
      place('c', true, { north: 'n', up: 'u' }, true),
      place('n', true, { east: 'x' }),
      place('u', true),
      place('x', true),
    ])
    const cells = layout.boxes.map((b) => `${b.col},${b.row}`)
    expect(new Set(cells).size).toBe(cells.length)
    const [col, row] = at(layout, 'x')
    expect(row).toBe(-1)
    expect(col).toBeGreaterThan(1)
  })

  it('marks the current place', () => {
    const layout = layoutMap([
      place('a', true, { east: 'b' }),
      place('b', true, {}, true),
    ])
    expect(layout.boxes.filter((b) => b.current).map((b) => b.key)).toEqual([
      'b',
    ])
  })
})
