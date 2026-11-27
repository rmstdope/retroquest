import { readFileSync, existsSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  EFFECT_TYPES,
  effectType,
  settingValue,
  createMotionScene,
} from './motionRenderer'
import { createMotionScene as gameScene } from './roomMotionScene'
import { appliedMotion, madeEffects } from './roomMotion'
import { seedRandom } from '@/testing/seededRandom'

describe('the motion renderer the studio loads', () => {
  it('ranges Amount and Speed to 5 and Glow and Strength to 4', () => {
    const maxima: Record<string, number> = {
      amount: 5,
      speed: 5,
      glow: 4,
      strength: 4,
    }
    for (const t of EFFECT_TYPES)
      for (const s of t.settings)
        expect(s.max, `${t.type} ${s.id}`).toBe(maxima[s.id])
  })

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
    expect(settingValue('dust', { amount: 99 }, 'amount')).toBe(5)
    expect(settingValue('dust', { amount: 4.5 }, 'amount')).toBe(4.5)
    expect(settingValue('dust', { speed: 99 }, 'speed')).toBe(5)
    expect(settingValue('fire', { glow: 99 }, 'glow')).toBe(4)
    expect(settingValue('ripples', { strength: 99 }, 'strength')).toBe(4)
    expect(settingValue('dust', { amount: -5 }, 'amount')).toBe(0)
    expect(settingValue('dust', { amount: Number.NaN }, 'amount')).toBe(1)
  })
})

/** A 2D context that writes down every call made to it, with its arguments. */
function recordingContext(): {
  ctx: CanvasRenderingContext2D
  calls: string[]
} {
  const calls: string[] = []
  const record =
    (name: string) =>
    (...args: unknown[]): unknown => {
      calls.push(`${name}(${JSON.stringify(args)})`)
      return name === 'createRadialGradient' || name === 'createLinearGradient'
        ? { addColorStop: record('addColorStop') }
        : undefined
    }
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (_t, key: string) => record(key),
    set: (_t, key: string, value: unknown) => {
      calls.push(`${key}=${JSON.stringify(value)}`)
      return true
    },
  }) as unknown as CanvasRenderingContext2D
  return { ctx, calls }
}

/** Every draw call a scene makes over a few seconds, with `Math.random` replaced by the same sequence each time. */
function drawnBy(scene: {
  resize(w: number, h: number, p: { width: number; height: number }): void
  step(ms: number): void
  draw(ctx: CanvasRenderingContext2D): void
}): string[] {
  seedRandom()
  const { ctx, calls } = recordingContext()
  for (let i = 0; i < 40; i++) {
    scene.step(100)
    scene.draw(ctx)
  }
  vi.restoreAllMocks()
  return calls
}

describe('the scene the studio drives', () => {
  afterEach(() => vi.restoreAllMocks())

  const SHAPE: [number, number][] = [
    [0.3, 0.6],
    [0.45, 0.6],
    [0.45, 0.8],
    [0.3, 0.8],
  ]

  /** What the studio exports for an image, and so what it hands the scene. */
  const STUDIO = [
    { kind: 'dust', settings: { amount: 2 } },
    { kind: 'fire', settings: { glow: 1.5 }, spot: [SHAPE], mark: [0.35, 0.7] },
    { kind: 'water', settings: {}, spot: [SHAPE] },
    {
      kind: 'smoke',
      settings: {},
      spot: [
        [
          [0.6, 0.1],
          [0.8, 0.1],
          [0.6, 0.4],
        ],
        [
          [0.8, 0.1],
          [0.8, 0.4],
          [0.6, 0.4],
        ],
      ],
    },
  ]

  it('plays the effects the studio hands it exactly as the game plays the same manifest entries', () => {
    const game = gameScene()
    game.resize(960, 540, { width: 1920, height: 1080 })
    seedRandom()
    game.setEffects(
      appliedMotion(madeEffects({ a: { effects: STUDIO } }, 'a'), []),
      true,
    )
    vi.restoreAllMocks()

    const studio = createMotionScene()
    studio.resize(960, 540, { width: 1920, height: 1080 })
    seedRandom()
    studio.setEffects(STUDIO, true)
    vi.restoreAllMocks()

    const drawn = drawnBy(studio)
    expect(drawn.length).toBeGreaterThan(0)
    expect(drawn).toEqual(drawnBy(game))
  })

  it('plays a spot kind handed no shape over the whole picture, for a studio that clips it itself', () => {
    const scene = createMotionScene()
    scene.resize(960, 540, { width: 1920, height: 1080 })
    scene.setEffects([{ kind: 'smoke', settings: {} }], true)
    expect(scene.isEmpty()).toBe(false)
  })

  it('plays nothing of a spot whose shapes are none of them a shape, as the game does', () => {
    const scene = createMotionScene()
    scene.resize(960, 540, { width: 1920, height: 1080 })
    const flat = [
      [0.2, 0.2],
      [0.3, 0.3],
      [0.4, 0.4],
    ]
    scene.setEffects([{ kind: 'smoke', settings: {}, spot: [flat] }], true)
    expect(scene.isEmpty()).toBe(true)
  })

  it('ignores a kind it does not have', () => {
    const scene = createMotionScene()
    scene.resize(960, 540, { width: 1920, height: 1080 })
    scene.setEffects([{ kind: 'rain', settings: {} }], true)
    expect(scene.isEmpty()).toBe(true)
  })
})

