/**
 * The shape of the saved effect volumes (`effectVolumes.json`), and where
 * the dev server takes them. It imports nothing, so the Vite plugin that
 * saves the file can use it without the file joining the config's imports:
 * a change to a file the config imports restarts the dev server, which
 * reloads the game.
 */

/** Where the dev server takes the volumes to save (a PUT of the whole file). */
export const EFFECT_VOLUMES_URL = '/__effect-volumes'

/** Volumes by music track, then by effect id. */
export type EffectVolumes = Record<string, Record<string, number>>

/** The loudest an effect may be set: three times as made. */
export const MAX_EFFECT_VOLUME = 3

/** A track id or effect id: lower-case words joined by hyphens. */
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** Whether `value` is a plain object (not null, not an array). */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Whether `value` has the shape of the saved volumes, every volume in range. */
export function isEffectVolumes(value: unknown): value is EffectVolumes {
  if (!isRecord(value)) return false
  return Object.entries(value).every(
    ([track, effects]) =>
      SLUG.test(track) &&
      isRecord(effects) &&
      Object.entries(effects).every(
        ([id, volume]) =>
          SLUG.test(id) &&
          typeof volume === 'number' &&
          volume >= 0 &&
          volume <= MAX_EFFECT_VOLUME,
      ),
  )
}
