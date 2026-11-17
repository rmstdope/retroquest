/**
 * The gentle movement laid over a room's painting: what floats anywhere over
 * the picture (dust, leaves, embers, fireflies, low mist; each plays inside the
 * shapes drawn for it, else in its default placement) and what lives on a
 * drawn spot only (water, fire, smoke). The game declares none of it: the
 * navigator tunes each image's effects in Content Studio, and they reach the
 * game in the images manifest, under the image's `effects`, exactly as the
 * studio exports them: each with its `kind` (one the renderer has,
 * `motionRenderer.ts`), its `settings` (numbers by setting id; a missing one
 * plays at its default), an optional tie to the story through one of the
 * image's patch ids (`patch` applies while that patch is laid, `unlessPatch`
 * while it is not), the `spot` the navigator drew (one or more
 * shapes, each a list of `[x, y]` corners in picture fractions) and an
 * optional `mark` (`[x, y]`, where its light comes from). A spot kind plays
 * once in each of its shapes; a floating kind with no drawn shape plays in its
 * default placement, a spot kind with none has no movement, and the rest of
 * the room moves all the same. Nothing is saved.
 */
import { effectType } from './motionEffects'

/** What floats over the whole picture and needs no marking. */
export type FloatKind = 'dust' | 'leaves' | 'embers' | 'fireflies' | 'mist'
/** What lives on a spot the navigator marks. */
export type SpotKind =
  | 'water'
  | 'fire'
  | 'smoke'
  | 'ripples'
  | 'glints'
  | 'clouds'
  | 'stars'
  | 'moonglow'
/** Any kind of movement. */
export type MotionKind = FloatKind | SpotKind

/** The kinds that need a marked spot. */
export const SPOT_KINDS: readonly SpotKind[] = [
  'water',
  'fire',
  'smoke',
  'ripples',
  'glints',
  'clouds',
  'stars',
  'moonglow',
]

/** A box on a picture: fractions of the picture, as the studio writes them. */
export interface AreaBox {
  x: number
  y: number
  width: number
  height: number
  /** Where the studio put the thing's mark, as fractions of the picture; absent means the middle of the box. */
  mark?: { x: number; y: number }
}

/** A point on a picture, as fractions of it. */
export interface PicturePoint {
  x: number
  y: number
}

/** One shape the navigator drew for a spot: its corners in order, as fractions of the picture. */
export type SpotShape = PicturePoint[]

/** One movement of an image, as the manifest lists it. */
export interface RoomEffect {
  kind: MotionKind
  /** The settings the navigator tuned, by setting id; missing ones play at their default. */
  settings?: Record<string, number>
  /** A patch id of the same image: the effect applies while that patch is laid (the studio's `patch`). */
  whilePatch?: string
  /** A patch id of the same image: the effect applies while that patch is not laid. */
  unlessPatch?: string
  /** The shapes drawn for a spot kind; it plays once in each. */
  spot?: SpotShape[]
  /** Where a spot's light comes from, as fractions of the picture; absent means the middle of each shape. */
  mark?: PicturePoint
}

/** A movement that applies now: a spot kind carries its drawn shape and the box around it. */
export interface MotionSpec {
  kind: MotionKind
  settings?: Record<string, number>
  box?: AreaBox
  polygon?: PicturePoint[]
}

/** Whether `kind` lives on a drawn spot. */
export function isSpotKind(kind: MotionKind): kind is SpotKind {
  return (SPOT_KINDS as readonly string[]).includes(kind)
}

/** Whether `value` is a box wholly inside the picture, with some size. */
function isBox(value: unknown): value is AreaBox {
  if (typeof value !== 'object' || value === null) return false
  const { x, y, width, height } = value as Record<string, unknown>
  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    typeof width !== 'number' ||
    typeof height !== 'number'
  ) {
    return false
  }
  return (
    x >= 0 &&
    y >= 0 &&
    width > 0 &&
    height > 0 &&
    x + width <= 1 &&
    y + height <= 1
  )
}

/** The mark point of `value` (a fraction pair inside the picture), or undefined when it is missing or broken. */
function madeMark(value: unknown): AreaBox['mark'] {
  if (typeof value !== 'object' || value === null) return undefined
  const { x, y } = value as Record<string, unknown>
  if (typeof x !== 'number' || typeof y !== 'number') return undefined
  if (!(x >= 0 && x <= 1 && y >= 0 && y <= 1)) return undefined
  return { x, y }
}

