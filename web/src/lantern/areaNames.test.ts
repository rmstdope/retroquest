/** Where the picture's marks and names go: placed boxes, trimmed edges, crowding. */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { AreaThing } from './areaThings'
import type { Rect } from './roomMotionScene'
import {
  clearOfPanels,
  keepMarksApart,
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
      [
        mark('a', 'Notice Board', 400, 300),
        mark('b', 'Old Notice', 404, 302),
        mark('c', 'Third Notice', 402, 301),
      ],
      measure,
      [],
      bounds,
    )
    const [a, b, c] = spots
    const overlap =
      a.left < b.left + b.width &&
      b.left < a.left + a.width &&
      a.top < b.top + b.height &&
      b.top < a.top + a.height
    expect(overlap).toBe(false)
    expect(c.leader).not.toBeNull()
    expect(b.leader).toBeNull()
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

  it('sets a name just below its mark, centred, with no line, when above is taken', () => {
    const plate = { x: 340, y: 250, w: 120, h: 30 }
    const [spot] = layoutNames(
      [mark('a', 'Bucket', 400, 300)],
      measure,
      [plate],
      bounds,
    )
    expect(spot.leader).toBeNull()
    expect(spot.top).toBe(310)
    expect(spot.left + 24).toBeCloseTo(400, 0)
  })

  it('never lets a name cover a neighbour’s dot', () => {
    const spots = layoutNames(
      [mark('a', 'Bucket', 400, 300), mark('b', 'Well', 400, 322)],
      measure,
      [],
      bounds,
    )
    for (const spot of spots)
      for (const other of [
        { x: 400, y: 300 },
        { x: 400, y: 322 },
      ]) {
        const covers =
          spot.left < other.x + 6 &&
          other.x - 6 < spot.left + spot.width &&
          spot.top < other.y + 6 &&
          other.y - 6 < spot.top + spot.height
        expect(covers).toBe(false)
      }
  })

  it('goes further off with a line when above and below are both taken', () => {
    const plate = { x: 300, y: 250, w: 200, h: 30 }
    const below = { x: 300, y: 312, w: 200, h: 30 }
    const [spot] = layoutNames(
      [mark('a', 'Bucket', 400, 300)],
      measure,
      [plate, below],
      bounds,
    )
    expect(spot.leader).not.toBeNull()
    const coversOwn =
      spot.left < 406 &&
      394 < spot.left + spot.width &&
      spot.top < 306 &&
      294 < spot.top + spot.height
    expect(coversOwn).toBe(false)
  })

  it('goes beside its dot with a line when above is taken and below does not fit', () => {
    const plate = { x: 340, y: 480, w: 120, h: 30 }
    const [spot] = layoutNames(
      [mark('a', 'Bucket', 400, 525)],
      measure,
      [plate],
      bounds,
    )
    expect(spot.leader).not.toBeNull()
    const coversOwn =
      spot.left < 406 &&
      394 < spot.left + spot.width &&
      spot.top < 531 &&
      519 < spot.top + spot.height
    expect(coversOwn).toBe(false)
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

describe('clearOfPanels', () => {
  const visible = { x: 0, y: 0, w: 390, h: 700 }
  const mark = (x: number, y: number, rect?: Rect) => ({
    areaId: 'a',
    name: 'storm',
    label: 'Storm',
    kind: 'scenery' as const,
    x,
    y,
    rect: rect ?? { x: x - 20, y: y - 20, w: 40, h: 40 },
  })
  /** A phone's plate across the width. */
  const plate = { x: 0, y: 0, w: 390, h: 100 }

  it('leaves a mark no panel covers where it is', () => {
    const [m] = clearOfPanels([mark(200, 300)], [plate], visible)
    expect([m.x, m.y]).toEqual([200, 300])
  })

  it('steps a mark under a full-width plate straight below it', () => {
    const [m] = clearOfPanels([mark(120, 40)], [plate], visible)
    expect(m.x).toBe(120)
    expect(m.y).toBeGreaterThanOrEqual(100 + 8)
    expect(m.y).toBeLessThan(100 + 20)
  })

  it('goes to the nearest edge of a plate in the corner: below or to the right', () => {
    const corner = { x: 16, y: 16, w: 300, h: 80 }
    const wide = { x: 0, y: 0, w: 1000, h: 600 }
    const [low] = clearOfPanels([mark(150, 80)], [corner], wide)
    expect(low.y).toBeGreaterThanOrEqual(96 + 8)
    expect(low.x).toBe(150)
    const [right] = clearOfPanels([mark(300, 50)], [corner], wide)
    expect(right.x).toBeGreaterThanOrEqual(316 + 8)
    expect(right.y).toBe(50)
  })

  it('moves a mark under a corner button just outside it', () => {
    const button = { x: 900, y: 16, w: 40, h: 40 }
    const wide = { x: 0, y: 0, w: 960, h: 600 }
    const [m] = clearOfPanels([mark(920, 30)], [button], wide)
    const inside = m.x > 900 && m.x < 940 && m.y > 16 && m.y < 56
    expect(inside).toBe(false)
  })

  it('keeps the whole pressable rectangle of a thing wholly under the plate', () => {
    const rect = { x: 100, y: 10, w: 50, h: 50 }
    const [m] = clearOfPanels([mark(125, 35, rect)], [plate], visible)
    expect(m.rect).toEqual(rect)
    expect(m.y).toBeGreaterThan(100)
  })

  it('stays clear of a second panel the first step would land in', () => {
    const under = { x: 0, y: 100, w: 390, h: 60 }
    const [m] = clearOfPanels([mark(120, 40)], [plate, under], visible)
    expect(m.y).toBeGreaterThanOrEqual(160 + 8)
  })

  it('goes to the side when the spot below lies past the foot of what can be seen', () => {
    const corner = { x: 16, y: 16, w: 300, h: 80 }
    const short = { x: 0, y: 0, w: 1000, h: 100 }
    const [m] = clearOfPanels([mark(150, 80)], [corner], short)
    expect(m.y).toBe(80)
    expect(m.x).toBeGreaterThanOrEqual(316 + 8)
  })

  it('prefers below to the right when both are as near', () => {
    const square = { x: 100, y: 100, w: 100, h: 100 }
    const wide = { x: 0, y: 0, w: 1000, h: 600 }
    const [m] = clearOfPanels([mark(150, 150)], [square], wide)
    expect(m.x).toBe(150)
    expect(m.y).toBeGreaterThan(200)
  })

  it('steps a mark that stands closer to the panel than a stepped one would', () => {
    const [m] = clearOfPanels([mark(120, 108)], [plate], visible)
    expect(m.y).toBeGreaterThanOrEqual(112)
  })

  it('steps a mark under the Hide tab to its side, not up under the words just above it', () => {
    /** A phone: the words end 6 px above the tab, which sits at the foot of what can be seen. */
    const phone = { x: 0, y: 0, w: 390, h: 680 }
    const tab = { x: 160, y: 640, w: 70, h: 28 }
    const words = { x: 8, y: 200, w: 374, h: 434 }
    const [m] = clearOfPanels([mark(195, 654)], [tab], phone, [words])
    expect(m.y).toBe(654)
    expect(m.x < tab.x - 8 || m.x > tab.x + tab.w + 8).toBe(true)
  })

  it('still steps under the words when nowhere else is clear', () => {
    const phone = { x: 0, y: 0, w: 390, h: 680 }
    const words = { x: 0, y: 200, w: 390, h: 434 }
    const tab = { x: 0, y: 640, w: 390, h: 28 }
    const [m] = clearOfPanels([mark(195, 654)], [tab], phone, [words])
    expect(m.y).toBeLessThan(640)
  })
})

describe('keepMarksApart', () => {
  const visible = { x: 0, y: 0, w: 390, h: 700 }
  const plate = { x: 0, y: 0, w: 390, h: 100 }
  const mark = (
    id: string,
    x: number,
    y: number,
    from?: { x: number; y: number },
  ) => ({
    areaId: id,
    name: id,
    label: id,
    kind: 'scenery' as const,
    x,
    y,
    rect: { x: x - 20, y: y - 20, w: 40, h: 40 },
    ...(from ? { from } : {}),
  })
  /** Marks under the plate, stepped by the real code, then kept apart. */
  const stepped = (xs: number[]) =>
    keepMarksApart(
      clearOfPanels(
        xs.map((x, i) => mark(`m${i}`, x, 50)),
        [plate],
        visible,
      ),
      [plate],
      visible,
    )

  it('puts two marks that would land on each other side by side, order kept, left one unmoved', () => {
    const [a, b] = stepped([96, 104])
    expect(a.x).toBe(96)
    expect(b.y).toBe(a.y)
    expect(b.x - a.x).toBeGreaterThanOrEqual(24)
  })

  it('keeps the order of the things even when the input is the other way round', () => {
    const [b, a] = stepped([104, 96])
    expect(a.x).toBe(96)
    expect(b.x - a.x).toBeGreaterThanOrEqual(24)
  })

  it('changes nothing when moved marks do not collide', () => {
    const [a, b] = stepped([50, 200])
    expect([a.x, b.x]).toEqual([50, 200])
  })

  it('a mark that stands on its thing keeps its place against a moved mark, which gives way', () => {
    const standing = mark('hook', 110, 120)
    const [moved, fixed] = keepMarksApart(
      [mark('books', 104, 120, { x: 104, y: 50 }), standing],
      [plate],
      visible,
    )
    expect([fixed.x, fixed.y]).toEqual([110, 120])
    expect(Math.hypot(moved.x - 110, moved.y - 120)).toBeGreaterThanOrEqual(24)
    expect(moved.y).toBe(120)
  })

  it('carries a crowded row on to the left of the first mark, on the same line', () => {
    const row = stepped([330, 345, 360, 372])
    const line = row[0].y
    expect(row.every((m) => m.y === line)).toBe(true)
    const xs = row.map((m) => m.x).sort((p, q) => p - q)
    for (let i = 1; i < xs.length; i++)
      expect(xs[i] - xs[i - 1]).toBeGreaterThanOrEqual(24)
    expect(xs[xs.length - 1]).toBeLessThanOrEqual(390 - 8)
    expect(Math.min(...xs)).toBeLessThan(330)
  })

  it('uses a second row further from the panel only when the whole width is full', () => {
    const narrow = { x: 0, y: 0, w: 60, h: 700 }
    const wide = { x: 0, y: 0, w: 60, h: 100 }
    const out = keepMarksApart(
      clearOfPanels(
        [10, 20, 30, 40].map((x, i) => mark(`m${i}`, x, 50)),
        [wide],
        narrow,
      ),
      [wide],
      narrow,
    )
    const ys = new Set(out.map((m) => m.y))
    expect(ys.size).toBeGreaterThan(1)
    for (const m of out) expect(m.x).toBeGreaterThanOrEqual(8)
    for (const m of out) expect(m.x).toBeLessThanOrEqual(52)
    const first = Math.min(...ys)
    expect(out.filter((m) => m.y === first).length).toBe(2)
  })

  it('never slides a mark under a panel', () => {
    const button = { x: 120, y: 100, w: 40, h: 40 }
    const out = keepMarksApart(
      clearOfPanels(
        [mark('a', 96, 50), mark('b', 104, 50)],
        [plate, button],
        visible,
      ),
      [plate, button],
      visible,
    )
    for (const m of out) {
      expect(m.x > 112 && m.x < 168 && m.y > 92 && m.y < 148).toBe(false)
    }
  })

  it('slides marks stepped off the side of a corner panel down the line, clear of it', () => {
    const corner = { x: 16, y: 16, w: 300, h: 80 }
    const tight = { x: 0, y: 0, w: 1000, h: 100 }
    const out = keepMarksApart(
      clearOfPanels([mark('a', 300, 50), mark('b', 304, 52)], [corner], tight),
      [corner],
      tight,
    )
    expect(out[0].x).toBe(out[1].x)
    expect(Math.abs(out[1].y - out[0].y)).toBeGreaterThanOrEqual(24)
    for (const m of out) expect(m.x).toBeGreaterThanOrEqual(316 + 8)
  })

  it('does not put a slid mark under the words', () => {
    const words = { x: 110, y: 100, w: 200, h: 80 }
    const out = keepMarksApart(
      clearOfPanels([mark('a', 96, 50), mark('b', 104, 50)], [plate], visible),
      [plate],
      visible,
      [words],
    )
    const b = out[1]
    expect(b.x >= 110 && b.x <= 310 && b.y >= 100 && b.y <= 180).toBe(false)
  })

  it('keeps marks moved in off the foot apart too', () => {
    const [a, b] = keepMarksApart(
      [
        mark('a', 100, 690, { x: 100, y: 720 }),
        mark('b', 106, 690, { x: 106, y: 730 }),
      ],
      [],
      { x: 0, y: 0, w: 390, h: 700 },
    )
    expect(b.x - a.x).toBeGreaterThanOrEqual(24)
    expect(a.y).toBe(b.y)
  })
})

describe('keepMarksApart with marks that all stand on their things', () => {
  const visible = { x: 0, y: 0, w: 390, h: 700 }
  const mark = (id: string, x: number, y: number) => ({
    areaId: id,
    name: id,
    label: id,
    kind: 'scenery' as const,
    x,
    y,
    rect: { x: x - 20, y: y - 20, w: 40, h: 40 },
  })

  it('puts two marks on the same spot side by side, the left one in input order keeping it', () => {
    const [a, b] = keepMarksApart(
      [mark('a', 200, 300), mark('b', 200, 300)],
      [],
      visible,
    )
    expect([a.x, a.y]).toEqual([200, 300])
    expect(b.y).toBe(300)
    expect(b.x - a.x).toBeGreaterThanOrEqual(24)
  })

  it('keeps the further-left mark in place and slides the other right, whatever the input order', () => {
    const [right, left] = keepMarksApart(
      [mark('r', 210, 300), mark('l', 200, 300)],
      [],
      visible,
    )
    expect([left.x, left.y]).toEqual([200, 300])
    expect(right.x - left.x).toBeGreaterThanOrEqual(24)
  })

  it('moves nothing when the marks are already 24 apart', () => {
    const marks = [mark('a', 200, 300), mark('b', 224, 300)]
    const out = keepMarksApart(marks, [], visible)
    expect(out.map((m) => [m.x, m.y])).toEqual([
      [200, 300],
      [224, 300],
    ])
  })

  it('carries on to the left of the first mark when the right is out of room', () => {
    const out = keepMarksApart(
      [mark('a', 20, 300), mark('b', 20, 300), mark('c', 20, 300)],
      [],
      { x: 0, y: 0, w: 60, h: 700 },
    )
    for (let i = 0; i < out.length; i++)
      for (let j = i + 1; j < out.length; j++)
        expect(
          Math.hypot(out[i].x - out[j].x, out[i].y - out[j].y),
        ).toBeGreaterThanOrEqual(23.5)
  })

  it('slides to the left when the line to the right runs out', () => {
    const out = keepMarksApart(
      [mark('a', 100, 300), mark('b', 100, 300), mark('c', 100, 300)],
      [],
      { x: 0, y: 0, w: 140, h: 700 },
    )
    expect(out.map((m) => [m.x, m.y])).toEqual([
      [100, 300],
      [124, 300],
      [76, 300],
    ])
  })

  it('uses a second row below only when the whole line is full', () => {
    const out = keepMarksApart(
      [mark('a', 20, 300), mark('b', 20, 300), mark('c', 20, 300)],
      [],
      { x: 0, y: 0, w: 60, h: 700 },
    )
    expect(out.map((m) => [m.x, m.y])).toEqual([
      [20, 300],
      [44, 300],
      [20, 324],
    ])
  })

  it('never pushes a mark that was already clear of every other', () => {
    const [a, b, c] = keepMarksApart(
      [mark('a', 200, 300), mark('b', 205, 300), mark('c', 229, 315)],
      [],
      visible,
    )
    expect([a.x, a.y]).toEqual([200, 300])
    expect([c.x, c.y]).toEqual([229, 315])
    expect(Math.hypot(b.x - c.x, b.y - c.y)).toBeGreaterThanOrEqual(23.5)
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeGreaterThanOrEqual(23.5)
  })

  it('leaves a mark under the words where it is, hidden with them, and lets it push none', () => {
    const words = [{ x: 190, y: 290, w: 30, h: 20 }]
    const [hidden, other] = keepMarksApart(
      [mark('a', 200, 300), mark('b', 205, 300)],
      [],
      visible,
      words,
    )
    expect([hidden.x, hidden.y]).toEqual([200, 300])
    expect([other.x, other.y]).toEqual([205, 300])
  })

  it('keeps the plain spot of a mark when no spot is free', () => {
    const tiny = { x: 0, y: 0, w: 16, h: 16 }
    const out = keepMarksApart([mark('a', 8, 8), mark('b', 8, 8)], [], tiny)
    expect(out.map((m) => [m.x, m.y])).toEqual([
      [8, 8],
      [8, 8],
    ])
  })

  it('never slides a mark under a panel', () => {
    const panel = { x: 230, y: 280, w: 100, h: 40 }
    const out = keepMarksApart(
      [mark('a', 200, 300), mark('b', 205, 300)],
      [panel],
      visible,
    )
    expect(
      Math.hypot(out[1].x - out[0].x, out[1].y - out[0].y),
    ).toBeGreaterThanOrEqual(23.5)
    const clear = out[1].x < 230 - 12 || out[1].x > 330 + 12
    expect(clear).toBe(true)
  })
})

describe('markInside leaves a mark trimmed only by the edge unmoved', () => {
  it('has no from for an edge-cropped thing with no point', () => {
    const visible = { x: 2, y: 2, w: 386, h: 690 }
    const [floor] = markInside(
      [
        {
          areaId: 'floor',
          name: 'floor',
          label: 'Floor',
          kind: 'scenery' as const,
          x: 30,
          y: 550,
          rect: { x: 0, y: 500, w: 60, h: 100 },
        },
      ],
      visible,
    )
    expect(floor.from).toBeUndefined()
  })
})

describe('markInside records where a moved mark would have stood', () => {
  const visible = { x: 0, y: 0, w: 390, h: 700 }
  it('has no from when the mark was not moved, and one when it was clamped in', () => {
    const base = {
      areaId: 'a',
      name: 'a',
      label: 'A',
      kind: 'scenery' as const,
    }
    const [plain] = markInside(
      [{ ...base, x: 100, y: 100, rect: { x: 80, y: 80, w: 40, h: 40 } }],
      visible,
    )
    expect(plain.from).toBeUndefined()
    const [low] = markInside(
      [
        {
          ...base,
          x: 100,
          y: 705,
          rect: { x: 80, y: 690, w: 40, h: 40 },
          point: { x: 100, y: 725 },
        },
      ],
      visible,
    )
    expect(low.from).toEqual({ x: 100, y: 725 })
  })
})
