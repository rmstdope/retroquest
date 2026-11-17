import { describe, expect, it } from 'vitest'
import {
  appliedMotion,
  madeAreaBoxes,
  madeEffects,
  madeZoom,
  DEFAULT_TITLE_ZOOM,
  type AreaBox,
  type RoomEffect,
} from './roomMotion'

const BOX: AreaBox = { x: 0.25, y: 0.5, width: 0.25, height: 0.25 }

describe('madeAreaBoxes', () => {
  it('reads the boxes the manifest lists for the image', () => {
    const manifest = { 'act1-x': { areas: { 'motion-water': BOX } } }
    expect(madeAreaBoxes(manifest, 'act1-x')).toEqual({ 'motion-water': BOX })
  })

  it('gives none for a manifest, image or areas that are not as expected', () => {
    expect(madeAreaBoxes(null, 'a')).toEqual({})
    expect(madeAreaBoxes('x', 'a')).toEqual({})
    expect(madeAreaBoxes({}, 'a')).toEqual({})
    expect(madeAreaBoxes({ a: 3 }, 'a')).toEqual({})
    expect(madeAreaBoxes({ a: {} }, 'a')).toEqual({})
    expect(madeAreaBoxes({ a: { areas: 'x' } }, 'a')).toEqual({})
  })

  it('leaves out a box that is broken or not wholly inside the picture', () => {
    const manifest = {
      a: {
        areas: {
          ok: BOX,
          text: { x: '0', y: 0, width: 1, height: 1 },
          flat: { x: 0, y: 0, width: 0, height: 0.5 },
          over: { x: 0.8, y: 0, width: 0.4, height: 0.5 },
          negative: { x: -0.1, y: 0, width: 0.4, height: 0.5 },
          nothing: null,
        },
      },
    }
    expect(Object.keys(madeAreaBoxes(manifest, 'a'))).toEqual(['ok'])
  })
})

describe('madeAreaBoxes mark points', () => {
  it('reads the mark point the studio set, in picture fractions', () => {
    const box = { ...BOX, mark: { x: 0.3, y: 0.6 } }
    expect(madeAreaBoxes({ a: { areas: { t: box } } }, 'a')).toEqual({ t: box })
  })

  it('keeps the box but drops a mark that is broken or outside the picture', () => {
    const manifest = {
      a: {
        areas: {
          text: { ...BOX, mark: { x: '0.3', y: 0.5 } },
          over: { ...BOX, mark: { x: 1.2, y: 0.5 } },
          half: { ...BOX, mark: { x: 0.3 } },
          nothing: { ...BOX, mark: null },
        },
      },
    }
    const boxes = madeAreaBoxes(manifest, 'a')
    expect(Object.keys(boxes)).toEqual(['text', 'over', 'half', 'nothing'])
    for (const box of Object.values(boxes)) expect(box).toEqual(BOX)
  })
})

/** A drawn shape as the studio writes it: corners as [x, y] fractions of the picture. */
const POND: [number, number][] = [
  [0.25, 0.5],
  [0.5, 0.5],
  [0.5, 0.75],
]
/** The same shape as the game holds it. */
const POND_POINTS = [
  { x: 0.25, y: 0.5 },
  { x: 0.5, y: 0.5 },
  { x: 0.5, y: 0.75 },
]
const POND_BOX = { x: 0.25, y: 0.5, width: 0.25, height: 0.25 }
const HILL: [number, number][] = [
  [0.75, 0.25],
  [1, 0.25],
  [1, 0.5],
]
const HILL_POINTS = [
  { x: 0.75, y: 0.25 },
  { x: 1, y: 0.25 },
  { x: 1, y: 0.5 },
]

