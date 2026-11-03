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

/**
 * The clips that play with the music file `file`: the chosen effects of the
 * track whose chosen take it is, each with how it plays. None for the game's
 * own files, which are no room's take.
 */
export function ambientClipsFor(
  file: string,
  music: ChosenManifest,
  effects: ChosenManifest,
): AmbientClipSource[] {
  const track = Object.keys(music).find(
    (id) => GENERATED_MUSIC_DIR + music[id].file === file,
  )
  if (track === undefined) return []
  return ambienceAt(track).flatMap(({ id, ...play }) => {
    const take = effects[id]
    return take ? [{ url: GENERATED_EFFECTS_PATH + take.file, ...play }] : []
  })
}
