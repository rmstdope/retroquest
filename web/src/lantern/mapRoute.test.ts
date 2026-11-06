import { describe, it, expect } from 'vitest'
import type { MapPlace } from '@/engine'
import { routeTo } from './mapRoute'

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

const PLACES: MapPlace[] = [
  place('well', true, { north: 'square', south: 'shed' }, true),
  place('square', true, { south: 'well', east: 'store' }),
  place('store', true, { west: 'square' }),
  place('shed', true, { north: 'well', south: 'mill' }),
  place('mill', true, { north: 'shed', east: 'path' }),
  place('path', false),
]

describe('routeTo', () => {
  it('walks through visited places', () => {
    expect(routeTo(PLACES, 'store')).toEqual(['north', 'east'])
  })

  it('ends with one step into a seen place', () => {
    expect(routeTo(PLACES, 'path')).toEqual(['south', 'south', 'east'])
  })

  it('does not walk through a seen place', () => {
    const places = [
      place('a', true, { east: 'b', north: 'c' }, true),
      place('b', false),
      place('c', true, { east: 'd' }),
      place('d', true, { west: 'b' }),
    ]
    expect(routeTo(places, 'd')).toEqual(['north', 'east'])
  })

  it('has no route to the current place or an unknown one', () => {
    expect(routeTo(PLACES, 'well')).toBeNull()
    expect(routeTo(PLACES, 'nowhere')).toBeNull()
  })

  it('has no route when no open way leads there', () => {
    const closed = PLACES.map((p) =>
      p.key === 'square' ? { ...p, exits: {} } : p,
    )
    expect(routeTo(closed, 'store')).toBeNull()
  })
})
