import { describe, expect, it, vi } from 'vitest'
import { boxRect, createMotionScene, pointPosition } from './roomMotionScene'
import type { AreaBox, MotionKind } from './roomMotion'

const PICTURE = { width: 1920, height: 1080 }
const BOX: AreaBox = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 }

/** A scene of a canvas `w` × `h` over a 16:9 picture. */
function sceneOf(w: number, h: number) {
  const scene = createMotionScene()
  scene.resize(w, h, PICTURE)
  return scene
}

/** A 2D context that records nothing and accepts everything. */
function fakeContext(
  extra: Record<string, unknown> = {},
): CanvasRenderingContext2D {
  const gradient = { addColorStop: vi.fn() }
  const target = {
    createRadialGradient: () => gradient,
    ...extra,
  } as Record<string, unknown>
  return new Proxy(target, {
    get: (t, key: string) => t[key] ?? vi.fn(),
    set: () => true,
  }) as unknown as CanvasRenderingContext2D
}

describe('pointPosition', () => {
  it('maps a picture fraction onto a canvas that shows the whole picture', () => {
    expect(
      pointPosition({ x: 0.5, y: 0.25 }, { width: 960, height: 540 }, PICTURE),
    ).toEqual({ x: 480, y: 135 })
  })

  it('maps through the trim, and may land outside the canvas', () => {
    const at = pointPosition(
      { x: 0.9, y: 0.5 },
      { width: 300, height: 400 },
      PICTURE,
    )
    // Drawn 711.1 wide, 205.6 cut off at the left.
    expect(at.x).toBeCloseTo(-205.5556 + 0.9 * 711.1111, 3)
    expect(at.x).toBeGreaterThan(300)
    expect(at.y).toBe(200)
  })
})

describe('boxRect', () => {
  it('is the box in canvas pixels when the picture fits the canvas', () => {
    expect(boxRect(BOX, { width: 1280, height: 720 }, PICTURE)).toEqual({
      x: 320,
      y: 180,
      w: 640,
      h: 360,
    })
  })

  it('follows the trimmed fit on a tall canvas', () => {
    // 360 × 640: the picture is 1138 wide, 389 trimmed each side; the box starts 104 left of the canvas and is cut off at both its edges.
    const rect = boxRect(BOX, { width: 360, height: 640 }, PICTURE)
    expect(rect?.y).toBeCloseTo(160)
    expect(rect?.h).toBeCloseTo(320)
    expect(rect?.x).toBe(0)
    expect(rect?.w).toBeCloseTo(360)
  })

  it('is null when the box is trimmed off the picture entirely', () => {
    const left: AreaBox = { x: 0, y: 0, width: 0.1, height: 0.5 }
    expect(boxRect(left, { width: 360, height: 640 }, PICTURE)).toBeNull()
  })
})