describe('the default placement the renderer reports', () => {
  const FLOATING = ['dust', 'leaves', 'embers', 'fireflies', 'mist']

  it('gives each floating type the shape it plays in when none is drawn', () => {
    for (const type of FLOATING) {
      const shapes = effectType(type)?.defaultSpot
      expect(shapes?.length).toBeGreaterThan(0)
      for (const shape of shapes ?? []) {
        expect(shape.length).toBeGreaterThanOrEqual(3)
        for (const [x, y] of shape) {
          expect(x).toBeGreaterThanOrEqual(0)
          expect(x).toBeLessThanOrEqual(1)
          expect(y).toBeGreaterThanOrEqual(0)
          expect(y).toBeLessThanOrEqual(1)
        }
      }
    }
  })

  it('reports dust, leaves and embers over the whole picture, fireflies in their lower band and mist in its low band', () => {
    const box = (type: string): number[] => {
      const points = effectType(type)?.defaultSpot?.[0] ?? []
      const xs = points.map((p) => p[0])
      const ys = points.map((p) => p[1])
      return [
        Math.min(...xs),
        Math.min(...ys),
        Math.max(...xs),
        Math.max(...ys),
      ]
    }
    for (const type of ['dust', 'leaves', 'embers'])
      expect(box(type)).toEqual([0, 0, 1, 1])
    expect(box('fireflies')).toEqual([0.1, 0.5, 0.9, 0.9])
    expect(box('mist')).toEqual([0, 0.6, 1, 1])
  })

  it('reports none for the types that need a drawn spot', () => {
    for (const t of EFFECT_TYPES.filter((t) => t.spot))
      expect(t.defaultSpot).toBeUndefined()
  })
})

describe('the studio handing a floating kind a shape', () => {
  const STRIP = [
    [0.6, 0.2],
    [1, 0.2],
    [1, 0.8],
    [0.6, 0.8],
  ]

  it('plays it in the shape, in each shape, and plays it as before without one', () => {
    const scene = createMotionScene()
    scene.resize(960, 540, { width: 1920, height: 1080 })
    scene.setEffects([{ kind: 'fireflies', settings: {}, spot: [STRIP] }], true)
    const drawn = drawnBy(scene)
    const game = gameScene()
    game.resize(960, 540, { width: 1920, height: 1080 })
    game.setEffects(
      appliedMotion(
        madeEffects(
          { a: { effects: [{ kind: 'fireflies', spot: [STRIP] }] } },
          'a',
        ),
        [],
      ),
      true,
    )
    expect(scene.count('fireflies')).toBe(game.count('fireflies'))
    expect(drawn.length).toBeGreaterThan(0)
    // The strip is a fraction of the picture, so it holds fewer than the whole picture would.
    const whole = createMotionScene()
    whole.resize(960, 540, { width: 1920, height: 1080 })
    whole.setEffects([{ kind: 'fireflies', settings: {} }], true)
    expect(scene.count('fireflies')).toBeLessThan(whole.count('fireflies'))
  })

  it('plays its default placement when the shapes handed are none of them a shape', () => {
    const scene = createMotionScene()
    scene.resize(960, 540, { width: 1920, height: 1080 })
    const flat = [
      [0.2, 0.2],
      [0.3, 0.3],
      [0.4, 0.4],
    ]
    scene.setEffects([{ kind: 'dust', settings: {}, spot: [flat] }], true)
    expect(scene.count('dust')).toBe(9)
  })
})

describe("the studio's project file", () => {
  it('names this module as the motion renderer', () => {
    const project = JSON.parse(readFileSync('../content-studio.json', 'utf8'))
    expect(project.images.motion).toBe('web/src/lantern/motionRenderer.ts')
    expect(existsSync(`../${project.images.motion}`)).toBe(true)
  })
})
