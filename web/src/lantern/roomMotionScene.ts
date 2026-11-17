/**
 * The simulation and drawing of the movement over a room's painting. It knows
 * nothing of the page: it is told the size of the canvas and of the picture
 * (so a box, which is a fraction of the picture, lands where the picture's
 * trimmed fit puts it), the movement that applies (`setEffects`), and then
 * stepped and drawn. Everything is gentle: a few slow specks, at most a couple
 * of leaves at a time, a quiet trickle. The amount follows the size of what is
 * seen, so a small picture is no more crowded than a large one. A floating
 * kind (dust, leaves, embers, fireflies, mist) handed a drawn shape plays
 * inside it: its specks are as dense as over the whole picture by the area of
 * the shape, stay in it, and fade out as they near its line. A layer that
 * stops applying fades out over about a second and a new one fades in; a room
 * entered fresh is run ahead first, so it is already under way.
 */
import { isSpotKind } from './roomMotion'
import type { AreaBox, MotionKind, MotionSpec } from './roomMotion'
import { settingValue } from './motionEffects'

/** The size the amounts of the drawing are for. */
const BASE_WIDTH = 1280
const BASE_HEIGHT = 720
/** A tick of the simulation, in milliseconds (60 frames a second). */
const TICK_MS = 1000 / 60
/** Ticks a fresh room is run ahead. */
const WARM_TICKS = 600
/** How long a layer takes to fade in or out. */
const FADE_MS = 1000

/** The share of the distance to the shape's edge the moon's glow reaches at most, so it fades out inside the shape. */
const GLOW_REACH = 0.9

/** A rectangle in canvas pixels. */
export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** The size of the picture the boxes are fractions of. */
export interface PictureSize {
  width: number
  height: number
}

/** A point on the canvas, in pixels. */
interface Pt {
  x: number
  y: number
}

/** One speck, drop, leaf, ember or puff. */
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  l: number
  m: number
  ph: number
}

/** One kind of movement running over its rectangle. */
interface Layer {
  key: string
  spec: MotionSpec
  rect: Rect | null
  /** The corners of a floating kind's drawn shape in canvas pixels; null when it plays over its default placement or is not a floating kind. */
  points: Pt[] | null
  alpha: number
  target: 0 | 1
  parts: Particle[]
  ticks: number
  /** Whether it was run ahead when it started, and so is again when it is laid anew. */
  warm: boolean
}

/** The picture a scene may redraw (the ripples do): the image and its own pixel size. */
export interface PictureSource {
  image: CanvasImageSource
  width: number
  height: number
}

/** What a scene is driven through. */
export interface MotionScene {
  /** The picture itself, for the effects that redraw it (pond ripples); null while it is not there. */
  setSource(source: PictureSource | null): void
  /** The canvas is `width` × `height` pixels, showing a picture of `picture` size trimmed to fill it. */
  resize(width: number, height: number, picture: PictureSize): void
  /** What applies now; with `instant`, a new layer is run ahead and starts at full strength. */
  setEffects(specs: readonly MotionSpec[], instant: boolean): void
  /** Move on `ms` milliseconds. */
  step(ms: number): void
  /** Draw what there is onto `ctx` (clearing it first). */
  draw(ctx: CanvasRenderingContext2D): void
  /** Whether nothing is left to run or fade. */
  isEmpty(): boolean
  /** How many specks of `kind` are live, over every layer of it. */
  count(kind: MotionKind): number
}

/** The place on a canvas that shows the picture trimmed to fill it where the picture-fraction `point` lies; it may lie outside the canvas, where the trim cuts the picture off. */
export function pointPosition(
  point: { x: number; y: number },
  canvas: PictureSize,
  picture: PictureSize,
): { x: number; y: number } {
  const scale = Math.max(
    canvas.width / picture.width,
    canvas.height / picture.height,
  )
  const drawnW = picture.width * scale
  const drawnH = picture.height * scale
  return {
    x: (canvas.width - drawnW) / 2 + point.x * drawnW,
    y: (canvas.height - drawnH) / 2 + point.y * drawnH,
  }
}