describe('a scene', () => {
  it('has nothing to run until it is given movement', () => {
    expect(sceneOf(1280, 720).isEmpty()).toBe(true)
  })

  it('makes a few specks, scaled to the size of the picture', () => {
    const large = sceneOf(1280, 720)
    large.setEffects([{ kind: 'dust' }], true)
    const small = sceneOf(360, 200)
    small.setEffects([{ kind: 'dust' }], true)
    expect(large.count('dust')).toBe(16)
    expect(small.count('dust')).toBeGreaterThanOrEqual(1)
    expect(small.count('dust')).toBeLessThan(large.count('dust') / 4)
  })

  it('lets at most a couple of leaves fall at a time', () => {
    const scene = sceneOf(1280, 720)
    scene.setEffects([{ kind: 'leaves' }], true)
    let most = 0
    for (let i = 0; i < 3000; i++) {
      scene.step(16.7)
      most = Math.max(most, scene.count('leaves'))
    }
    expect(most).toBeGreaterThan(0)
    expect(most).toBeLessThanOrEqual(2)
  })

  it('is already under way when a room is entered', () => {
    const scene = sceneOf(1280, 720)
    scene.setEffects([{ kind: 'water', box: BOX }], true)
    expect(scene.count('water')).toBeGreaterThan(0)
    const fresh = sceneOf(1280, 720)
    fresh.setEffects([{ kind: 'water', box: BOX }], false)
    expect(fresh.count('water')).toBe(0)
  })

  it('makes nothing of a spot that is trimmed off the picture', () => {
    const scene = sceneOf(360, 640)
    scene.setEffects(
      [{ kind: 'water', box: { x: 0, y: 0, width: 0.1, height: 0.5 } }],
      true,
    )
    for (let i = 0; i < 200; i++) scene.step(16.7)
    expect(scene.count('water')).toBe(0)
  })

  it('fades what no longer applies out over about a second, then is empty', () => {
    const scene = sceneOf(1280, 720)
    scene.setEffects([{ kind: 'dust' }], true)
    scene.setEffects([], false)
    scene.step(500)
    expect(scene.isEmpty()).toBe(false)
    scene.step(600)
    expect(scene.isEmpty()).toBe(true)
  })

  it('calls back a layer that is wanted again instead of doubling it', () => {
    const scene = sceneOf(1280, 720)
    scene.setEffects([{ kind: 'dust' }], true)
    scene.setEffects([], false)
    scene.setEffects([{ kind: 'dust' }], false)
    expect(scene.count('dust')).toBe(16)
  })

  it('draws every kind without a fault', () => {
    const scene = sceneOf(1280, 720)
    scene.setEffects(
      [
        { kind: 'dust' },
        { kind: 'leaves' },
        { kind: 'embers' },
        { kind: 'fireflies' },
        { kind: 'mist' },
        { kind: 'water', box: BOX },
        { kind: 'fire', box: BOX },
        { kind: 'smoke', box: BOX },
      ],
      true,
    )
    for (let i = 0; i < 400; i++) {
      scene.step(16.7)
      scene.draw(fakeContext())
    }
    expect(scene.isEmpty()).toBe(false)
  })

  it('lays a spot again where the picture now is when it is resized', () => {
    const scene = sceneOf(1280, 720)
    scene.setEffects([{ kind: 'water', box: BOX }], true)
    scene.resize(360, 640, PICTURE)
    for (let i = 0; i < 200; i++) scene.step(16.7)
    expect(scene.count('water')).toBeGreaterThan(0)
  })

  it('is no more crowded with embers or leaves on a small picture than on a large one', () => {
    for (const kind of ['embers', 'leaves'] as const) {
      /** Specks live at a time for each full 1280 × 720 of picture. */
      const density = (w: number, h: number): number => {
        const scene = sceneOf(w, h)
        scene.setEffects([{ kind }], true)
        const ticks = 40000
        let sum = 0
        for (let i = 0; i < ticks; i++) {
          scene.step(16.7)
          sum += scene.count(kind)
        }
        return sum / ticks / ((w * h) / (1280 * 720))
      }
      expect(density(390, 219), kind).toBeLessThan(density(1280, 720) * 1.5)
    }
  })

  it('starts every mist blob inside the canvas, on a large one too', () => {
    const scene = sceneOf(2560, 1440)
    scene.setEffects([{ kind: 'mist' }], true)
    const arc = vi.fn()
    scene.draw(fakeContext({ arc }))
    expect(arc.mock.calls.length).toBeGreaterThan(6)
    for (const call of arc.mock.calls) expect(call[1]).toBeLessThanOrEqual(1440)
  })
})