describe('madeEffects', () => {
  it('reads the effects as Content Studio exports them: kind, settings, patch ties and drawn shapes', () => {
    const manifest = {
      a: {
        effects: [
          { kind: 'dust', settings: {} },
          {
            kind: 'mist',
            settings: { amount: 2 },
            unlessPatch: 'door-open',
          },
          {
            kind: 'fire',
            settings: { amount: 1 },
            patch: 'hearth-lit',
            spot: [POND, HILL],
          },
        ],
      },
    }
    expect(madeEffects(manifest, 'a')).toEqual([
      { kind: 'dust' },
      { kind: 'mist', settings: { amount: 2 }, unlessPatch: 'door-open' },
      {
        kind: 'fire',
        settings: { amount: 1 },
        whilePatch: 'hearth-lit',
        spot: [POND_POINTS, HILL_POINTS],
      },
    ])
  })

  it('keeps the mark of an effect when it is inside the picture', () => {
    const got = madeEffects(
      { a: { effects: [{ kind: 'fire', spot: [POND], mark: [0.3, 0.6] }] } },
      'a',
    )
    expect(got[0].mark).toEqual({ x: 0.3, y: 0.6 })
    for (const mark of [[2, 0.6], [0.3], 'x', { x: 0.3, y: 0.6 }])
      expect(
        madeEffects({ a: { effects: [{ kind: 'fire', mark }] } }, 'a')[0].mark,
      ).toBeUndefined()
  })

  it('gives none for a manifest, image or effects that are not as expected', () => {
    expect(madeEffects(null, 'a')).toEqual([])
    expect(madeEffects({}, 'a')).toEqual([])
    expect(madeEffects({ a: 3 }, 'a')).toEqual([])
    expect(madeEffects({ a: {} }, 'a')).toEqual([])
    expect(madeEffects({ a: { effects: 'x' } }, 'a')).toEqual([])
  })

  it('leaves out an effect of a kind the renderer does not have, and a broken one', () => {
    const manifest = {
      a: {
        effects: [
          { kind: 'rain' },
          null,
          7,
          { type: 'dust' },
          { kind: 'dust' },
        ],
      },
    }
    expect(madeEffects(manifest, 'a')).toEqual([{ kind: 'dust' }])
  })

  it('drops settings that are not numbers and every shape that is not one inside the picture', () => {
    const manifest = {
      a: {
        effects: [
          { kind: 'dust', settings: { amount: 'lots', speed: 2 } },
          {
            kind: 'water',
            spot: [
              [
                [0, 0],
                [1, 1],
              ],
              [
                [0, 0],
                [2, 1],
                [0, 1],
              ],
              [
                [0.2, 0.2],
                [0.4, 0.2],
                [0.6, 0.2],
              ],
              'x',
            ],
          },
          { kind: 'water', spot: [POND, [[0.1, 0.1], 'x', [0.2, 0.3]]] },
          { kind: 'water', spot: { points: POND_POINTS } },
        ],
      },
    }
    const got = madeEffects(manifest, 'a')
    expect(got[0]).toEqual({ kind: 'dust', settings: { speed: 2 } })
    expect(got[1].spot).toBeUndefined()
    expect(got[2].spot).toEqual([POND_POINTS])
    expect(got[3].spot).toBeUndefined()
  })
})

describe('a drawn shape with no area', () => {
  it('is no shape, even when the box around it has a size', () => {
    const slanted = [
      [0.2, 0.2],
      [0.3, 0.3],
      [0.4, 0.4],
    ]
    expect(
      madeEffects(
        { a: { effects: [{ kind: 'fire', spot: [slanted] }] } },
        'a',
      )[0].spot,
    ).toBeUndefined()
  })
})

