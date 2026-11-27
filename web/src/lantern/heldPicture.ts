/**
 * The room picture while a turn's gained things are still to leave it: the
 * things a turn took (or was given, or bought) from the room stay painted, with
 * their own patches as they were, until their name flies. `withHeldAreas`
 * lays the engine's latest picture over the one shown before the turn, leaving
 * the held areas as they were. Nothing here is saved.
 */
import type { PictureState } from './pictureState'

/**
 * The picture to show: `latest`, except that the things in `held` areas (and
 * the patches that belong to those areas) stay as `before` showed them. A
 * different room or picture is shown as `latest` is: a turn that also changes
 * the picture lets its things go with it (the change of scene is the moment).
 */
export function withHeldAreas(
  latest: PictureState,
  before: PictureState,
  held: readonly string[],
): PictureState {
  if (
    held.length === 0 ||
    latest.roomKey !== before.roomKey ||
    latest.variant !== before.variant
  )
    return latest
  const areas = { ...before.patchAreas, ...latest.patchAreas }
  const isHeld = (patch: string): boolean => held.includes(areas[patch] ?? '')
  // A held area's patch that the turn switched on is not shown yet.
  const patchIds = latest.patchIds.filter(
    (patch) => !isHeld(patch) || before.patchIds.includes(patch),
  )
  // One the turn switched off stays, where it was laid.
  before.patchIds.forEach((patch, at) => {
    if (isHeld(patch) && !latest.patchIds.includes(patch))
      patchIds.splice(Math.min(at, patchIds.length), 0, patch)
  })
  const here = new Set(latest.things.map((thing) => thing.areaId))
  const kept = before.things.filter(
    (thing) => held.includes(thing.areaId) && !here.has(thing.areaId),
  )
  return {
    ...latest,
    patchIds,
    patchAreas: areas,
    things: [...latest.things, ...kept],
  }
}