describe('the settings of an effect', () => {
  /** The scene with one effect run for `ticks` ticks of 1/60 s, from empty. */
  function run(
    kind: MotionKind,
    settings: Record<string, number> | undefined,
    ticks: number,
    box?: AreaBox,
  ) {
    const scene = sceneOf(1280, 720)
    scene.setEffects([{ kind, settings, box }], false)
    for (let i = 0; i < ticks; i++) scene.step(1000 / 60)
    return scene
  }

  it('plays at the old amounts when no settings are given or all are at their defaults', () => {
    for (const kind of ['dust', 'fireflies', 'mist'] as const)
      expect(run(kind, { amount: 1, speed: 1 }, 5).count(kind)).toBe(
        run(kind, undefined, 5).count(kind),
      )
    expect(run('dust', undefined, 5).count('dust')).toBe(16)
  })

  it('has more specks for a bigger amount and none for amount 0', () => {
    expect(run('dust', { amount: 2 }, 5).count('dust')).toBe(32)
    expect(run('dust', { amount: 0 }, 5).count('dust')).toBe(0)
  })

  it('spawns embers, smoke and water more often for a bigger amount', () => {
    for (const kind of ['embers', 'smoke', 'water'] as const) {
      const few = run(kind, { amount: 0.5 }, 300, BOX).count(kind)
      const many = run(kind, { amount: 2 }, 300, BOX).count(kind)
      expect(many, kind).toBeGreaterThan(few)
      expect(run(kind, { amount: 0 }, 300, BOX).count(kind)).toBe(0)
    }
  })

  it('draws a spot inside its drawn shape only', () => {
    const scene = sceneOf(1280, 720)
    scene.setEffects(
      [
        {
          kind: 'fire',
          box: BOX,
          polygon: [
            { x: 0.25, y: 0.25 },
            { x: 0.75, y: 0.25 },
            { x: 0.5, y: 0.75 },
          ],
        },
      ],
      true,
    )
    const clip = vi.fn()
    scene.draw(fakeContext({ clip }))
    expect(clip).toHaveBeenCalled()
  })

  it('leaves smoke unclipped, as it always was, and clips the other spots to their shape', () => {
    const polygon = [
      { x: 0.25, y: 0.25 },
      { x: 0.75, y: 0.25 },
      { x: 0.5, y: 0.75 },
    ]
    for (const [kind, clips] of [
      ['smoke', false],
      ['fire', true],
    ] as const) {
      const scene = sceneOf(1280, 720)
      scene.setEffects([{ kind, box: BOX, polygon }], true)
      const clip = vi.fn()
      scene.draw(fakeContext({ clip }))
      expect(clip.mock.calls.length > 0, kind).toBe(clips)
    }
  })

  it('lays an effect anew when a setting changes', () => {
    const scene = sceneOf(1280, 720)
    scene.setEffects([{ kind: 'dust', settings: { amount: 1 } }], true)
    scene.setEffects([{ kind: 'dust', settings: { amount: 2 } }], true)
    expect(scene.count('dust')).toBe(32)
  })
})

