/**
 * The sound effects the navigator chose in Content Studio. The studio writes
 * each chosen take to `public/audio/soundeffects/generated/` with a
 * `manifest.json` of `{ effectId: { file, duration } }`. A scene plays the
 * effects its mix lists (see `sceneMix.ts`); one with no chosen take is
 * silent.
 */
import type { SceneEntry } from '@/lantern/sceneMix'
import type { AmbientClipSource } from './ambience'
import { loadChosenManifest, type ChosenManifest } from './chosenMusic'

/** Where the studio's chosen effect takes live, as a URL path. */
const GENERATED_EFFECTS_PATH = '/audio/soundeffects/generated/'

/** Fetches the manifest of chosen effect takes; one that cannot be read means none were made. */
export function loadChosenEffects(): Promise<ChosenManifest> {
  return loadChosenManifest(`${GENERATED_EFFECTS_PATH}manifest.json`)
}

/**
 * The clips that play as the scene of `entry` sounds: each row of its mix
 * with a chosen take, as it plays, in its state and at its level. A row the
 * game fires (a trigger) is among them, waiting for its firing; a scene the
 * mix has no entry for has none.
 */
export function sceneClips(
  entry: SceneEntry | undefined,
  effects: ChosenManifest,
): AmbientClipSource[] {
  return (entry?.effects ?? []).flatMap(({ id, play, state, level }) => {
    const take = Object.hasOwn(effects, id) ? effects[id] : undefined
    if (!take) return []
    const url = GENERATED_EFFECTS_PATH + take.file
    return [
      state === undefined
        ? { url, play, volume: level }
        : { url, play, state, volume: level },
    ]
  })
}
