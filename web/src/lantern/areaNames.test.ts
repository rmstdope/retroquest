/** Where the picture's marks and names go: placed boxes, trimmed edges, crowding. */
import { describe, expect, it } from 'vitest'
import type { AreaThing } from './areaThings'
import { layoutNames, nameAt, placeNames } from './areaNames'

const PICTURE = { width: 1920, height: 1080 }
const VIEW = { width: 960, height: 540 }

const things: AreaThing[] = [
  { areaId: 'bucket', label: 'Bucket', kind: 'item' },
  { areaId: 'villager', label: 'Tilda', kind: 'character' },
  { areaId: 'exit-north', label: '↑ Mira’s Hut', kind: 'exit' },
]

describe('placeNames', () => {
  it('puts the mark at the middle of each thing’s box', () => {
    const placed = placeNames(
      things,
      { bucket: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 } },
      VIEW,
      PICTURE,
    )
    expect(placed).toHaveLength(1)
    expect(placed[0]).toMatchObject({ areaId: 'bucket', x: 576, y: 324 })
  })

  it('leaves out a thing with no placed box', () => {
    expect(placeNames(things, {}, VIEW, PICTURE)).toEqual([])
  })

  it('leaves out a thing wholly out of view of a trimmed picture', () => {
    const narrow = { width: 300, height: 540 }
    const placed = placeNames(
      things,
      { bucket: { x: 0, y: 0.1, width: 0.1, height: 0.1 } },
      narrow,
      PICTURE,
    )
    expect(placed).toEqual([])
  })

  it('puts the mark of a thing partly off the edge on the part in view', () => {
    const narrow = { width: 300, height: 540 }
    const placed = placeNames(
      things,
      { bucket: { x: 0.3, y: 0.4, width: 0.3, height: 0.2 } },
      narrow,
      PICTURE,
    )
    expect(placed).toHaveLength(1)
    expect(placed[0].x).toBeGreaterThanOrEqual(0)
    expect(placed[0].x).toBeLessThanOrEqual(300)
  })
})

describe('nameAt', () => {
  const placed = placeNames(
    things,
    {
      bucket: { x: 0.1, y: 0.1, width: 0.5, height: 0.5 },
      villager: { x: 0.2, y: 0.2, width: 0.1, height: 0.1 },
    },
    VIEW,
    PICTURE,
  )
  it('finds the thing under the pointer, the smallest when they overlap', () => {
    expect(nameAt(placed, 200, 120)?.areaId).toBe('villager')
    expect(nameAt(placed, 100, 100)?.areaId).toBe('bucket')
  })
  it('finds nothing over nothing', () => {
    expect(nameAt(placed, 900, 500)).toBeNull()
  })
})

describe('layoutNames', () => {
  const measure = (label: string): { w: number; h: number } => ({
    w: label.length * 8,
    h: 20,
  })
  const bounds = { w: 960, h: 540 }
  const mark = (areaId: string, label: string, x: number, y: number) => ({
    areaId,
    label,
    kind: 'item' as const,
    x,
    y,
    rect: { x, y, w: 1, h: 1 },
  })

  it('sets a name just above its mark, centred, with no leader', () => {
    const [spot] = layoutNames(
      [mark('a', 'Bucket', 400, 300)],
      measure,
      [],
      bounds,
    )
    expect(spot.leader).toBeNull()
    expect(spot.top + 20).toBeLessThanOrEqual(300)
    expect(spot.left + 24).toBeCloseTo(400, 0)
  })

  it('keeps a long name on the picture', () => {
    const [spot] = layoutNames(
      [mark('a', 'A rather long name indeed', 5, 300)],
      measure,
      [],
      bounds,
    )
    expect(spot.left).toBeGreaterThanOrEqual(0)
  })

  it('moves a crowded name to a free spot with a line back to its mark', () => {
    const spots = layoutNames(
      [mark('a', 'Notice Board', 400, 300), mark('b', 'Old Notice', 404, 302)],
      measure,
      [],
      bounds,
    )
    const [a, b] = spots
    const overlap =
      a.left < b.left + b.width &&
      b.left < a.left + a.width &&
      a.top < b.top + b.height &&
      b.top < a.top + a.height
    expect(overlap).toBe(false)
    expect(b.leader).not.toBeNull()
  })

  it('keeps a name off a button', () => {
    const button = { x: 360, y: 260, w: 100, h: 36 }
    const [spot] = layoutNames(
      [mark('a', 'Bucket', 400, 300)],
      measure,
      [button],
      bounds,
    )
    const overlap =
      spot.left < button.x + button.w &&
      button.x < spot.left + spot.width &&
      spot.top < button.y + button.h &&
      button.y < spot.top + spot.height
    expect(overlap).toBe(false)
  })

  it('puts a name above the mark near the foot, never below it into the bounds edge', () => {
    const [spot] = layoutNames(
      [mark('a', 'Bucket', 400, 530)],
      measure,
      [],
      bounds,
    )
    expect(spot.top + spot.height).toBeLessThanOrEqual(540)
  })
})