describe('appliedMotion', () => {
  const effects: RoomEffect[] = [
    { kind: 'dust', settings: { speed: 2 } },
    { kind: 'fire', whilePatch: 'hearth-lit', spot: [POND_POINTS] },
    { kind: 'mist', unlessPatch: 'door-open' },
    { kind: 'water' },
  ]

  it('keeps floating kinds and the spots that have a shape, with the shape and its box', () => {
    expect(appliedMotion(effects, ['hearth-lit'])).toEqual([
      { kind: 'dust', settings: { speed: 2 } },
      { kind: 'fire', polygon: POND_POINTS, box: POND_BOX },
      { kind: 'mist' },
    ])
  })

  it('plays a spot once in each of its shapes, with its settings', () => {
    expect(
      appliedMotion(
        [
          {
            kind: 'water',
            settings: { amount: 2 },
            spot: [POND_POINTS, HILL_POINTS],
          },
        ],
        [],
      ),
    ).toEqual([
      {
        kind: 'water',
        settings: { amount: 2 },
        polygon: POND_POINTS,
        box: POND_BOX,
      },
      {
        kind: 'water',
        settings: { amount: 2 },
        polygon: HILL_POINTS,
        box: { x: 0.75, y: 0.25, width: 0.25, height: 0.25 },
      },
    ])
  })

  it('carries the mark on the box of the shape that holds it, and no other', () => {
    const [pond, hill] = appliedMotion(
      [
        {
          kind: 'fire',
          spot: [POND_POINTS, HILL_POINTS],
          mark: { x: 0.3, y: 0.6 },
        },
      ],
      [],
    )
    expect(pond.box?.mark).toEqual({ x: 0.3, y: 0.6 })
    expect(hill.box?.mark).toBeUndefined()
  })

  it('drops an effect whose patch condition fails', () => {
    expect(appliedMotion(effects, ['door-open'])).toEqual([
      { kind: 'dust', settings: { speed: 2 } },
    ])
  })

  it('leaves a spot that is not drawn yet out and moves everything else', () => {
    expect(appliedMotion(effects, ['hearth-lit'])).not.toContainEqual(
      expect.objectContaining({ kind: 'water' }),
    )
  })
})

describe("the title picture's kinds", () => {
  it('reads the five kinds beside the old ones, each with its drawn spot and mark', () => {
    const kinds = ['ripples', 'glints', 'clouds', 'stars', 'moonglow']
    const manifest = {
      a: {
        effects: kinds.map((kind) => ({
          kind,
          spot: [POND],
          mark: [0.3, 0.6],
        })),
      },
    }
    expect(madeEffects(manifest, 'a').map((e) => e.kind)).toEqual(kinds)
    const applied = appliedMotion(madeEffects(manifest, 'a'), [])
    expect(applied.map((s) => s.kind)).toEqual(kinds)
    expect(applied.every((s) => s.polygon && s.box?.mark)).toBe(true)
  })

  it('leaves out one of them that has no drawn spot', () => {
    expect(
      appliedMotion(
        madeEffects({ a: { effects: [{ kind: 'stars' }] } }, 'a'),
        [],
      ),
    ).toEqual([])
  })
})

describe('madeZoom', () => {
  it('plays the start the team agreed when the image saves no zoom', () => {
    expect(DEFAULT_TITLE_ZOOM).toEqual({ seconds: 16, percent: 3 })
    expect(madeZoom({}, 'a')).toEqual(DEFAULT_TITLE_ZOOM)
    expect(madeZoom({ a: {} }, 'a')).toEqual(DEFAULT_TITLE_ZOOM)
    expect(madeZoom(null, 'a')).toEqual(DEFAULT_TITLE_ZOOM)
  })

  it('reads the saved seconds and size, clamped', () => {
    expect(madeZoom({ a: { zoom: { seconds: 20, percent: 5 } } }, 'a')).toEqual(
      {
        seconds: 20,
        percent: 5,
      },
    )
    expect(madeZoom({ a: { zoom: { seconds: 1, percent: 99 } } }, 'a')).toEqual(
      {
        seconds: 4,
        percent: 10,
      },
    )
  })

  it('is off when saved as off, as null or with nothing to move', () => {
    expect(madeZoom({ a: { zoom: null } }, 'a')).toBeNull()
    expect(madeZoom({ a: { zoom: false } }, 'a')).toBeNull()
    expect(
      madeZoom({ a: { zoom: { seconds: 0, percent: 3 } } }, 'a'),
    ).toBeNull()
    expect(
      madeZoom({ a: { zoom: { seconds: 16, percent: 0 } } }, 'a'),
    ).toBeNull()
  })

  it('plays the default for a zoom that is not a pair of numbers', () => {
    expect(madeZoom({ a: { zoom: 'fast' } }, 'a')).toEqual(DEFAULT_TITLE_ZOOM)
    expect(madeZoom({ a: { zoom: { seconds: 'x' } } }, 'a')).toEqual(
      DEFAULT_TITLE_ZOOM,
    )
  })
})
