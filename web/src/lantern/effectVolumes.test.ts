/**
 * The volume each room gives its sound effects: the saved file the game plays
 * by, and the helpers the dev panel and its Vite plugin change it with.
 */
import { describe, expect, it } from 'vitest'
import { ambienceAt } from './effectLists'
import {
  isEffectVolumes,
  MAX_EFFECT_VOLUME,
  SAVED_EFFECT_VOLUMES,
  volumeOf,
  withVolume,
} from './effectVolumes'

describe('volumeOf', () => {
  it('is the room’s volume for the effect, 1 where none is set', () => {
    const volumes = { 'act1-the-dream': { lightning: 2.5 } }
    expect(volumeOf(volumes, 'act1-the-dream', 'lightning')).toBe(2.5)
    expect(volumeOf(volumes, 'act1-the-dream', 'rain')).toBe(1)
    expect(volumeOf(volumes, 'act1-old-mill', 'lightning')).toBe(1)
  })

  it('keeps a volume of nothing', () => {
    expect(volumeOf({ t: { rain: 0 } }, 't', 'rain')).toBe(0)
  })

  it('reads nothing from the object’s own machinery', () => {
    expect(volumeOf({}, 'constructor', 'toString')).toBe(1)
  })
})

describe('withVolume', () => {
  it('sets one effect of one room, leaving the rest', () => {
    const before = { 'act1-the-dream': { rain: 0.5 } }
    expect(withVolume(before, 'act1-the-dream', 'lightning', 2)).toEqual({
      'act1-the-dream': { rain: 0.5, lightning: 2 },
    })
    expect(before).toEqual({ 'act1-the-dream': { rain: 0.5 } })
  })

  it('leaves out a volume back at 1, and a room with none left', () => {
    expect(withVolume({ t: { rain: 0.5 } }, 't', 'rain', 1)).toEqual({})
  })

  it('keeps a volume between nothing and the most, to the nearest 5 %', () => {
    expect(withVolume({}, 't', 'rain', 9)).toEqual({
      t: { rain: MAX_EFFECT_VOLUME },
    })
    expect(withVolume({}, 't', 'rain', -1)).toEqual({ t: { rain: 0 } })
    expect(withVolume({}, 't', 'rain', 1.234)).toEqual({ t: { rain: 1.25 } })
  })
})

describe('isEffectVolumes', () => {
  it('takes rooms of effects with volumes in range', () => {
    expect(isEffectVolumes({})).toBe(true)
    expect(isEffectVolumes({ 'act1-the-dream': { lightning: 2.5 } })).toBe(true)
  })

  it('refuses anything else', () => {
    expect(isEffectVolumes(null)).toBe(false)
    expect(isEffectVolumes([])).toBe(false)
    expect(isEffectVolumes({ t: 1 })).toBe(false)
    expect(isEffectVolumes({ t: { rain: '1' } })).toBe(false)
    expect(isEffectVolumes({ t: { rain: 4 } })).toBe(false)
    expect(isEffectVolumes({ t: { rain: -0.1 } })).toBe(false)
    expect(isEffectVolumes({ 'Bad Track': { rain: 1 } })).toBe(false)
  })
})

describe('the saved volumes', () => {
  it('are well formed', () => {
    expect(isEffectVolumes(SAVED_EFFECT_VOLUMES)).toBe(true)
  })

  it('name only effects their room plays', () => {
    for (const [track, effects] of Object.entries(SAVED_EFFECT_VOLUMES)) {
      const ids = ambienceAt(track).map((effect) => effect.id)
      for (const id of Object.keys(effects)) expect(ids, track).toContain(id)
    }
  })
})
