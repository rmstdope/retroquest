import { afterEach, describe, expect, it, vi } from 'vitest'
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

  it('lets the water fall denser at amount 5 than at amount 3', () => {
    const at3 = run(['water'], { amount: 3 }, 20).count('water')
    const at5 = run(['water'], { amount: 5 }, 20).count('water')
    expect(at5).toBeGreaterThan(at3)
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

  it('draws the ripples under the glints, whatever order the manifest lists them in', () => {
    const scene = run(['glints', 'ripples'], undefined, 400)
    const calls: string[] = []
    const log = (name: string) => (): void => {
      calls.push(name)
    }
    scene.draw(
      fakeContext({
        drawImage: log('drawImage'),
        fillRect: log('fillRect'),
        stroke: log('stroke'),
      }),
    )
    const lastRipple = calls.lastIndexOf('drawImage')
    const firstGlint = calls.findIndex((c) => c !== 'drawImage')
    expect(lastRipple).toBeGreaterThanOrEqual(0)
    expect(firstGlint).toBeGreaterThan(lastRipple)
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

  it('draws no glow when both the mark and the middle of its rectangle lie outside a hollow shape', () => {
    const scene = sceneOf(1280, 720)
    scene.setEffects(
      [
        {
          kind: 'moonglow',
          settings: { amount: 2 },
          box: { ...BOX, mark: { x: 0.9, y: 0.3 } },
          polygon: [
            { x: 0.25, y: 0.25 },
            { x: 0.75, y: 0.25 },
            { x: 0.75, y: 0.35 },
            { x: 0.35, y: 0.35 },
            { x: 0.35, y: 0.75 },
            { x: 0.25, y: 0.75 },
          ],
        },
      ],
      true,
    )
    const createRadialGradient = vi.fn(() => ({ addColorStop: vi.fn() }))
    scene.draw(fakeContext({ createRadialGradient }))
    expect(createRadialGradient).not.toHaveBeenCalled()
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

describe('a spot drawn as several shapes', () => {
  /** Two triangles that split one box between them. */
  const UPPER = [
    { x: 0.25, y: 0.25 },
    { x: 0.75, y: 0.25 },
    { x: 0.25, y: 0.75 },
  ]
  const LOWER = [
    { x: 0.75, y: 0.25 },
    { x: 0.75, y: 0.75 },
    { x: 0.25, y: 0.75 },
  ]

  it('plays each shape as its own layer, even when they share a box', () => {
    const one = sceneOf(960, 540)
    one.setEffects([{ kind: 'smoke', box: BOX, polygon: UPPER }], true)
    const two = sceneOf(960, 540)
    two.setEffects(
      [
        { kind: 'smoke', box: BOX, polygon: UPPER },
        { kind: 'smoke', box: BOX, polygon: LOWER },
      ],
      true,
    )
    expect(two.count('smoke')).toBe(2 * one.count('smoke'))
  })

  it('lays a shape anew when its corners move inside the same box', () => {
    const scene = sceneOf(960, 540)
    scene.setEffects([{ kind: 'fire', box: BOX, polygon: UPPER }], true)
    scene.setEffects([{ kind: 'fire', box: BOX, polygon: LOWER }], true)
    const corners: string[] = []
    const record =
      (name: string) =>
      (x: number, y: number): void => {
        corners.push(`${name} ${x},${y}`)
      }
    scene.draw(
      fakeContext({ moveTo: record('moveTo'), lineTo: record('lineTo') }),
    )
    // LOWER's corner at (0.75, 0.75) of the picture, which UPPER does not have.
    expect(corners).toContain('lineTo 720,405')
  })
})

describe('a floating kind drawn inside a shape', () => {
  afterEach(() => vi.restoreAllMocks())

  type Corner = { x: number; y: number }
  /** A rectangle of the picture, as the four corners a drawn shape has. */
  function rectangle(x0: number, y0: number, x1: number, y1: number): Corner[] {
    return [
      { x: x0, y: y0 },
      { x: x1, y: y0 },
      { x: x1, y: y1 },
      { x: x0, y: y1 },
    ]
  }
  /** The box around some corners, as a spot spec carries it. */
  function boxOf(points: Corner[]): AreaBox {
    const xs = points.map((p) => p.x)
    const ys = points.map((p) => p.y)
    const x = Math.min(...xs)
    const y = Math.min(...ys)
    return {
      x,
      y,
      width: Math.max(...xs) - x,
      height: Math.max(...ys) - y,
    }
  }
  /** What a floating kind drawn in `polygon` plays. */
  function drawnIn(
    kind: MotionKind,
    polygon: Corner[],
    settings?: Record<string, number>,
  ) {
    return {
      kind,
      box: boxOf(polygon),
      polygon,
      ...(settings ? { settings } : {}),
    }
  }
  /** The right-hand strip of the title screen, a quarter of the picture. */
  const QUARTER = rectangle(0.5, 0, 1, 0.5)
  /** The canvas and the picture are both 16:9, so a picture fraction is this many canvas pixels. */
  const W = 1280
  const H = 720

  /** Where, in canvas pixels, a speck of `kind` is drawn, and at what alpha, over some seconds. */
  function watch(
    scene: ReturnType<typeof sceneOf>,
    kind: MotionKind,
    seconds: number,
  ): { x: number; y: number; alpha: number }[] {
    const seen: { x: number; y: number; alpha: number }[] = []
    let alpha = 1
    const at = (x: number, y: number): void => {
      seen.push({ x, y, alpha })
    }
    const ctx = new Proxy({} as Record<string, unknown>, {
      get: (t, key: string) => {
        if (key === 'arc') return (x: number, y: number) => at(x, y)
        if (key === 'translate')
          return (x: number, y: number) => {
            if (kind === 'leaves') at(x, y)
          }
        if (key === 'fillRect')
          return (x: number, y: number, w: number, h: number) => {
            if (kind === 'fireflies') at(x + w / 2, y + h / 2)
          }
        if (key === 'createRadialGradient')
          return () => ({ addColorStop: vi.fn() })
        return t[key] ?? vi.fn()
      },
      set: (t, key: string, value: unknown) => {
        if (key === 'globalAlpha') alpha = Number(value)
        t[key] = value
        return true
      },
    }) as unknown as CanvasRenderingContext2D
    for (let i = 0; i < seconds * 20; i++) {
      scene.step(50)
      scene.draw(ctx)
    }
    return seen
  }

  it('holds the density it has over the whole picture, by the size of the shape', () => {
    const whole = sceneOf(W, H)
    whole.setEffects([{ kind: 'dust' }], true)
    const quarter = sceneOf(W, H)
    quarter.setEffects([drawnIn('dust', QUARTER)], true)
    expect(whole.count('dust')).toBe(16)
    expect(quarter.count('dust')).toBe(4)
    const strip = sceneOf(W, H)
    strip.setEffects([drawnIn('fireflies', QUARTER, { amount: 3 })], true)
    expect(strip.count('fireflies')).toBe(7)
  }, 30_000)

  it('counts the area a shape encloses, not the box around it', () => {
    const triangle = [
      { x: 0.5, y: 0 },
      { x: 1, y: 0 },
      { x: 0.5, y: 0.5 },
    ]
    const scene = sceneOf(W, H)
    scene.setEffects([drawnIn('dust', triangle)], true)
    expect(scene.count('dust')).toBe(2)
  }, 30_000)

  it('keeps a speck in a small shape, and none at amount 0', () => {
    const small = rectangle(0.5, 0.5, 0.52, 0.52)
    for (const kind of ['dust', 'fireflies', 'mist'] as const) {
      const scene = sceneOf(W, H)
      scene.setEffects([drawnIn(kind, small)], true)
      expect(scene.count(kind)).toBeGreaterThanOrEqual(1)
      const none = sceneOf(W, H)
      none.setEffects([drawnIn(kind, QUARTER, { amount: 0 })], true)
      expect(none.count(kind)).toBe(0)
    }
  }, 30_000)

  it('shares the amount between several shapes by their size', () => {
    const one = sceneOf(W, H)
    one.setEffects([drawnIn('dust', rectangle(0, 0, 1, 0.5))], true)
    const two = sceneOf(W, H)
    two.setEffects(
      [
        drawnIn('dust', rectangle(0, 0, 0.5, 0.5)),
        drawnIn('dust', rectangle(0.5, 0, 1, 0.5)),
      ],
      true,
    )
    expect(two.count('dust')).toBe(one.count('dust'))
  }, 30_000)

  it('keeps every speck inside the shape for as long as it plays', () => {
    const shape = rectangle(0.55, 0.2, 0.95, 0.8)
    const x0 = 0.55 * W
    const x1 = 0.95 * W
    const y0 = 0.2 * H
    const y1 = 0.8 * H
    for (const kind of [
      'dust',
      'fireflies',
      'mist',
      'leaves',
      'embers',
    ] as const) {
      const scene = sceneOf(W, H)
      scene.setEffects([drawnIn(kind, shape, { amount: 3 })], true)
      const seen = watch(scene, kind, 30)
      expect(seen.length, kind).toBeGreaterThan(0)
      for (const p of seen) {
        expect(p.x, kind).toBeGreaterThanOrEqual(x0 - 1)
        expect(p.x, kind).toBeLessThanOrEqual(x1 + 1)
        expect(p.y, kind).toBeGreaterThanOrEqual(y0 - 1)
        expect(p.y, kind).toBeLessThanOrEqual(y1 + 1)
      }
    }
  }, 30_000)

  it('lets leaves come loose along the top of the shape and be gone by its bottom', () => {
    // A leaf comes loose on the first of every five draws, so one does in a short time.
    let draws = 0
    vi.spyOn(Math, 'random').mockImplementation(() =>
      draws++ % 5 === 0 ? 0.00001 : 0.2 + ((draws * 0.37) % 0.6),
    )
    const scene = sceneOf(W, H)
    scene.setEffects(
      [
        drawnIn('leaves', rectangle(0.55, 0.2, 0.95, 0.5), {
          amount: 3,
          speed: 3,
        }),
      ],
      true,
    )
    const seen = watch(scene, 'leaves', 120)
    const top = 0.2 * H
    expect(Math.min(...seen.map((p) => p.y))).toBeLessThan(top + 10)
    expect(Math.max(...seen.map((p) => p.y))).toBeLessThanOrEqual(0.5 * H + 1)
  }, 30_000)

  it('lets embers rise from the bottom of the shape and burn out before its top', () => {
    const scene = sceneOf(W, H)
    scene.setEffects(
      [
        drawnIn('embers', rectangle(0.55, 0.2, 0.95, 0.35), {
          amount: 3,
          speed: 3,
        }),
      ],
      true,
    )
    const seen = watch(scene, 'embers', 60)
    expect(Math.max(...seen.map((p) => p.y))).toBeGreaterThan(0.3 * H)
    expect(Math.min(...seen.map((p) => p.y))).toBeGreaterThanOrEqual(0.2 * H)
  }, 30_000)

  it('holds still inside its shape at speed 0', () => {
    const shape = rectangle(0.55, 0.2, 0.95, 0.8)
    for (const kind of ['dust', 'fireflies', 'mist'] as const) {
      const scene = sceneOf(W, H)
      scene.setEffects([drawnIn(kind, shape, { speed: 0 })], true)
      const first = watch(scene, kind, 1).slice(-scene.count(kind))
      const later = watch(scene, kind, 5).slice(-scene.count(kind))
      expect(
        later.map((p) => [p.x, p.y]),
        kind,
      ).toEqual(first.map((p) => [p.x, p.y]))
    }
  }, 30_000)

  it('fades a speck out as it nears the line, and is whole well inside', () => {
    const shape = rectangle(0.55, 0.2, 0.95, 0.8)
    const scene = sceneOf(W, H)
    scene.setEffects([drawnIn('dust', shape, { amount: 3 })], true)
    const seen = watch(scene, 'dust', 30)
    const edge = (p: { x: number; y: number }): number =>
      Math.min(p.x - 0.55 * W, 0.95 * W - p.x, p.y - 0.2 * H, 0.8 * H - p.y)
    const sorted = [...seen].sort((a, b) => edge(a) - edge(b))
    for (let i = 1; i < sorted.length; i++)
      expect(sorted[i].alpha).toBeGreaterThanOrEqual(sorted[i - 1].alpha - 1e-9)
    expect(sorted[0].alpha).toBeLessThan(0.5)
    expect(sorted[sorted.length - 1].alpha).toBe(1)
  }, 30_000)
  it('spreads mist across the whole shape, and thins it before the line, most at the bottom', () => {
    const shape = rectangle(0, 0, 1, 2 / 3)
    const scene = sceneOf(W, H)
    scene.setEffects([drawnIn('mist', shape, { amount: 3 })], true)
    const seen = watch(scene, 'mist', 20)
    const bottom = (2 / 3) * H
    expect(Math.min(...seen.map((p) => p.y))).toBeLessThan(0.3 * bottom)
    for (const p of seen) {
      // A puff reaching the line is gone, so the line never cuts one.
      if (p.y > bottom - 20) expect(p.alpha).toBeLessThan(0.1)
    }
  }, 30_000)

  it('brings a leaf or an ember now and then to a small shape, as it does to a small picture', () => {
    const small = rectangle(0.5, 0.5, 0.6, 0.6)
    for (const kind of ['leaves', 'embers'] as const) {
      const scene = sceneOf(W, H)
      scene.setEffects([drawnIn(kind, small)], true)
      expect(watch(scene, kind, 240).length, kind).toBeGreaterThan(0)
    }
  }, 30_000)
})