/**
 * The boxes the images manifest lists under image `imageId`, by area id.
 * Tolerant of anything: a manifest that is not an object, an image with no
 * `areas` key (none placed) or a box that is not wholly inside the picture
 * is left out.
 */
export function madeAreaBoxes(
  manifest: unknown,
  imageId: string,
): Record<string, AreaBox> {
  if (typeof manifest !== 'object' || manifest === null) return {}
  const image: unknown = (manifest as Record<string, unknown>)[imageId]
  if (typeof image !== 'object' || image === null) return {}
  const areas: unknown = (image as Record<string, unknown>).areas
  if (typeof areas !== 'object' || areas === null) return {}
  const boxes: Record<string, AreaBox> = {}
  for (const [id, box] of Object.entries(areas)) {
    if (!isBox(box)) continue
    const { x, y, width, height } = box
    const mark = madeMark((box as { mark?: unknown }).mark)
    boxes[id] = mark ? { x, y, width, height, mark } : { x, y, width, height }
  }
  return boxes
}

/** The point of an `[x, y]` pair of picture fractions, or undefined when it is not one inside the picture. */
function madePoint(value: unknown): PicturePoint | undefined {
  if (!Array.isArray(value) || value.length !== 2) return undefined
  const [x, y]: unknown[] = value
  if (typeof x !== 'number' || typeof y !== 'number') return undefined
  if (!(x >= 0 && x <= 1 && y >= 0 && y <= 1)) return undefined
  return { x, y }
}

/** The box around `points`; null when it has no size. */
function boundingBox(points: readonly PicturePoint[]): AreaBox | null {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  const width = Math.round((Math.max(...xs) - x) * 1e6) / 1e6
  const height = Math.round((Math.max(...ys) - y) * 1e6) / 1e6
  return width > 0 && height > 0 ? { x, y, width, height } : null
}

/** One drawn shape: at least three corners, all inside the picture, enclosing some area. */
function madeShape(value: unknown): SpotShape | undefined {
  if (!Array.isArray(value) || value.length < 3) return undefined
  const points: PicturePoint[] = []
  for (const corner of value as unknown[]) {
    const point = madePoint(corner)
    if (!point) return undefined
    points.push(point)
  }
  return boundingBox(points) && area(points) > 0 ? points : undefined
}

/** The area a closed shape encloses (the shoelace formula), in squared picture fractions. */
function area(points: readonly PicturePoint[]): number {
  let twice = 0
  points.forEach((p, i) => {
    const next = points[(i + 1) % points.length]
    twice += p.x * next.y - next.x * p.y
  })
  return Math.abs(twice) / 2
}

/** The shapes of a spot that are shapes; undefined when none is. */
function madeSpot(value: unknown): SpotShape[] | undefined {
  if (!Array.isArray(value)) return undefined
  const shapes = (value as unknown[])
    .map(madeShape)
    .filter((shape): shape is SpotShape => shape !== undefined)
  return shapes.length > 0 ? shapes : undefined
}

/** The settings of `value` that are finite numbers. */
function madeSettings(value: unknown): Record<string, number> | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const kept: Record<string, number> = {}
  for (const [id, v] of Object.entries(value))
    if (typeof v === 'number' && Number.isFinite(v)) kept[id] = v
  return Object.keys(kept).length > 0 ? kept : undefined
}

/**
 * One effect as Content Studio exports it (`{ kind, settings, patch?,
 * unlessPatch?, spot?, mark? }`); null for one that is broken or of a kind
 * the renderer does not have. What is broken inside it (a setting that is not
 * a number, a shape that is not one inside the picture, a mark outside it) is
 * left out.
 */
export function madeEffect(value: unknown): RoomEffect | null {
  if (typeof value !== 'object' || value === null) return null
  const raw = value as Record<string, unknown>
  if (typeof raw.kind !== 'string' || !effectType(raw.kind)) return null
  const effect: RoomEffect = { kind: raw.kind as MotionKind }
  const settings = madeSettings(raw.settings)
  if (settings) effect.settings = settings
  if (typeof raw.patch === 'string') effect.whilePatch = raw.patch
  if (typeof raw.unlessPatch === 'string') effect.unlessPatch = raw.unlessPatch
  const spot = madeSpot(raw.spot)
  if (spot) effect.spot = spot
  const mark = madePoint(raw.mark)
  if (mark) effect.mark = mark
  return effect
}

