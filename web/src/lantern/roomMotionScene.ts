/**
 * The simulation and drawing of the movement over a room's painting. It knows
 * nothing of the page: it is told the size of the canvas and of the picture
 * (so a box, which is a fraction of the picture, lands where the picture's
 * trimmed fit puts it), the movement that applies (`setEffects`), and then
 * stepped and drawn. Everything is gentle: a few slow specks, at most a couple
 * of leaves at a time, a quiet trickle. The amount follows the size of what is
 * seen, so a small picture is no more crowded than a large one. A layer that
 * stops applying fades out over about a second and a new one fades in; a room
 * entered fresh is run ahead first, so it is already under way.
 */
import type { AreaBox, MotionKind, MotionSpec } from './roomMotion'

/** The size the amounts of the drawing are for. */
const BASE_WIDTH = 1280
const BASE_HEIGHT = 720
/** A tick of the simulation, in milliseconds (60 frames a second). */
const TICK_MS = 1000 / 60
/** Ticks a fresh room is run ahead. */
const WARM_TICKS = 600
/** How long a layer takes to fade in or out. */
const FADE_MS = 1000

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
  alpha: number
  target: 0 | 1
  parts: Particle[]
  ticks: number
  /** Whether it was run ahead when it started, and so is again when it is laid anew. */
  warm: boolean
}

/** What a scene is driven through. */
export interface MotionScene {
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
function floatCount(base: number, area: number): number {
  return Math.max(1, Math.round((base * area) / (BASE_WIDTH * BASE_HEIGHT)))
}

/**
 * The chance a new leaf starts to fall on a tick. One leaf is a bigger share of
 * a small picture than of a large one, so the chance falls faster than the area
 * does, and a small picture has no more leaves for its size.
 */
function leafChance(rect: Rect): number {
  const share = (rect.w * rect.h) / (BASE_WIDTH * BASE_HEIGHT)
  return 0.005 * Math.min(1, share * share)
}

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

  /** Sizes and speeds shrink a little with the canvas, never below 60% nor above the drawing's. */
  function unit(): number {
    return Math.min(1, Math.max(0.6, width / BASE_WIDTH))
  }

  function rectOf(spec: MotionSpec): Rect | null {
    if (!spec.box) return { x: 0, y: 0, w: width, h: height }
    return boxRect(spec.box, { width, height }, picture)
  }

  function keyOf(spec: MotionSpec): string {
    const b = spec.box
    return b ? `${spec.kind}@${b.x},${b.y},${b.width},${b.height}` : spec.kind
  }

