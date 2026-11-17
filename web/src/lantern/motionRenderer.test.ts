import { describe, expect, it } from 'vitest'
import {
  EFFECT_TYPES,
  effectType,
  settingValue,
  createMotionScene,
} from './motionRenderer'
import { createMotionScene as sceneOfOrigin } from './roomMotionScene'

describe('the motion renderer the studio loads', () => {
  it('lists every effect type, spots first marked as needing a spot', () => {
    expect(EFFECT_TYPES.map((t) => t.type).sort()).toEqual(
      [
        'dust',
        'embers',
        'fire',
        'fireflies',
        'glints',
        'leaves',
        'mist',
        'moonglow',
        'ripples',
        'smoke',
        'stars',
        'water',
        'clouds',
      ].sort(),
    )
    const spots = EFFECT_TYPES.filter((t) => t.spot).map((t) => t.type)
    expect(spots.sort()).toEqual(
      [
        'clouds',
        'fire',
        'glints',
        'moonglow',
        'ripples',
        'smoke',
        'stars',
        'water',
      ].sort(),
    )
  })

  it('gives every type amount and speed, each inside its range and defaulting to 1', () => {
    for (const t of EFFECT_TYPES) {
      const ids = t.settings.map((s) => s.id)
      expect(ids).toContain('amount')
      expect(ids).toContain('speed')
      for (const s of t.settings) {
        expect(s.min).toBeLessThan(s.max)
        expect(s.default).toBeGreaterThanOrEqual(s.min)
        expect(s.default).toBeLessThanOrEqual(s.max)
        expect(s.default).toBe(1)
      }
    }
  })

  it("gives fire and the moon's glow a glow setting, and ripples a strength", () => {
    expect(
      EFFECT_TYPES.filter((t) => t.settings.some((s) => s.id === 'glow')).map(
        (t) => t.type,
      ),
    ).toEqual(['fire', 'moonglow'])
    expect(
      EFFECT_TYPES.filter((t) =>
        t.settings.some((s) => s.id === 'strength'),
      ).map((t) => t.type),
    ).toEqual(['ripples'])
  })

  it('finds a type, and reads a setting with its default and clamped range', () => {
    expect(effectType('dust')?.title).toBe('Dust')
    expect(effectType('nope')).toBeUndefined()
    expect(settingValue('dust', undefined, 'amount')).toBe(1)
    expect(settingValue('dust', { amount: 2 }, 'amount')).toBe(2)
    expect(settingValue('dust', { amount: 99 }, 'amount')).toBe(3)
    expect(settingValue('dust', { amount: -5 }, 'amount')).toBe(0)
    expect(settingValue('dust', { amount: Number.NaN }, 'amount')).toBe(1)
  })

  it('hands out the game scene itself', () => {
    expect(createMotionScene).toBe(sceneOfOrigin)
  })
})