/**
 * The effects the images manifest lists under image `imageId`. Tolerant of
 * anything: a manifest that is not an object, an image with no `effects` and
 * a broken effect are left out (`madeEffect`).
 */
export function madeEffects(manifest: unknown, imageId: string): RoomEffect[] {
  if (typeof manifest !== 'object' || manifest === null) return []
  const image: unknown = (manifest as Record<string, unknown>)[imageId]
  if (typeof image !== 'object' || image === null) return []
  const listed: unknown = (image as Record<string, unknown>).effects
  if (!Array.isArray(listed)) return []
  return (listed as unknown[])
    .map(madeEffect)
    .filter((effect): effect is RoomEffect => effect !== null)
}

/** Whether `point` lies in `box` (its edges included). */
function inBox(point: PicturePoint, box: AreaBox): boolean {
  return (
    point.x >= box.x &&
    point.x <= box.x + box.width &&
    point.y >= box.y &&
    point.y <= box.y + box.height
  )
}

/**
 * What one effect plays, whatever the story: once in each drawn shape with
 * the shape and the box around it (the mark on the box of a shape that holds
 * it); a floating kind with no drawn shape as it is, over its default
 * placement; and a spot kind with no drawn shape not at all.
 */
export function effectSpecs(effect: RoomEffect): MotionSpec[] {
  const base: MotionSpec = { kind: effect.kind }
  if (effect.settings) base.settings = effect.settings
  if (!isSpotKind(effect.kind) && !effect.spot) return [base]
  const specs: MotionSpec[] = []
  for (const shape of effect.spot ?? []) {
    const box = boundingBox(shape)
    if (!box) continue
    const mark = effect.mark && inBox(effect.mark, box) ? effect.mark : null
    specs.push({ ...base, box: mark ? { ...box, mark } : box, polygon: shape })
  }
  return specs
}

/**
 * The movement that applies to the story as it stands: what the effects
 * whose patch condition holds play (`patchIds` are the patches laid now; see
 * `effectSpecs`).
 */
export function appliedMotion(
  effects: readonly RoomEffect[],
  patchIds: readonly string[],
): MotionSpec[] {
  return effects
    .filter(
      (effect) =>
        (!effect.whilePatch || patchIds.includes(effect.whilePatch)) &&
        (!effect.unlessPatch || !patchIds.includes(effect.unlessPatch)),
    )
    .flatMap(effectSpecs)
}

/** How an image's picture drifts: seconds each way, and how far it moves in, in percent. */
export interface ImageZoom {
  seconds: number
  percent: number
}

/** What the title picture drifts at until the team saves a zoom for it. */
export const DEFAULT_TITLE_ZOOM: ImageZoom = { seconds: 16, percent: 3 }

/**
 * The zoom the images manifest saves under image `imageId` (`zoom`: seconds
 * each way and percent in), clamped to 4 to 60 seconds and 0 to 10 percent;
 * `DEFAULT_TITLE_ZOOM` when it saves none or one that is not a pair of
 * numbers; null (no zoom) when it saves `null` or `false`, or a zoom with no
 * seconds or no size.
 */
export function madeZoom(manifest: unknown, imageId: string): ImageZoom | null {
  if (typeof manifest !== 'object' || manifest === null)
    return DEFAULT_TITLE_ZOOM
  const image: unknown = (manifest as Record<string, unknown>)[imageId]
  if (typeof image !== 'object' || image === null) return DEFAULT_TITLE_ZOOM
  const zoom: unknown = (image as Record<string, unknown>).zoom
  if (zoom === null || zoom === false) return null
  if (typeof zoom !== 'object') return DEFAULT_TITLE_ZOOM
  const { seconds, percent } = zoom as Record<string, unknown>
  if (
    typeof seconds !== 'number' ||
    typeof percent !== 'number' ||
    !Number.isFinite(seconds) ||
    !Number.isFinite(percent)
  )
    return DEFAULT_TITLE_ZOOM
  if (seconds <= 0 || percent <= 0) return null
  return {
    seconds: Math.min(60, Math.max(4, seconds)),
    percent: Math.min(10, percent),
  }
}