  /** Seed the specks that are always there (dust, fireflies, mist). */
  function seed(layer: Layer): void {
    layer.parts = []
    const rect = layer.rect
    if (!rect) return
    const area = rect.w * rect.h
    const u = unit()
    switch (layer.spec.kind) {
      case 'dust':
        for (let i = 0; i < floatCount(16, area); i++)
          layer.parts.push({
            x: rect.x + rnd() * rect.w,
            y: rect.y + rnd() * rect.h,
            vx: (0.04 + rnd() * 0.15) * u,
            vy: (-0.03 - rnd() * 0.08) * u,
            r: (0.8 + rnd() * 1.8) * u,
            l: 0,
            m: 0,
            ph: rnd() * 6,
          })
        break
      case 'fireflies':
        for (let i = 0; i < floatCount(9, area); i++)
          layer.parts.push({
            x: rect.x + rect.w * (0.1 + rnd() * 0.8),
            y: rect.y + rect.h * (0.5 + rnd() * 0.4),
            vx: 0,
            vy: 0,
            r: 12 * u,
            l: 0,
            m: 0,
            ph: rnd() * 6,
          })
        break
      case 'mist': {
        const count = floatCount(6, area)
        for (let i = 0; i < count; i++)
          layer.parts.push({
            x: rect.x + rnd() * rect.w,
            y: rect.y + rect.h * (0.6 + (0.3 * i) / count),
            vx: (0.12 + rnd() * 0.14) * u,
            vy: 0,
            r: (260 + rnd() * 200) * u,
            l: 0,
            m: 0,
            ph: 0,
          })
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
    switch (layer.spec.kind) {
      case 'dust':
        for (const p of parts) {
          p.x += p.vx + Math.sin(t / 1500 + p.ph) * 0.1 * u
          p.y += p.vy
          if (p.x > rect.x + rect.w + 10) p.x = rect.x - 10
          if (p.y < rect.y - 10) p.y = rect.y + rect.h + 10
        }
        break
      case 'fireflies':
        for (const p of parts) {
          p.x += Math.sin(t / 900 + p.ph) * (0.5 + 0.5 * Math.sin(p.ph * 3)) * u
          p.y += Math.cos(t / 1200 + p.ph * 2) * 0.4 * u
        }
        break
      case 'mist':
        for (const p of parts) {
          p.x += p.vx
          if (p.x - p.r > rect.x + rect.w) p.x = rect.x - p.r
        }
        break
      case 'leaves': {
        const cap = rect.w * rect.h < 0.5 * BASE_WIDTH * BASE_HEIGHT ? 1 : 2
        if (parts.length < cap && rnd() < leafChance(rect))
          parts.push({
            x: rect.x + rnd() * rect.w,
            y: rect.y,
            vx: 0,
            vy: (0.5 + rnd() * 0.3) * u,
            r: u,
            l: 0,
            m: 0,
            ph: rnd() * 6,
          })
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i]
          p.y += p.vy
          p.x += Math.sin(t / 500 + p.ph) * 0.9 * u
          p.l += 0.03
          if (p.y > rect.y + rect.h) parts.splice(i, 1)
        }
        break
      }
      case 'embers':
        if (
          n %
            Math.round(
              24 / ((rect.w * rect.h) / (BASE_WIDTH * BASE_HEIGHT)),
            ) ===
          0
        )
          parts.push({
            x: rect.x + rnd() * rect.w,
            y: rect.y + rect.h * (0.7 + rnd() * 0.25),
            vx: (rnd() - 0.5) * 0.25 * u,
            vy: (-0.7 - rnd() * 0.6) * u,
            r: 1.8 * u,
            l: 0,
            m: 120 + rnd() * 130,
            ph: rnd() * 6,
          })
        emberStep(parts, t)
        break
      case 'fire':
        break
      case 'smoke':
        if (n % 22 === 1)
          parts.push({
            x: rect.x + rect.w * (0.3 + rnd() * 0.4),
            y: rect.y + rect.h * 0.9,
            vx: 0,
            vy: -0.55 * u,
            r: Math.min(18 * u, rect.w / 2),
            l: 0,
            m: 0,
            ph: rnd() * 6,
          })
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i]
          p.y += p.vy
          p.x += Math.sin(t / 900 + p.ph) * 0.3 * u
          p.r += 0.13 * u
          p.l += 0.0009
          if (p.l >= 0.26 || p.y < rect.y - 40) parts.splice(i, 1)
        }
        break
      case 'water': {
        const side = rnd() < 0.5 ? -1 : 1
        if (n % 2 === 0)
          parts.push({
            x: rect.x + rect.w * (0.5 + side * rnd() * 0.3),
            y: rect.y + rect.h * 0.1,
            vx: side * (0.2 + rnd() * 0.5) * u,
            vy: (0.6 + rnd() * 0.4) * u,
            r: u,
            l: 0,
            m: 80,
            ph: 0,
          })
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i]
          p.vy += 0.12 * u
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

  /** Move the live embers and drop the spent ones. */
  function emberStep(parts: Particle[], t: number): void {
    for (let i = parts.length - 1; i >= 0; i--) {
      const e = parts[i]
      e.x += e.vx + Math.sin(t / 300 + e.ph) * 0.25
      e.y += e.vy
      e.l++
      if (e.l > e.m) parts.splice(i, 1)
    }
  }

  let clock = 0
  let carry = 0

  function drawLayer(c: CanvasRenderingContext2D, layer: Layer): void {
    const rect = layer.rect
    if (!rect) return
    const t = clock
    const u = unit()
    c.save()
    c.globalAlpha = layer.alpha
    switch (layer.spec.kind) {
      case 'dust':
        for (const p of layer.parts) {
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
          const k = 1 - e.l / e.m
          c.fillStyle = `rgba(255,${120 + Math.round(70 * k)},40,${0.95 * k})`
          c.beginPath()
          c.arc(e.x, e.y, e.r, 0, 7)
          c.fill()
        }
        break
      case 'fire': {
        const a = 0.2 + 0.09 * Math.sin(t / 130) + 0.06 * Math.sin(t / 57)
        const cx = rect.x + rect.w / 2
        const cy = rect.y + rect.h * 0.6
        const radius = Math.max(rect.w, rect.h) / 2
        const g = c.createRadialGradient(cx, cy, 6 * u, cx, cy, radius)
        g.addColorStop(0, `rgba(255,170,60,${a + 0.16})`)
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
          const k = (t / 2200 + i / 2) % 1
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
      default:
    }
    c.restore()
  }

  return {
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
