/**
 * The volume each room gives its sound effects. The saved volumes live in
 * `effectVolumes.json` beside this file, `{ track: { effectId: volume } }`,
 * where 1 plays a clip as made, more raises it and less lowers it; an effect
 * a room does not name plays at 1. The game plays by the saved file; in the
 * dev build the room effects panel changes it (through the Vite plugin in
 * `effectVolumes.config.ts`), so the levels carry over to the next run.
 */
import saved from './effectVolumes.json'
import {
  isEffectVolumes,
  MAX_EFFECT_VOLUME,
  type EffectVolumes,
} from './effectVolumesShape'

export {
  EFFECT_VOLUMES_URL,
  isEffectVolumes,
  MAX_EFFECT_VOLUME,
  type EffectVolumes,
} from './effectVolumesShape'

/** The step volumes are kept to: 5 %. */
const VOLUME_STEP = 0.05

/** The volumes saved in `effectVolumes.json`; none when the file is not well formed. */
export const SAVED_EFFECT_VOLUMES: EffectVolumes = isEffectVolumes(saved)
  ? saved
  : {}

/** The volume of effect `id` in `track`'s room: as set, else 1. */
export function volumeOf(
  volumes: EffectVolumes,
  track: string,
  id: string,
): number {
  const effects = Object.hasOwn(volumes, track) ? volumes[track] : undefined
  return effects && Object.hasOwn(effects, id) ? effects[id] : 1
}

/**
 * The volumes with effect `id` of `track` set to `volume`, kept between 0
 * and `MAX_EFFECT_VOLUME` to the nearest 5 %. A volume of 1 is left out, and
 * a room with none left goes too, so the file names only what was changed.
 */
export function withVolume(
  volumes: EffectVolumes,
  track: string,
  id: string,
  volume: number,
): EffectVolumes {
  const kept =
    Math.round(Math.min(MAX_EFFECT_VOLUME, Math.max(0, volume)) / VOLUME_STEP) *
    VOLUME_STEP
  const rounded = Math.round(kept * 100) / 100
  const effects = { ...(volumes[track] ?? {}) }
  if (rounded === 1) delete effects[id]
  else effects[id] = rounded
  const next = { ...volumes }
  if (Object.keys(effects).length === 0) delete next[track]
  else next[track] = effects
  return next
}
