import { describe, expect, it, vi } from 'vitest'
import { boxRect, createMotionScene } from './roomMotionScene'
import type { AreaBox } from './roomMotion'

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
      const mean = (w: number, h: number): number => {
        const scene = sceneOf(w, h)
        scene.setEffects([{ kind }], true)
        let sum = 0
        for (let i = 0; i < 6000; i++) {
          scene.step(16.7)
          sum += scene.count(kind)
        }
        return sum / 6000
      }
      const large = mean(1280, 720)
      const small = mean(390, 219)
      expect(small, kind).toBeLessThan(large * 0.5 + 0.5)
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
