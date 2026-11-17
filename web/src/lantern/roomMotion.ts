/**
 * The gentle movement laid over a room's painting: what floats anywhere over
 * the picture (dust, leaves, embers, fireflies, low mist) and what lives on a
 * drawn spot only (water, fire, smoke). The game declares none of it: the
 * navigator tunes each image's effects in Content Studio, and they reach the
 * game in the images manifest, under the image's `effects`: each with its
 * `type` (one the renderer has, `motionRenderer.ts`), its `settings` (numbers
 * by setting id; a missing one plays at its default), an optional tie to the
 * story through one of the image's patch ids (`whilePatch` applies while that
 * patch is laid, `unlessPatch` while it is not) and, for a spot type, the
 * `spot` the navigator drew: a polygon of picture fractions with an optional
 * `mark`. A spot type with no drawn spot simply has no movement, and the rest
 * of the room moves all the same. Nothing is saved.
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

/** The shape the navigator drew for a spot: a polygon, and where its mark sits. */
export interface SpotShape {
  points: PicturePoint[]
  /** Where the studio put the spot's mark, as fractions of the picture; absent means the middle of the shape. */
  mark?: PicturePoint
}

/** One movement of an image, as the manifest lists it. */
export interface RoomEffect {
  kind: MotionKind
  /** The settings the navigator tuned, by setting id; missing ones play at their default. */
  settings?: Record<string, number>
  /** A patch id of the same image: the effect applies while that patch is laid. */
  whilePatch?: string
  /** A patch id of the same image: the effect applies while that patch is not laid. */
  unlessPatch?: string
  /** The drawn spot of a spot kind. */
  spot?: SpotShape
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

/** Whether `value` is a point inside the picture. */
function isPoint(value: unknown): value is PicturePoint {
  if (typeof value !== 'object' || value === null) return false
  const { x, y } = value as Record<string, unknown>
  return (
    typeof x === 'number' &&
    typeof y === 'number' &&
    x >= 0 &&
    x <= 1 &&
    y >= 0 &&
    y <= 1
  )
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

/** The spot of `value`: at least three points, all inside the picture, around something with a size; the mark only when it is inside the picture. */
function madeSpot(value: unknown): SpotShape | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const { points, mark } = value as Record<string, unknown>
  if (!Array.isArray(points) || points.length < 3) return undefined
  if (!points.every(isPoint) || !boundingBox(points)) return undefined
  const kept = points.map(({ x, y }) => ({ x, y }))
  const markPoint = madeMark(mark)
  return markPoint ? { points: kept, mark: markPoint } : { points: kept }
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
 * The effects the images manifest lists under image `imageId`. Tolerant of
 * anything: a manifest that is not an object, an image with no `effects`, an
 * effect of a type the renderer does not have, settings that are not numbers
 * and a spot that is not a shape wholly inside the picture are left out.
 */
export function madeEffects(manifest: unknown, imageId: string): RoomEffect[] {
  if (typeof manifest !== 'object' || manifest === null) return []
  const image: unknown = (manifest as Record<string, unknown>)[imageId]
  if (typeof image !== 'object' || image === null) return []
  const listed: unknown = (image as Record<string, unknown>).effects
  if (!Array.isArray(listed)) return []
  const effects: RoomEffect[] = []
  for (const item of listed as unknown[]) {
    if (typeof item !== 'object' || item === null) continue
    const raw = item as Record<string, unknown>
    if (typeof raw.type !== 'string' || !effectType(raw.type)) continue
    const effect: RoomEffect = { kind: raw.type as MotionKind }
    const settings = madeSettings(raw.settings)
    if (settings) effect.settings = settings
    if (typeof raw.whilePatch === 'string') effect.whilePatch = raw.whilePatch
    if (typeof raw.unlessPatch === 'string')
      effect.unlessPatch = raw.unlessPatch
    const spot = madeSpot(raw.spot)
    if (spot) effect.spot = spot
    effects.push(effect)
  }
  return effects
}

/**
 * The movement that applies to the story as it stands: the effects whose
 * patch condition holds (`patchIds` are the patches laid now), the spot kinds
 * with their drawn shape and the box around it (a spot with none is left out).
 */
export function appliedMotion(
  effects: readonly RoomEffect[],
  patchIds: readonly string[],
): MotionSpec[] {
  const specs: MotionSpec[] = []
  for (const effect of effects) {
    if (effect.whilePatch && !patchIds.includes(effect.whilePatch)) continue
    if (effect.unlessPatch && patchIds.includes(effect.unlessPatch)) continue
    const spec: MotionSpec = { kind: effect.kind }
    if (effect.settings) spec.settings = effect.settings
    if (isSpotKind(effect.kind)) {
      const box = effect.spot && boundingBox(effect.spot.points)
      if (!effect.spot || !box) continue
      spec.box = effect.spot.mark ? { ...box, mark: effect.spot.mark } : box
      spec.polygon = effect.spot.points
    }
    specs.push(spec)
  }
  return specs
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
