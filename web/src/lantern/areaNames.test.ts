/** Where the picture's marks and names go: placed boxes, trimmed edges, crowding. */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { AreaThing } from './areaThings'
import {
  closedWayThings,
  layoutNames,
  markInside,
  nameAt,
  placeNames,
  pressAt,
  visiblePart,
} from './areaNames'

const PICTURE = { width: 1920, height: 1080 }
const VIEW = { width: 960, height: 540 }

const things: AreaThing[] = [
  { areaId: 'bucket', name: 'bucket', label: 'Bucket', kind: 'item' },
  { areaId: 'villager', name: 'villager', label: 'Tilda', kind: 'character' },
  {
    areaId: 'exit-north',
    name: 'exit-north',
    label: '↑ Mira’s Hut',
    kind: 'exit',
  },
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

describe('placeNames with a mark point', () => {
  const box = {
    x: 0.5,
    y: 0.5,
    width: 0.2,
    height: 0.2,
    mark: { x: 0.52, y: 0.55 },
  }

  it('carries the point, in stage pixels, beside the whole rectangle', () => {
    const [placed] = placeNames(things, { bucket: box }, VIEW, PICTURE)
    expect(placed.point?.x).toBeCloseTo(0.52 * 960, 6)
    expect(placed.point?.y).toBeCloseTo(0.55 * 540, 6)
    expect(placed.rect).toEqual({ x: 480, y: 270, w: 192, h: 108 })
  })

  it('has no point for a box with none', () => {
    const [placed] = placeNames(
      things,
      { bucket: { ...box, mark: undefined } },
      VIEW,
      PICTURE,
    )
    expect(placed.point).toBeUndefined()
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
  const bounds = { x: 0, y: 0, w: 960, h: 540 }
  const mark = (areaId: string, label: string, x: number, y: number) => ({
    areaId,
    name: areaId,
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

  it('keeps a name inside bounds that do not start at the corner', () => {
    const visible = { x: 28, y: 12, w: 900, h: 450 }
    const [left] = layoutNames(
      [mark('a', 'Village Well', 30, 300)],
      measure,
      [],
      visible,
    )
    expect(left.left).toBe(28)
    const [foot] = layoutNames(
      [mark('a', 'Village Well', 400, 470)],
      measure,
      [],
      visible,
    )
    expect(foot.top + foot.height).toBeLessThanOrEqual(462)
  })
})

describe('visiblePart', () => {
  const size = { width: 1000, height: 500 }

  it('is the part of the layer on the stage at every moment of the drift', () => {
    const part = visiblePart(size, 0)
    // At the drift's peak: scale 1.03 about the middle, after -0.5% and -0.3%.
    expect(part.x).toBeCloseTo(500 - 500 / 1.03 + 5, 3)
    expect(part.y).toBeCloseTo(250 - 250 / 1.03 + 1.5, 3)
    expect(part.x + part.w).toBeCloseTo(500 + 500 / 1.03 + 5, 3)
    expect(part.y + part.h).toBeCloseTo(250 + 250 / 1.03 + 1.5, 3)
  })

  it('ends above what covers the foot of the stage', () => {
    const part = visiblePart(size, 80)
    expect(part.y + part.h).toBeCloseTo(250 + (420 - 250) / 1.03 + 1.5, 3)
  })

  it('has no height when the foot is covered to the top', () => {
    expect(visiblePart(size, 600).h).toBe(0)
  })

  it('agrees with the keyframes of the picture’s drift', () => {
    const source = readFileSync(
      resolve(__dirname, '../components/lantern/StagePicture.vue'),
      'utf8',
    )
    expect(source).toContain('transform: scale(1.03) translate(-0.5%, -0.3%);')
  })
})

describe('markInside', () => {
  const visible = { x: 20, y: 10, w: 900, h: 450 }
  const entry = (x: number, y: number, w: number, h: number) => ({
    areaId: 'a',
    name: 'mill',
    label: 'Old Mill',
    kind: 'scenery' as const,
    x: x + w / 2,
    y: y + h / 2,
    rect: { x, y, w, h },
  })

  it('leaves a mark that is well inside where it is', () => {
    const [placed] = markInside([entry(100, 100, 40, 40)], visible)
    expect(placed.x).toBe(120)
    expect(placed.y).toBe(120)
  })

  it('puts the mark at the middle of what can be seen, keeping the box to press', () => {
    const [placed] = markInside([entry(100, 400, 40, 140)], visible)
    expect(placed.y).toBe(430)
    expect(placed.rect.h).toBe(140)
  })

  it('keeps the whole mark on the visible part of a sliver', () => {
    const [placed] = markInside([entry(100, 455, 40, 40)], visible)
    expect(placed.y).toBeLessThanOrEqual(460 - 8)
  })

  it('has no mark for a thing wholly behind the bar', () => {
    expect(markInside([entry(100, 470, 40, 40)], visible)).toEqual([])
  })
})

describe('markInside with a mark point', () => {
  const visible = { x: 20, y: 10, w: 900, h: 450 }
  const base = {
    areaId: 'a',
    name: 'storm',
    label: 'Storm',
    kind: 'scenery' as const,
  }
  const whole = { x: 20, y: 10, w: 900, h: 450 }

  it('puts the mark on the point when it is in view', () => {
    const [placed] = markInside(
      [{ ...base, x: 500, y: 230, rect: whole, point: { x: 600, y: 60 } }],
      visible,
    )
    expect(placed).toMatchObject({ x: 600, y: 60 })
  })

  it('moves a point cut off at the right to the edge, at the point’s height', () => {
    const [placed] = markInside(
      [{ ...base, x: 500, y: 230, rect: whole, point: { x: 1100, y: 100 } }],
      visible,
    )
    expect(placed.x).toBe(920 - 8)
    expect(placed.y).toBe(100)
  })

  it('moves a point under the action bar up to the foot of what can be seen', () => {
    const [placed] = markInside(
      [
        {
          ...base,
          x: 100,
          y: 300,
          rect: { x: 80, y: 200, w: 40, h: 300 },
          point: { x: 100, y: 480 },
        },
      ],
      visible,
    )
    expect(placed.x).toBe(100)
    expect(placed.y).toBe(460 - 8)
  })

  it('keeps the whole rectangle to press', () => {
    const rect = { x: 80, y: 200, w: 40, h: 300 }
    const [placed] = markInside(
      [{ ...base, x: 100, y: 300, rect, point: { x: 100, y: 480 } }],
      visible,
    )
    expect(placed.rect).toEqual(rect)
  })
})

describe('closedWayThings', () => {
  it('lists the placed exit areas that are not open, with the direction the game is asked for', () => {
    const open: AreaThing[] = [
      {
        areaId: 'exit-north',
        name: 'exit-north',
        label: '↑ Hut',
        kind: 'exit',
        direction: 'north',
      },
    ]
    const boxes = {
      'exit-north': { x: 0, y: 0, width: 0.1, height: 0.1 },
      'exit-secret-passage': { x: 0.5, y: 0.5, width: 0.1, height: 0.1 },
      'exit-west': { x: 0.2, y: 0.2, width: 0.1, height: 0.1 },
      bucket: { x: 0.3, y: 0.3, width: 0.1, height: 0.1 },
    }
    const declared = [
      'exit-north',
      'exit-secret-passage',
      'exit-west',
      'exit-east',
    ]
    expect(
      closedWayThings(declared, open, boxes).map((t) => [
        t.areaId,
        t.direction,
      ]),
    ).toEqual([
      ['exit-secret-passage', 'secret_passage'],
      ['exit-west', 'west'],
    ])
  })
})

describe('pressAt', () => {
  const box = (x: number, y: number, w: number, h: number) => ({
    x,
    y,
    width: w,
    height: h,
  })
  const place = (
    list: AreaThing[],
    boxes: Record<string, ReturnType<typeof box>>,
  ) => placeNames(list, boxes, VIEW, PICTURE)
  const north: AreaThing = {
    areaId: 'exit-north',
    name: 'exit-north',
    label: '↑ Hut',
    kind: 'exit',
    direction: 'north',
  }
  const closedWest: AreaThing = {
    areaId: 'exit-west',
    name: 'exit-west',
    label: '',
    kind: 'exit',
    direction: 'west',
  }
  const bucket: AreaThing = {
    areaId: 'bucket',
    name: 'bucket',
    label: 'Bucket',
    kind: 'item',
  }

  it('finds an open way under the point', () => {
    const placed = place([north], { 'exit-north': box(0, 0, 0.5, 0.5) })
    expect(pressAt(placed, [], 100, 100)).toEqual({
      direction: 'north',
      open: true,
    })
  })

  it('finds a closed way, marked as closed', () => {
    const closed = place([closedWest], { 'exit-west': box(0, 0, 0.5, 0.5) })
    expect(pressAt([], closed, 100, 100)).toEqual({
      direction: 'west',
      open: false,
    })
  })

  it('finds nothing over bare painting or over a thing that is not a way', () => {
    const placed = place([north, bucket], {
      'exit-north': box(0, 0, 0.1, 0.1),
      bucket: box(0.5, 0.5, 0.2, 0.2),
    })
    expect(pressAt(placed, [], 400, 100)).toBeNull()
    expect(pressAt(placed, [], 576, 324)).toBeNull()
  })

  it('lets a thing hide a closed way beneath it, even the smaller one', () => {
    const placed = place([bucket], { bucket: box(0, 0, 0.5, 0.5) })
    const closed = place([closedWest], { 'exit-west': box(0.1, 0.1, 0.1, 0.1) })
    expect(pressAt(placed, closed, 150, 100)).toBeNull()
  })

  it('lets the smaller of an open way and a thing win', () => {
    const wide = place([north, bucket], {
      'exit-north': box(0, 0, 0.5, 0.5),
      bucket: box(0.1, 0.1, 0.1, 0.1),
    })
    expect(pressAt(wide, [], 150, 100)).toBeNull()
    const small = place([north, bucket], {
      'exit-north': box(0.1, 0.1, 0.1, 0.1),
      bucket: box(0, 0, 0.5, 0.5),
    })
    expect(pressAt(small, [], 150, 100)).toEqual({
      direction: 'north',
      open: true,
    })
  })
})