/** The rectangle the picture-fraction `box` covers on a canvas that shows the picture trimmed to fill it; null when none of it is in view. */
export function boxRect(
  box: AreaBox,
  canvas: PictureSize,
  picture: PictureSize,
): Rect | null {
  const scale = Math.max(
    canvas.width / picture.width,
    canvas.height / picture.height,
  )
  const drawnW = picture.width * scale
  const drawnH = picture.height * scale
  const left = (canvas.width - drawnW) / 2 + box.x * drawnW
  const top = (canvas.height - drawnH) / 2 + box.y * drawnH
  const x0 = Math.max(0, left)
  const y0 = Math.max(0, top)
  const x1 = Math.min(canvas.width, left + box.width * drawnW)
  const y1 = Math.min(canvas.height, top + box.height * drawnH)
  if (x1 - x0 < 1 || y1 - y0 < 1) return null
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

/** The amounts of the drawing that float over the whole picture, for a canvas of `area` square pixels. */
function floatCount(base: number, area: number, amount: number): number {
  if (amount <= 0) return 0
  return Math.max(
    1,
    Math.round((base * amount * area) / (BASE_WIDTH * BASE_HEIGHT)),
  )
}

/** Whether something is due on tick `k` when it comes once every `interval` ticks at amount 1 (and so on tick 0, `interval`, ...), `amount` times as often. */
function due(k: number, interval: number, amount: number): boolean {
  if (amount <= 0) return false
  return (
    Math.floor((k * amount) / interval) >
    Math.floor(((k - 1) * amount) / interval)
  )
}

/**
 * The chance a new leaf starts to fall on a tick. One leaf is a bigger share of
 * a small picture than of a large one, so the chance falls faster than the area
 * does, and a small picture has no more leaves for its size.
 */
function leafChance(area: number): number {
  const share = area / (BASE_WIDTH * BASE_HEIGHT)
  return 0.005 * Math.min(1, share * share)
}

/** The area a closed shape encloses (the shoelace formula). */
function polygonArea(points: readonly Pt[]): number {
  let twice = 0
  points.forEach((p, i) => {
    const next = points[(i + 1) % points.length]
    twice += p.x * next.y - next.x * p.y
  })
  return Math.abs(twice) / 2
}

/** Whether (`x`, `y`) lies inside the closed shape `points`. */
function insideShape(points: readonly Pt[], x: number, y: number): boolean {
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

/** The stretch of the line across the shape (`at` along the other axis) that the shape covers, from its first to its last crossing; null when the line misses it. */
function spanAcross(
  points: readonly Pt[],
  across: 'row' | 'column',
  at: number,
): { min: number; max: number } | null {
  const [u, v]: ('x' | 'y')[] = across === 'row' ? ['y', 'x'] : ['x', 'y']
  let min = Infinity
  let max = -Infinity
  points.forEach((a, i) => {
    const b = points[(i + 1) % points.length]
    if (a[u] > at === b[u] > at) return
    const crossing = a[v] + ((at - a[u]) / (b[u] - a[u])) * (b[v] - a[v])
    min = Math.min(min, crossing)
    max = Math.max(max, crossing)
  })
  return max >= min ? { min, max } : null
}

/** How far (`x`, `y`) is from the nearest side of the shape. */
function distanceToLine(points: readonly Pt[], x: number, y: number): number {
  let best = Infinity
  points.forEach((a, i) => {
    const b = points[(i + 1) % points.length]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = dx * dx + dy * dy
    const t = len
      ? Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / len))
      : 0
    best = Math.min(best, Math.hypot(x - a.x - t * dx, y - a.y - t * dy))
  })
  return best
}

/** The least chance a leaf starts to fall on a tick over a drawn shape: about one every half minute. */
const LEAF_FLOOR = 0.0005
/** The most ticks between two embers over a drawn shape: ten seconds. */
const EMBER_CEILING = 600

/** A random number in [0, 1). */
function rnd(): number {
  return Math.random()
}

