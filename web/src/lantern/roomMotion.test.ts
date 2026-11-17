import { describe, expect, it } from 'vitest'
import {
  appliedMotion,
  madeAreaBoxes,
  madeEffects,
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

const POND = {
  points: [
    { x: 0.25, y: 0.5 },
    { x: 0.5, y: 0.5 },
    { x: 0.5, y: 0.75 },
  ],
}

describe('madeEffects', () => {
  it('reads the effects of the image with settings, patch ties and a drawn spot', () => {
    const manifest = {
      a: {
        effects: [
          { type: 'dust' },
          { type: 'mist', settings: { amount: 2 }, unlessPatch: 'door-open' },
          { type: 'fire', whilePatch: 'hearth-lit', spot: POND },
        ],
      },
    }
    expect(madeEffects(manifest, 'a')).toEqual([
      { kind: 'dust' },
      { kind: 'mist', settings: { amount: 2 }, unlessPatch: 'door-open' },
      { kind: 'fire', whilePatch: 'hearth-lit', spot: POND },
    ])
  })

  it('keeps the mark of a spot when it is inside the picture', () => {
    const spot = { ...POND, mark: { x: 0.3, y: 0.6 } }
    const got = madeEffects({ a: { effects: [{ type: 'fire', spot }] } }, 'a')
    expect(got[0].spot).toEqual(spot)
    const bad = { ...POND, mark: { x: 2, y: 0.6 } }
    expect(
      madeEffects({ a: { effects: [{ type: 'fire', spot: bad }] } }, 'a')[0]
        .spot,
    ).toEqual(POND)
  })

  it('gives none for a manifest, image or effects that are not as expected', () => {
    expect(madeEffects(null, 'a')).toEqual([])
    expect(madeEffects({}, 'a')).toEqual([])
    expect(madeEffects({ a: 3 }, 'a')).toEqual([])
    expect(madeEffects({ a: {} }, 'a')).toEqual([])
    expect(madeEffects({ a: { effects: 'x' } }, 'a')).toEqual([])
  })

  it('leaves out an effect of a type the renderer does not have, and a broken one', () => {
    const manifest = {
      a: {
        effects: [
          { type: 'rain' },
          null,
          7,
          { kind: 'dust' },
          { type: 'dust' },
        ],
      },
    }
    expect(madeEffects(manifest, 'a')).toEqual([{ kind: 'dust' }])
  })

  it('drops settings that are not numbers and a spot that is not a shape inside the picture', () => {
    const manifest = {
      a: {
        effects: [
          { type: 'dust', settings: { amount: 'lots', speed: 2 } },
          {
            type: 'water',
            spot: {
              points: [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
              ],
            },
          },
          {
            type: 'water',
            spot: {
              points: [
                { x: 0, y: 0 },
                { x: 2, y: 1 },
                { x: 0, y: 1 },
              ],
            },
          },
          {
            type: 'water',
            spot: {
              points: [
                { x: 0.2, y: 0.2 },
                { x: 0.4, y: 0.2 },
                { x: 0.6, y: 0.2 },
              ],
            },
          },
        ],
      },
    }
    const got = madeEffects(manifest, 'a')
    expect(got[0]).toEqual({ kind: 'dust', settings: { speed: 2 } })
    for (const e of got.slice(1)) expect(e.spot).toBeUndefined()
  })
})

describe('appliedMotion', () => {
  const effects: RoomEffect[] = [
    { kind: 'dust', settings: { speed: 2 } },
    { kind: 'fire', whilePatch: 'hearth-lit', spot: POND },
    { kind: 'mist', unlessPatch: 'door-open' },
    { kind: 'water' },
  ]

  it('keeps floating kinds and the spots that have a shape, with the shape and its box', () => {
    expect(appliedMotion(effects, ['hearth-lit'])).toEqual([
      { kind: 'dust', settings: { speed: 2 } },
      {
        kind: 'fire',
        polygon: POND.points,
        box: { x: 0.25, y: 0.5, width: 0.25, height: 0.25 },
      },
      { kind: 'mist' },
    ])
  })

  it('carries the mark of the spot on its box', () => {
    const spot = { ...POND, mark: { x: 0.3, y: 0.6 } }
    const [fire] = appliedMotion([{ kind: 'fire', spot }], [])
    expect(fire.box?.mark).toEqual({ x: 0.3, y: 0.6 })
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
