import { describe, expect, it } from 'vitest'
import {
  appliedMotion,
  madeAreaBoxes,
  spotAreaId,
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

describe('appliedMotion', () => {
  const effects: RoomEffect[] = [
    { kind: 'dust' },
    { kind: 'fire', whilePatch: 'hearth-lit' },
    { kind: 'mist', unlessPatch: 'door-open' },
    { kind: 'water' },
  ]
  const boxes = { [spotAreaId('fire')]: BOX }

  it('keeps floating kinds and the spots that have a box', () => {
    expect(appliedMotion(effects, ['hearth-lit'], boxes)).toEqual([
      { kind: 'dust' },
      { kind: 'fire', box: BOX },
      { kind: 'mist' },
    ])
  })

  it('drops an effect whose patch condition fails', () => {
    expect(appliedMotion(effects, ['door-open'], boxes)).toEqual([
      { kind: 'dust' },
    ])
  })

  it('leaves a spot that is not marked yet out and moves everything else', () => {
    expect(appliedMotion(effects, ['hearth-lit'], {})).toEqual([
      { kind: 'dust' },
      { kind: 'mist' },
    ])
  })
})