/** Make a scene. */
export function createMotionScene(): MotionScene {
  let width = BASE_WIDTH
  let height = BASE_HEIGHT
  let picture: PictureSize = { width: 16, height: 9 }
  let layers: Layer[] = []
  let source: PictureSource | null = null

  /** Canvas pixels to a picture pixel when the picture is shown trimmed to fill the canvas. */
  function cover(): number {
    return Math.max(width / picture.width, height / picture.height)
  }

  /** The size of a picture detail drawn for a 1920 pixel wide picture, on this canvas. */
  function k(): number {
    return (cover() * picture.width) / 1920
  }

  /** The light the layer's spot is lit from: its mark on the picture, else the middle of its rectangle. */
  function lightOf(layer: Layer): { x: number; y: number } {
    const mark = layer.spec.box?.mark
    if (mark) return pointPosition(mark, { width, height }, picture)
    const rect = layer.rect
    return rect
      ? { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 }
      : { x: 0, y: 0 }
  }

  /**
   * How far from the light the layer's drawn shape (its polygon, else its rectangle) ends, nearest
   * side; unbounded when the layer has no shape, and nothing when the light lies outside it.
   */
  function edgeDistance(light: { x: number; y: number }, layer: Layer): number {
    const polygon = layer.spec.polygon
    if (!polygon) {
      const r = layer.rect
      if (!r) return Infinity
      const inside = Math.min(
        light.x - r.x,
        r.x + r.w - light.x,
        light.y - r.y,
        r.y + r.h - light.y,
      )
      return Math.max(0, inside)
    }
    const points = polygon.map((p) =>
      pointPosition(p, { width, height }, picture),
    )
    let best = Infinity
    let inside = false
    points.forEach((a, i) => {
      const b = points[(i + 1) % points.length]
      if (
        a.y > light.y !== b.y > light.y &&
        light.x < a.x + ((light.y - a.y) / (b.y - a.y)) * (b.x - a.x)
      )
        inside = !inside
      const dx = b.x - a.x
      const dy = b.y - a.y
      const len = dx * dx + dy * dy
      const u = len
        ? Math.max(
            0,
            Math.min(1, ((light.x - a.x) * dx + (light.y - a.y) * dy) / len),
          )
        : 0
      best = Math.min(
        best,
        Math.hypot(light.x - a.x - u * dx, light.y - a.y - u * dy),
      )
    })
    return inside ? best : 0
  }

  /** Sizes and speeds shrink a little with the canvas, never below 60% nor above the drawing's. */
  function unit(): number {
    return Math.min(1, Math.max(0.6, width / BASE_WIDTH))
  }

  /** The corners of the shape a floating kind plays in, on the canvas; null for any other layer. */
  function pointsOf(spec: MotionSpec): Pt[] | null {
    if (!spec.polygon || isSpotKind(spec.kind)) return null
    return spec.polygon.map((p) => pointPosition(p, { width, height }, picture))
  }

  /** The square pixels of canvas a layer's specks are counted for: the visible part of its shape, else its rectangle. */
  function areaOf(layer: Layer): number {
    const rect = layer.rect
    if (!rect) return 0
    const points = layer.points
    if (!points) return rect.w * rect.h
    const xs = points.map((p) => p.x)
    const ys = points.map((p) => p.y)
    const boxArea =
      (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys))
    return boxArea > 0 ? (polygonArea(points) * rect.w * rect.h) / boxArea : 0
  }

  /** A place for a new speck: random inside the layer's shape and in view; failing that the first place of a grid over the rectangle that is, and null when the shape has none in view. */
  function placeIn(layer: Layer, rect: Rect): Pt | null {
    const points = layer.points
    for (let i = 0; i < 40; i++) {
      const x = rect.x + rnd() * rect.w
      const y = rect.y + rnd() * rect.h
      if (!points || insideShape(points, x, y)) return { x, y }
    }
    for (let i = 0; i < 20; i++)
      for (let j = 0; j < 20; j++) {
        const x = rect.x + ((i + 0.5) / 20) * rect.w
        const y = rect.y + ((j + 0.5) / 20) * rect.h
        if (points && insideShape(points, x, y)) return { x, y }
      }
    return null
  }

  /** Whether (`x`, `y`) is a place the layer's specks may be: anywhere for a layer with no shape. */
  function allowed(layer: Layer, x: number, y: number): boolean {
    return !layer.points || insideShape(layer.points, x, y)
  }

  /** How much of itself a speck at (`x`, `y`) shows: it fades out over a margin as it nears the line of the layer's shape. */
  function fadeAt(layer: Layer, x: number, y: number): number {
    const points = layer.points
    const rect = layer.rect
    if (!points || !rect) return 1
    if (!insideShape(points, x, y)) return 0
    const margin = Math.min(60 * unit(), 0.25 * Math.min(rect.w, rect.h))
    return margin > 0 ? Math.min(1, distanceToLine(points, x, y) / margin) : 1
  }

  /** How much of itself a mist puff of radius `r` centred at (`x`, `y`) shows: it is gone before its flat top or bottom, or its sides, reach the line, so the line never cuts one. */
  function fadeOfPuff(layer: Layer, x: number, y: number, r: number): number {
    return Math.min(
      fadeAt(layer, x, y),
      fadeAt(layer, x, y - 0.2 * r),
      fadeAt(layer, x, y + 0.2 * r),
      fadeAt(layer, x - 0.5 * r, y),
      fadeAt(layer, x + 0.5 * r, y),
    )
  }

  function rectOf(spec: MotionSpec): Rect | null {
    if (!spec.box) return { x: 0, y: 0, w: width, h: height }
    return boxRect(spec.box, { width, height }, picture)
  }

  /** What tells one layer from another: its kind, box, mark, drawn shape and settings, so a shape that moves is laid anew. */
  function keyOf(spec: MotionSpec): string {
    const b = spec.box
    const at = b ? `@${b.x},${b.y},${b.width},${b.height}` : ''
    const mark = b?.mark ? `^${b.mark.x},${b.mark.y}` : ''
    const shape = spec.polygon
      ? `~${spec.polygon.map((p) => `${p.x},${p.y}`).join(';')}`
      : ''
    const set = spec.settings ? `#${JSON.stringify(spec.settings)}` : ''
    return `${spec.kind}${at}${mark}${shape}${set}`
  }

  /** Seed the specks that are always there (dust, fireflies, mist). */
  function seed(layer: Layer): void {
    layer.parts = []
    const rect = layer.rect
    if (!rect) return
    const area = areaOf(layer)
    const u = unit()
    const kind = layer.spec.kind
    const amount = settingValue(kind, layer.spec.settings, 'amount')
    const speed = settingValue(kind, layer.spec.settings, 'speed')
    switch (kind) {
      case 'dust':
        for (let i = 0; i < floatCount(16, area, amount); i++) {
          const at = placeIn(layer, rect)
          if (!at) break
          layer.parts.push({
            x: at.x,
            y: at.y,
            vx: (0.04 + rnd() * 0.15) * u * speed,
            vy: (-0.03 - rnd() * 0.08) * u * speed,
            r: (0.8 + rnd() * 1.8) * u,
            l: 0,
            m: 0,
            ph: rnd() * 6,
          })
        }
        break
      case 'fireflies':
        for (let i = 0; i < floatCount(9, area, amount); i++) {
          const at = layer.points
            ? placeIn(layer, rect)
            : {
                x: rect.x + rect.w * (0.1 + rnd() * 0.8),
                y: rect.y + rect.h * (0.5 + rnd() * 0.4),
              }
          if (!at) break
          layer.parts.push({
            x: at.x,
            y: at.y,
            vx: 0,
            vy: 0,
            r: 12 * u,
            l: 0,
            m: 0,
            ph: rnd() * 6,
          })
        }
        break
      case 'mist': {
        const count = floatCount(6, area, amount)
        for (let i = 0; i < count; i++) {
          // In a drawn shape the puffs lie in rows spread over the whole of it.
          const y = layer.points
            ? rect.y + rect.h * (0.1 + (0.8 * (i + 0.5)) / count)
            : rect.y + rect.h * (0.6 + (0.3 * i) / count)
          const span = layer.points ? spanAcross(layer.points, 'row', y) : null
          const lost = layer.points && !span ? placeIn(layer, rect) : null
          if (layer.points && !span && !lost) break
          layer.parts.push({
            x: span
              ? span.min + rnd() * (span.max - span.min)
              : lost
                ? lost.x
                : rect.x + rnd() * rect.w,
            y: lost ? lost.y : y,
            vx: (0.12 + rnd() * 0.14) * u * speed,
            vy: 0,
            // A puff in a drawn shape is no wider than the shape, nor higher.
            r: Math.min(
              (260 + rnd() * 200) * u,
              layer.points ? Math.min(rect.w / 2, rect.h) : Infinity,
            ),
            l: 0,
            m: 0,
            ph: 0,
          })
        }
        break
      }
      case 'glints':
        for (let i = 0; i < floatCount(70, area, amount); i++)
          layer.parts.push({
            x: rect.x + rnd() * rect.w,
            y: rect.y + rnd() * rect.h,
            vx: 0,
            vy: 0,
            r: (6 + rnd() * 18) * k(),
            l: 0,
            m: 500 + rnd() * 900,
            ph: rnd() * 7,
          })
        break
      case 'stars':
        for (let i = 0; i < floatCount(90, area, amount); i++)
          layer.parts.push({
            x: rect.x + rnd() * rect.w,
            y: rect.y + rnd() * rect.h,
            vx: 0,
            vy: 0,
            r: (0.8 + rnd() * 1.4) * k(),
            l: 0,
            m: 700 + rnd() * 1500,
            ph: rnd() * 7,
          })
        break
      case 'clouds': {
        const clouds = amount > 0 ? Math.max(1, Math.round(5 * amount)) : 0
        for (let c = 0; c < clouds; c++) {
          const cx = rect.x + ((c + rnd()) / clouds) * rect.w
          const cy = rect.y + rnd() * rect.h
          const v = (0.1 + rnd() * 0.1) * k() * speed
          const base = 0.1 + rnd() * 0.08
          for (let b = 0; b < 8; b++)
            layer.parts.push({
              x: cx + rnd() * 380 * k(),
              y: cy + (rnd() - 0.5) * 50 * k(),
              vx: v,
              vy: 0,
              r: (50 + rnd() * 70) * k(),
              l: c,
              m: 0,
              ph: base,
            })
        }
        break
      }
      default:
    }
  }

  function makeLayer(spec: MotionSpec, instant: boolean): Layer {
    const layer: Layer = {
      key: keyOf(spec),
      spec,
      rect: rectOf(spec),
      points: pointsOf(spec),
      alpha: instant ? 1 : 0,
      target: 1,
      parts: [],
      ticks: 0,
      warm: instant,
    }
    lay(layer)
    return layer
  }

  /** Seed a layer, and run it ahead if it is meant to be under way. */
  function lay(layer: Layer): void {
    layer.ticks = 0
    seed(layer)
    if (layer.warm)
      for (let i = 0; i < WARM_TICKS; i++) tick(layer, i * TICK_MS)
  }

  /** Advance one layer by one tick at time `t`; spawn what comes and goes, move what is live. */
  function tick(layer: Layer, t: number): void {
    const rect = layer.rect
    layer.ticks++
    if (!rect) return
    const u = unit()
    const parts = layer.parts
    const n = layer.ticks
    const kind = layer.spec.kind
    const amount = settingValue(kind, layer.spec.settings, 'amount')
    const speed = settingValue(kind, layer.spec.settings, 'speed')
    switch (kind) {
      case 'dust':
        for (const p of parts) {
          p.x += p.vx + Math.sin(t / 1500 + p.ph) * 0.1 * u * speed
          p.y += p.vy
          if (layer.points) {
            comeBackIn(layer, rect, p)
            continue
          }
          if (p.x > rect.x + rect.w + 10) p.x = rect.x - 10
          if (p.y < rect.y - 10) p.y = rect.y + rect.h + 10
        }
        break
      case 'fireflies':
        for (const p of parts) {
          const x = p.x
          const y = p.y
          p.x +=
            Math.sin(t / 900 + p.ph) *
            (0.5 + 0.5 * Math.sin(p.ph * 3)) *
            u *
            speed
          p.y += Math.cos(t / 1200 + p.ph * 2) * 0.4 * u * speed
          // A firefly drifts back inside rather than crossing the line.
          if (!allowed(layer, p.x, p.y)) {
            p.x = x
            p.y = y
          }
        }
        break
      case 'mist':
        for (const p of parts) {
          p.x += p.vx
          if (layer.points) {
            comeBackIn(layer, rect, p)
            continue
          }
          if (p.x - p.r > rect.x + rect.w) p.x = rect.x - p.r
        }
        break
      case 'leaves': {
        const area = areaOf(layer)
        const baseCap = area < 0.5 * BASE_WIDTH * BASE_HEIGHT ? 1 : 2
        const cap = amount > 0 ? Math.max(1, Math.round(baseCap * amount)) : 0
        // A shape is a share of the canvas, so it holds that share of the leaves, but never fewer than one every half minute.
        const chance = layer.points
          ? Math.max(
              leafChance(width * height) * (area / (width * height)),
              LEAF_FLOOR,
            )
          : leafChance(area)
        if (parts.length < cap && rnd() < chance * amount) {
          const loose = layer.points ? placeIn(layer, rect) : null
          const top = loose
            ? spanAcross(layer.points ?? [], 'column', loose.x)
            : null
          if (!layer.points || top)
            parts.push({
              // A leaf comes loose along the top of the shape.
              x: loose ? loose.x : rect.x + rnd() * rect.w,
              y: top ? top.min + 1 : rect.y,
              vx: 0,
              vy: (0.5 + rnd() * 0.3) * u * speed,
              r: u,
              l: 0,
              m: 0,
              ph: rnd() * 6,
            })
        }
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i]
          p.y += p.vy
          const sway = Math.sin(t / 500 + p.ph) * 0.9 * u * speed
          if (allowed(layer, p.x + sway, p.y)) p.x += sway
          p.l += 0.03
          const bottom = layer.points
            ? (spanAcross(layer.points, 'column', p.x)?.max ?? -Infinity)
            : rect.y + rect.h
          if (p.y > bottom) parts.splice(i, 1)
        }
        break
      }
      case 'embers':
        if (
          due(
            n,
            Math.min(
              layer.points ? EMBER_CEILING : Infinity,
              Math.round(24 / (areaOf(layer) / (BASE_WIDTH * BASE_HEIGHT))),
            ),
            amount,
          )
        )
          spawnEmber(layer, rect, u, speed)
        emberStep(layer, t, speed)
        break
      case 'clouds':
        for (const p of parts) {
          p.x += p.vx
          if (p.x - p.r > rect.x + rect.w) p.x -= rect.w + 500 * k()
        }
        break
      case 'fire':
      case 'moonglow':
      case 'ripples':
      case 'glints':
      case 'stars':
        break
      case 'smoke':
        if (due(n - 1, 22, amount))
          parts.push({
            x: rect.x + rect.w * (0.3 + rnd() * 0.4),
            y: rect.y + rect.h * 0.9,
            vx: 0,
            vy: -0.55 * u * speed,
            r: Math.min(18 * u, rect.w / 2),
            l: 0,
            m: 0,
            ph: rnd() * 6,
          })
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i]
          p.y += p.vy
          p.x += Math.sin(t / 900 + p.ph) * 0.3 * u * speed
          p.r += 0.13 * u
          p.l += 0.0009
          if (p.l >= 0.26 || p.y < rect.y - 40) parts.splice(i, 1)
        }
        break
      case 'water': {
        const side = rnd() < 0.5 ? -1 : 1
        if (due(n, 2, amount))
          parts.push({
            x: rect.x + rect.w * (0.5 + side * rnd() * 0.3),
            y: rect.y + rect.h * 0.1,
            vx: side * (0.2 + rnd() * 0.5) * u * speed,
            vy: (0.6 + rnd() * 0.4) * u * speed,
            r: u,
            l: 0,
            m: 80,
            ph: 0,
          })
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i]
          p.vy += 0.12 * u * speed
          p.x += p.vx
          p.y += p.vy
          p.l++
          if (p.y > rect.y + rect.h * 0.85 || p.l > p.m) parts.splice(i, 1)
        }
        break
      }
      default:
    }
  }

  /** A dust speck or mist puff that has left the shape's line comes back in on its far side: across the row, or from the bottom of the column. */
  function comeBackIn(layer: Layer, rect: Rect, p: Particle): void {
    const points = layer.points
    if (!points || insideShape(points, p.x, p.y)) return
    const row = spanAcross(points, 'row', p.y)
    if (row && p.x > row.max) p.x = row.min + 1
    else if (row && p.x < row.min) p.x = row.max - 1
    else {
      const column = spanAcross(points, 'column', p.x)
      if (column && p.y < column.min) p.y = column.max - 1
      else if (column && p.y > column.max) p.y = column.min + 1
    }
    if (!insideShape(points, p.x, p.y)) {
      const at = placeIn(layer, rect)
      if (at) {
        p.x = at.x
        p.y = at.y
      }
    }
  }

  /** Light one ember: in a drawn shape it rises from the bottom of its column and burns out before the shape's top. */
  function spawnEmber(
    layer: Layer,
    rect: Rect,
    u: number,
    speed: number,
  ): void {
    const parts = layer.parts
    if (!layer.points) {
      parts.push({
        x: rect.x + rnd() * rect.w,
        y: rect.y + rect.h * (0.7 + rnd() * 0.25),
        vx: (rnd() - 0.5) * 0.25 * u * speed,
        vy: (-0.7 - rnd() * 0.6) * u * speed,
        r: 1.8 * u,
        l: 0,
        m: 120 + rnd() * 130,
        ph: rnd() * 6,
      })
      return
    }
    const rise = placeIn(layer, rect)
    const column = rise ? spanAcross(layer.points, 'column', rise.x) : null
    if (!rise || !column) return
    const y = column.min + (column.max - column.min) * (0.7 + rnd() * 0.25)
    const vy = (-0.7 - rnd() * 0.6) * u * speed
    const life = 120 + rnd() * 130
    parts.push({
      x: rise.x,
      y,
      vx: (rnd() - 0.5) * 0.25 * u * speed,
      vy,
      r: 1.8 * u,
      l: 0,
      m:
        vy < 0
          ? Math.max(1, Math.min(life, (0.9 * (y - column.min)) / -vy))
          : life,
      ph: rnd() * 6,
    })
  }

  /** Move the live embers and drop the spent ones. */
  function emberStep(layer: Layer, t: number, speed: number): void {
    const parts = layer.parts
    for (let i = parts.length - 1; i >= 0; i--) {
      const e = parts[i]
      const drift = e.vx + Math.sin(t / 300 + e.ph) * 0.25 * speed
      if (allowed(layer, e.x + drift, e.y + e.vy)) e.x += drift
      e.y += e.vy
      e.l++
      if (e.l > e.m) parts.splice(i, 1)
    }
  }

  let clock = 0
  let carry = 0

  /** Set the alpha a speck at (`x`, `y`) is drawn with: the layer's, and for a drawn shape fading out towards its line. */
  function fade(
    c: CanvasRenderingContext2D,
    layer: Layer,
    x: number,
    y: number,
  ): void {
    if (layer.points) c.globalAlpha = layer.alpha * fadeAt(layer, x, y)
  }

  function drawLayer(c: CanvasRenderingContext2D, layer: Layer): void {
    const rect = layer.rect
    if (!rect) return
    const t = clock
    const u = unit()
    const kind = layer.spec.kind
    const speed = settingValue(kind, layer.spec.settings, 'speed')
    c.save()
    c.globalAlpha = layer.alpha
    // Smoke drifts and spreads past its spot, so only the other spots are held to their shape.
    if (layer.spec.polygon && kind !== 'smoke') {
      c.beginPath()
      layer.spec.polygon.forEach((point, i) => {
        const at = pointPosition(point, { width, height }, picture)
        if (i === 0) c.moveTo(at.x, at.y)
        else c.lineTo(at.x, at.y)
      })
      c.closePath()
      c.clip()
    }
    switch (kind) {
      case 'dust':
        for (const p of layer.parts) {
          fade(c, layer, p.x, p.y)
          const tw = Math.max(0, 0.5 + 0.25 * Math.sin(t / 600 + p.ph))
          c.fillStyle = `rgba(255,246,214,${tw})`
          c.strokeStyle = `rgba(120,90,40,${tw * 0.35})`
          c.lineWidth = 0.6
          c.beginPath()
          c.arc(p.x, p.y, p.r + 0.6, 0, 7)
          c.fill()
          c.stroke()
        }
        break
      case 'fireflies':
        for (const p of layer.parts) {
          fade(c, layer, p.x, p.y)
          const a = Math.max(0, Math.sin(t / 700 + p.ph))
          const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r)
          g.addColorStop(0, `rgba(230,255,130,${a})`)
          g.addColorStop(1, 'rgba(220,255,110,0)')
          c.fillStyle = g
          c.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2)
        }
        break
      case 'mist':
        for (const p of layer.parts) {
          if (layer.points)
            c.globalAlpha = layer.alpha * fadeOfPuff(layer, p.x, p.y, p.r)
          const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r)
          g.addColorStop(0, 'rgba(240,244,240,.22)')
          g.addColorStop(1, 'rgba(240,244,240,0)')
          c.save()
          c.translate(0, p.y * 0.8)
          c.scale(1, 0.2)
          c.translate(0, -p.y * 0.8)
          c.fillStyle = g
          c.beginPath()
          c.arc(p.x, p.y, p.r, 0, 7)
          c.fill()
          c.restore()
        }
        break
      case 'leaves':
        for (const p of layer.parts) {
          fade(c, layer, p.x, p.y)
          c.save()
          c.translate(p.x, p.y)
          c.rotate(Math.sin(p.l) * 1.2)
          c.fillStyle = 'rgba(120,150,70,.85)'
          c.beginPath()
          c.ellipse(0, 0, 6 * u, 3 * u, 0, 0, 7)
          c.fill()
          c.restore()
        }
        break
      case 'embers':
        for (const e of layer.parts) {
          fade(c, layer, e.x, e.y)
          const k = 1 - e.l / e.m
          c.fillStyle = `rgba(255,${120 + Math.round(70 * k)},40,${0.95 * k})`
          c.beginPath()
          c.arc(e.x, e.y, e.r, 0, 7)
          c.fill()
        }
        break
      case 'fire': {
        const glow = settingValue('fire', layer.spec.settings, 'glow')
        const amount = settingValue('fire', layer.spec.settings, 'amount')
        const flicker =
          0.2 +
          0.09 * Math.sin((t * speed) / 130) +
          0.06 * Math.sin((t * speed) / 57)
        const a = flicker * glow
        const cx = rect.x + rect.w / 2
        const cy = rect.y + rect.h * 0.6
        const radius = (Math.max(rect.w, rect.h) / 2) * amount
        const g = c.createRadialGradient(cx, cy, 6 * u, cx, cy, radius)
        g.addColorStop(0, `rgba(255,170,60,${a + 0.16 * glow})`)
        g.addColorStop(1, 'rgba(255,150,40,0)')
        c.fillStyle = g
        c.fillRect(rect.x, rect.y, rect.w, rect.h)
        break
      }
      case 'smoke':
        for (const p of layer.parts) {
          const a = 0.26 - p.l
          const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r)
          g.addColorStop(0, `rgba(235,235,232,${a})`)
          g.addColorStop(1, 'rgba(235,235,232,0)')
          c.fillStyle = g
          c.beginPath()
          c.arc(p.x, p.y, p.r, 0, 7)
          c.fill()
        }
        break
      case 'water': {
        c.beginPath()
        c.rect(rect.x, rect.y, rect.w, rect.h)
        c.clip()
        c.fillStyle = 'rgba(225,245,255,.85)'
        for (const d of layer.parts) c.fillRect(d.x, d.y, 2 * u, 3 * u)
        for (let i = 0; i < 2; i++) {
          const k = ((t * speed) / 2200 + i / 2) % 1
          c.strokeStyle = `rgba(230,250,255,${0.6 * (1 - k)})`
          c.lineWidth = 1.8 * u
          c.beginPath()
          c.ellipse(
            rect.x + rect.w / 2,
            rect.y + rect.h * 0.88,
            (rect.w / 6) * (0.4 + k * 1.6),
            (rect.h / 20) * (0.4 + k * 2),
            0,
            0,
            7,
          )
          c.stroke()
        }
        break
      }
      case 'glints': {
        const light = lightOf(layer)
        for (const g of layer.parts) {
          const a = Math.pow(Math.max(0, Math.sin((t * speed) / g.m + g.ph)), 4)
          if (a < 0.02) continue
          const near = 1 - Math.min(1, Math.abs(g.x - light.x) / (400 * k()))
          c.fillStyle = `rgba(255,250,222,${a * (0.35 + 0.55 * near)})`
          c.fillRect(g.x - g.r / 2, g.y, g.r, 1.6 * k())
        }
        const spread = ((t * speed) / 5200) % 1
        const origin =
          layer.parts[
            Math.floor((t * speed) / 5200) % Math.max(1, layer.parts.length)
          ]
        if (origin) {
          c.strokeStyle = `rgba(255,250,222,${0.5 * (1 - spread)})`
          c.lineWidth = 1.4 * k()
          c.beginPath()
          c.ellipse(
            origin.x,
            origin.y,
            60 * k() * spread,
            14 * k() * spread,
            0,
            0,
            7,
          )
          c.stroke()
        }
        break
      }
      case 'stars':
        for (const p of layer.parts) {
          const a = 0.3 + 0.7 * Math.max(0, Math.sin((t * speed) / p.m + p.ph))
          c.fillStyle = `rgba(255,248,230,${a})`
          c.beginPath()
          c.arc(p.x, p.y, p.r, 0, 7)
          c.fill()
        }
        break
      case 'clouds': {
        const light = lightOf(layer)
        for (const p of layer.parts) {
          const lit = Math.max(
            0,
            1 - Math.hypot(p.x - light.x, p.y - light.y) / (360 * k()),
          )
          const a = p.ph + lit * 0.12
          const tone = Math.round(170 + lit * 70)
          const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r)
          g.addColorStop(0, `rgba(${tone},${tone + 6},${tone + 18},${a})`)
          g.addColorStop(1, `rgba(${tone},${tone + 6},${tone + 18},0)`)
          c.fillStyle = g
          c.beginPath()
          c.arc(p.x, p.y, p.r, 0, 7)
          c.fill()
        }
        break
      }
      case 'moonglow': {
        const amount = settingValue('moonglow', layer.spec.settings, 'amount')
        const glow = settingValue('moonglow', layer.spec.settings, 'glow')
        if (amount <= 0) break
        // A mark outside the drawn shape would leave the glow cut off at its edge, so the glow
        // then shines from the middle of the shape's rectangle instead; when that middle lies
        // outside the shape too (a hollow shape), no glow is drawn.
        const mark = lightOf(layer)
        const light =
          edgeDistance(mark, layer) > 0
            ? mark
            : { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 }
        const a = (0.2 + 0.08 * Math.sin((t * speed) / 1800)) * glow
        // The fade ends just inside the nearest drawn edge, so no amount lights the shape evenly.
        const radius = Math.min(
          (Math.max(rect.w, rect.h) / 2) * amount,
          GLOW_REACH * edgeDistance(light, layer),
        )
        if (radius <= 0) break
        const g = c.createRadialGradient(
          light.x,
          light.y,
          Math.min(4 * k(), radius / 2),
          light.x,
          light.y,
          radius,
        )
        g.addColorStop(0, `rgba(235,240,255,${a})`)
        g.addColorStop(1, 'rgba(235,240,255,0)')
        c.globalCompositeOperation = 'lighter'
        c.fillStyle = g
        c.fillRect(rect.x, rect.y, rect.w, rect.h)
        break
      }
      case 'ripples': {
        if (!source) break
        const amount = settingValue('ripples', layer.spec.settings, 'amount')
        if (amount <= 0) break
        const strength = settingValue(
          'ripples',
          layer.spec.settings,
          'strength',
        )
        const drawnW = picture.width * cover()
        const drawnH = picture.height * cover()
        const left = (width - drawnW) / 2
        const top = (height - drawnH) / 2
        const step = 2
        for (let y = rect.y; y < rect.y + rect.h; y += step) {
          const depth = (y - rect.y) / rect.h
          const wave =
            Math.sin(y * 0.11 * amount - (t * speed) / 650) *
              (0.6 + depth * 3.2) +
            Math.sin(y * 0.031 * amount + (t * speed) / 1700) *
              (0.4 + depth * 1.5)
          const sy = ((y - top) / drawnH) * source.height
          c.drawImage(
            source.image,
            0,
            sy,
            source.width,
            (step / drawnH) * source.height,
            left + wave * strength * k(),
            y,
            drawnW,
            step + 0.2,
          )
        }
        break
      }
      default:
    }
    c.restore()
  }

  return {
    setSource(next) {
      source = next
    },
    resize(w, h, pic) {
      if (
        w === width &&
        h === height &&
        pic.width === picture.width &&
        pic.height === picture.height
      )
        return
      width = w
      height = h
      picture = pic
      for (const layer of layers) {
        layer.rect = rectOf(layer.spec)
        layer.points = pointsOf(layer.spec)
        lay(layer)
      }
    },
    setEffects(specs, instant) {
      const wanted = new Map(specs.map((s) => [keyOf(s), s]))
      for (const layer of layers) {
        layer.target = wanted.has(layer.key) ? 1 : 0
        wanted.delete(layer.key)
      }
      // A layer that is leaving and wanted again is called back, not doubled.
      if (instant) layers = layers.filter((l) => l.target === 1)
      for (const spec of wanted.values()) layers.push(makeLayer(spec, instant))
    },
    step(ms) {
      clock += ms
      carry += ms
      const ticks = Math.min(6, Math.floor(carry / TICK_MS))
      carry = ticks === 6 ? 0 : carry - ticks * TICK_MS
      for (const layer of layers)
        for (let i = 0; i < ticks; i++) tick(layer, clock)
      for (const layer of layers) {
        const move = ms / FADE_MS
        layer.alpha =
          layer.target === 1
            ? Math.min(1, layer.alpha + move)
            : Math.max(0, layer.alpha - move)
      }
      layers = layers.filter((l) => l.target === 1 || l.alpha > 0)
    },
    draw(ctx) {
      ctx.clearRect(0, 0, width, height)
      for (const layer of layers) if (layer.alpha > 0) drawLayer(ctx, layer)
    },
    isEmpty() {
      return layers.length === 0
    },
    count(kind) {
      return layers
        .filter((l) => l.spec.kind === kind)
        .reduce((sum, l) => sum + l.parts.length, 0)
    },
  }
}
