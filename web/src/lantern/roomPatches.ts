/**
 * The patches of a room's picture: the small changes the picture needs as the
 * story moves on (a thing taken, a character gone, a way opened), each with an
 * id, a title and the words for the edit. A patch about one thing links to that
 * thing's named area (`roomAreas.ts`), so the navigator need not mark the spot
 * twice. A change that alters the whole view is another picture, not a patch;
 * the Village Chapel's candle-lit, whose light covers almost the whole picture,
 * is the agreed exception. Patches that are on together are laid by their
 * `layer`, a higher one over a lower; declaration order means nothing. The
 * declared lists live in `roomPatches/act<N>RoomPatches.ts`; a patch not made
 * yet is not a defect. The base picture shows the room as the game starts: a
 * thing there at the start has a taken or gone patch, a thing or a way that
 * only turns up later an appears or open patch, unless the change needs no
 * patch of its own (the area's `unpatched` reason). A thing that changes state
 * (a candle lit, a well purified) has a patch of its own;
 * `roomStateChanges.test.ts` holds the golden-path changes against the
 * patches, or the reason one needs none. Sir Cedric, who follows the player
 * through a whole act, has none.
 */
import type { ImagePatch } from '@/engine'

/** A patch as Content Studio's list holds it: its id, title, words and area, without the rule. */
export type ListedPatch = Omit<ImagePatch, 'when' | 'layer'>

/** The Content Studio list form of `patch`. */
export function listedPatch(patch: ImagePatch): ListedPatch {
  return {
    id: patch.id,
    title: patch.title,
    text: patch.text,
    ...(patch.area !== undefined ? { area: patch.area } : {}),
  }
}
