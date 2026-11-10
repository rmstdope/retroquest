/**
 * The gentle movement laid over a room's painting: what floats anywhere over
 * the picture (dust, leaves, embers, fireflies, low mist) and what lives on a
 * marked spot only (water, fire, smoke). The game never knows where on a
 * painting anything is: a spot is a named area (`motion-water`, `motion-fire`,
 * `motion-smoke`) the navigator places in Content Studio like the area of any
 * clickable thing, and its placed box reaches the game in the images manifest
 * as a fraction of the picture. A spot not placed yet simply has no movement,
 * and the rest of the room moves all the same. The declared lists live in
 * `roomMotion/act<N>RoomMotion.ts`, one entry for each room that has a
 * painting; an entry may be empty, the painting then only drifts. An effect may
 * be tied to the story through one of the room's patch ids (`whilePatch`
 * applies while that patch is laid, `unlessPatch` while it is not), so the
 * movement follows what the picture itself shows. Nothing is saved.
 */
import type { ImageArea } from './roomAreas'
import { ACT1_ROOM_MOTION } from './roomMotion/act1RoomMotion'
import { ACT2_ROOM_MOTION } from './roomMotion/act2RoomMotion'

/** What floats over the whole picture and needs no marking. */
export type FloatKind = 'dust' | 'leaves' | 'embers' | 'fireflies' | 'mist'
/** What lives on a spot the navigator marks. */
export type SpotKind = 'water' | 'fire' | 'smoke'
/** Any kind of movement. */
export type MotionKind = FloatKind | SpotKind

/** The kinds that need a marked spot. */
export const SPOT_KINDS: readonly SpotKind[] = ['water', 'fire', 'smoke']

/** A box on a picture: fractions of the picture, as the studio writes them. */
export interface AreaBox {
  x: number
  y: number
  width: number
  height: number
  /** Where the studio put the thing's mark, as fractions of the picture; absent means the middle of the box. */
  mark?: { x: number; y: number }
}

/** One declared movement of a room. */
export interface RoomEffect {
  kind: MotionKind
  /** A patch id of the same room: the effect applies while that patch is laid. */
  whilePatch?: string
  /** A patch id of the same room: the effect applies while that patch is not laid. */
  unlessPatch?: string
}

/** A movement that applies now: a spot kind carries its placed box. */
export interface MotionSpec {
  kind: MotionKind
  box?: AreaBox
}

/** The declared movement of each painted room of each act, by act name then room key. */
const ROOM_MOTION: Readonly<
  Record<string, Readonly<Record<string, readonly RoomEffect[]>>>
> = {
  Act1: ACT1_ROOM_MOTION,
  Act2: ACT2_ROOM_MOTION,
}

/** The movement declared for room `roomKey` of act `actName`; none for a room without a declaration. */
export function declaredMotion(
  actName: string,
  roomKey: string,
): readonly RoomEffect[] {
  return ROOM_MOTION[actName]?.[roomKey] ?? []
}

/** Whether `kind` lives on a marked spot. */
export function isSpotKind(kind: MotionKind): kind is SpotKind {
  return (SPOT_KINDS as readonly string[]).includes(kind)
}

/** The named area the navigator places for a spot kind: `motion-water`, `motion-fire` or `motion-smoke`. */
export function spotAreaId(kind: SpotKind): string {
  return `motion-${kind}`
}

/** What the studio calls each kind of spot. */
const SPOT_TITLES: Readonly<Record<SpotKind, string>> = {
  water: 'Running water',
  fire: 'Fire',
  smoke: 'Smoke',
}

/** The named areas to ask the studio for: one for each kind of spot the room uses, once. */
export function spotAreas(actName: string, roomKey: string): ImageArea[] {
  const kinds = new Set<SpotKind>()
  for (const effect of declaredMotion(actName, roomKey)) {
    if (isSpotKind(effect.kind)) kinds.add(effect.kind)
  }
  return SPOT_KINDS.filter((kind) => kinds.has(kind)).map((kind) => ({
    id: spotAreaId(kind),
    title: SPOT_TITLES[kind],
  }))
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

/**
 * The movement that applies to the story as it stands: the declared effects
 * whose patch condition holds (`patchIds` are the patches laid now), the
 * spot kinds with their placed box (a spot with none is left out).
 */
export function appliedMotion(
  effects: readonly RoomEffect[],
  patchIds: readonly string[],
  boxes: Readonly<Record<string, AreaBox>>,
): MotionSpec[] {
  const specs: MotionSpec[] = []
  for (const effect of effects) {
    if (effect.whilePatch && !patchIds.includes(effect.whilePatch)) continue
    if (effect.unlessPatch && patchIds.includes(effect.unlessPatch)) continue
    if (!isSpotKind(effect.kind)) {
      specs.push({ kind: effect.kind })
      continue
    }
    const box = boxes[spotAreaId(effect.kind)]
    if (box) specs.push({ kind: effect.kind, box })
  }
  return specs
}