describe("the title picture's kinds", () => {
  const POLYGON = [
    { x: 0.25, y: 0.25 },
    { x: 0.75, y: 0.25 },
    { x: 0.5, y: 0.75 },
  ]
  const MARK = { x: 0.5, y: 0.3 }
  const SPOT = { box: { ...BOX, mark: MARK }, polygon: POLYGON }
  const KINDS = ['ripples', 'glints', 'clouds', 'stars', 'moonglow'] as const

  /** A source picture for the ripples to redraw. */
  const SOURCE = { image: {} as CanvasImageSource, width: 1920, height: 1080 }

  /** A scene of the kinds in `kinds` with `settings`, run for `ticks`. */
  function run(
    kinds: readonly MotionKind[],
    settings: Record<string, number> | undefined,
    ticks: number,
  ) {
    const scene = sceneOf(1280, 720)
    scene.setSource(SOURCE)
    scene.setEffects(
      kinds.map((kind) => ({ kind, settings, ...SPOT })),
      true,
    )
    for (let i = 0; i < ticks; i++) scene.step(1000 / 60)
    return scene
  }

  it('runs and draws every one, clipped to its drawn shape, without a fault', () => {
    const scene = run(KINDS, undefined, 400)
    const clip = vi.fn()
    for (let i = 0; i < 60; i++) {
      scene.step(16.7)
      scene.draw(fakeContext({ clip }))
    }
    expect(scene.isEmpty()).toBe(false)
    expect(clip).toHaveBeenCalled()
  })

  it('has specks for glints, stars and clouds, more for a bigger amount and none for amount 0', () => {
    for (const kind of ['glints', 'stars', 'clouds'] as const) {
      const normal = run([kind], undefined, 3).count(kind)
      expect(normal, kind).toBeGreaterThan(0)
      expect(run([kind], { amount: 2 }, 3).count(kind), kind).toBeGreaterThan(
        normal,
      )
      expect(run([kind], { amount: 0 }, 3).count(kind), kind).toBe(0)
    }
  })

  it('redraws the picture for the ripples only when it has the picture', () => {
    for (const [source, drawn] of [
      [SOURCE, true],
      [null, false],
    ] as const) {
      const scene = sceneOf(1280, 720)
      scene.setSource(source)
      scene.setEffects([{ kind: 'ripples', ...SPOT }], true)
      const drawImage = vi.fn()
      scene.draw(fakeContext({ drawImage }))
      expect(drawImage.mock.calls.length > 0).toBe(drawn)
    }
  })

  it('stills the ripples at amount 0', () => {
    const scene = sceneOf(1280, 720)
    scene.setSource(SOURCE)
    scene.setEffects(
      [{ kind: 'ripples', settings: { amount: 0 }, ...SPOT }],
      true,
    )
    const drawImage = vi.fn()
    scene.draw(fakeContext({ drawImage }))
    expect(drawImage).not.toHaveBeenCalled()
  })

  it("draws the moon's glow with the mark as its centre and shows nothing at amount 0", () => {
    for (const [amount, drawn] of [
      [1, true],
      [0, false],
    ] as const) {
      const scene = sceneOf(1280, 720)
      scene.setEffects(
        [{ kind: 'moonglow', settings: { amount }, ...SPOT }],
        true,
      )
      const createRadialGradient = vi.fn(() => ({ addColorStop: vi.fn() }))
      scene.draw(fakeContext({ createRadialGradient }))
      expect(createRadialGradient.mock.calls.length > 0).toBe(drawn)
      if (drawn) {
        const [x, y] = createRadialGradient.mock.calls[0] as unknown as number[]
        expect(x).toBeCloseTo(640)
        expect(y).toBeCloseTo(216)
      }
    }
  })

  it("fades the moon's glow to nothing inside the drawn shape at every amount", () => {
    for (const amount of [0.5, 1, 2, 3]) {
      const scene = sceneOf(1280, 720)
      scene.setEffects(
        [{ kind: 'moonglow', settings: { amount }, ...SPOT }],
        true,
      )
      const createRadialGradient = vi.fn(() => ({ addColorStop: vi.fn() }))
      scene.draw(fakeContext({ createRadialGradient }))
      const [x, y, , , , radius] = createRadialGradient.mock
        .calls[0] as unknown as number[]
      const edge = nearestEdge(x, y)
      expect(radius).toBeLessThan(edge)
    }
  })

  it("keeps the moon's glow growing with its amount where the shape allows", () => {
    const radiusAt = (amount: number, mark: { x: number; y: number }) => {
      const scene = sceneOf(1280, 720)
      scene.setEffects(
        [
          {
            kind: 'moonglow',
            settings: { amount },
            ...SPOT,
            box: { ...BOX, mark },
          },
        ],
        true,
      )
      const createRadialGradient = vi.fn(() => ({ addColorStop: vi.fn() }))
      scene.draw(fakeContext({ createRadialGradient }))
      return createRadialGradient.mock.calls[0] as unknown as number[]
    }
    const middle = { x: 0.5, y: 0.45 }
    expect(radiusAt(0.05, middle)[5]).toBeLessThan(radiusAt(0.1, middle)[5])
    expect(radiusAt(0.05, middle)[5]).toBeCloseTo(16)
  })

  it("never lets the moon's glow start beyond where it ends, next to an edge", () => {
    const scene = sceneOf(1280, 720)
    scene.setEffects(
      [
        {
          kind: 'moonglow',
          settings: { amount: 3 },
          ...SPOT,
          box: { ...BOX, mark: { x: 0.5, y: 0.2501 } },
        },
      ],
      true,
    )
    const createRadialGradient = vi.fn(() => ({ addColorStop: vi.fn() }))
    scene.draw(fakeContext({ createRadialGradient }))
    const [, , inner, , , outer] = createRadialGradient.mock
      .calls[0] as unknown as number[]
    expect(outer).toBeGreaterThan(inner)
  })

  it("keeps the moon's glow inside the drawn shape at every amount when its mark lies outside it", () => {
    for (const amount of [0.5, 1, 2, 3]) {
      const scene = sceneOf(1280, 720)
      scene.setEffects(
        [
          {
            kind: 'moonglow',
            settings: { amount },
            ...SPOT,
            box: { ...BOX, mark: { x: 0.9, y: 0.3 } },
          },
        ],
        true,
      )
      const createRadialGradient = vi.fn(() => ({ addColorStop: vi.fn() }))
      scene.draw(fakeContext({ createRadialGradient }))
      const [x, y, , , , radius] = createRadialGradient.mock
        .calls[0] as unknown as number[]
      expect(insidePolygon(x, y)).toBe(true)
      expect(radius).toBeLessThan(nearestEdge(x, y))
    }
  })

  it("keeps the moon's glow inside its rectangle at every amount when its mark lies outside it", () => {
    for (const amount of [0.5, 1, 2, 3]) {
      const scene = sceneOf(1280, 720)
      scene.setEffects(
        [
          {
            kind: 'moonglow',
            settings: { amount },
            box: { ...BOX, mark: { x: 0.9, y: 0.3 } },
          },
        ],
        true,
      )
      const createRadialGradient = vi.fn(() => ({ addColorStop: vi.fn() }))
      scene.draw(fakeContext({ createRadialGradient }))
      const [x, y, , , , radius] = createRadialGradient.mock
        .calls[0] as unknown as number[]
      const rect = { x: 320, y: 180, w: 640, h: 360 }
      const edge = Math.min(
        x - rect.x,
        rect.x + rect.w - x,
        y - rect.y,
        rect.y + rect.h - y,
      )
      expect(edge).toBeGreaterThan(0)
      expect(radius).toBeLessThan(edge)
    }
  })

  /** Whether (x, y) lies inside the title polygon on a 1280 by 720 canvas. */
  function insidePolygon(x: number, y: number): boolean {
    const points = POLYGON.map((p) => ({ x: p.x * 1280, y: p.y * 720 }))
    let inside = false
    points.forEach((a, i) => {
      const b = points[(i + 1) % points.length]
      if (
        a.y > y !== b.y > y &&
        x < a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x)
      )
        inside = !inside
    })
    return inside
  }

  /** The distance from (x, y) to the nearest side of the title polygon on a 1280 by 720 canvas, cover-fitted like the scene's picture. */
  function nearestEdge(x: number, y: number): number {
    const points = POLYGON.map((p) => ({ x: p.x * 1280, y: p.y * 720 }))
    let best = Infinity
    points.forEach((a, i) => {
      const b = points[(i + 1) % points.length]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const u = Math.max(
        0,
        Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy)),
      )
      best = Math.min(best, Math.hypot(x - a.x - u * dx, y - a.y - u * dy))
    })
    return best
  }

  it('moves the clouds across the picture', () => {
    const scene = run(['clouds'], undefined, 1)
    const before = JSON.stringify(
      (() => {
        const fills: number[] = []
        scene.draw(
          fakeContext({
            createRadialGradient: (x: number) => {
              fills.push(x)
              return { addColorStop: vi.fn() }
            },
          }),
        )
        return fills
      })(),
    )
    for (let i = 0; i < 120; i++) scene.step(1000 / 60)
    const after = JSON.stringify(
      (() => {
        const fills: number[] = []
        scene.draw(
          fakeContext({
            createRadialGradient: (x: number) => {
              fills.push(x)
              return { addColorStop: vi.fn() }
            },
          }),
        )
        return fills
      })(),
    )
    expect(after).not.toBe(before)
  })
})
