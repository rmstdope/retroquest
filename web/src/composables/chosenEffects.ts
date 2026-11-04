/**
 * The sound effects the navigator chose in Content Studio. The studio writes
 * each chosen take to `public/audio/soundeffects/generated/` with a
 * `manifest.json` of `{ effectId: { file, duration } }`. An effect plays with
 * its room's own chosen music take (see `effectLists.ts`); one with no chosen
 * take is silent.
 */
import { ambienceAt } from '@/lantern/effectLists'
import type { AmbientClipSource } from './ambience'
import {
  GENERATED_MUSIC_DIR,
  loadChosenManifest,
  type ChosenManifest,
} from './chosenMusic'

/** Where the studio's chosen effect takes live, as a URL path. */
const GENERATED_EFFECTS_PATH = '/audio/soundeffects/generated/'

/** Fetches the manifest of chosen effect takes; one that cannot be read means none were made. */
export function loadChosenEffects(): Promise<ChosenManifest> {
  return loadChosenManifest(`${GENERATED_EFFECTS_PATH}manifest.json`)
}

/** The track whose chosen take the music file `file` is; null for the game's own files. */
export function trackOfTake(
  file: string,
  music: ChosenManifest,
): string | null {
  return (
    Object.keys(music).find(
      (id) => GENERATED_MUSIC_DIR + music[id].file === file,
    ) ?? null
  )
}

/**
 * The clips that play with the music file `file`: the chosen effects of the
 * track whose chosen take it is, each with how it plays and in which sound
 * state. None for the game's own files, which are no room's take.
 */
export function ambientClipsFor(
  file: string,
  music: ChosenManifest,
  effects: ChosenManifest,
): AmbientClipSource[] {
  const track = trackOfTake(file, music)
  return track === null ? [] : ambientClipsAt(track, effects)
}

/** The chosen effects of `track`, each with how it plays and in which sound state; those with no chosen take are left out. */
export function ambientClipsAt(
  track: string,
  effects: ChosenManifest,
): AmbientClipSource[] {
  return ambienceAt(track).flatMap(({ id, ...play }) => {
    const take = effects[id]
    return take
      ? [{ id, url: GENERATED_EFFECTS_PATH + take.file, ...play }]
      : []
  })
}
