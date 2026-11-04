/**
 * The music the navigator chose in Content Studio. The studio writes each chosen
 * take to `public/audio/music/generated/` with a `manifest.json` of
 * `{ trackId: { file, duration } }`; the game plays a room's take in that room,
 * the act loop's take across the act, and its own file where no take was made.
 */
import { actLoopId, roomTrackId } from '@/lantern/musicLists'
import type { SceneEntry } from '@/lantern/sceneMix'

/** Where the studio's chosen takes live, below the game's music directory. */
export const GENERATED_MUSIC_DIR = 'generated/'

/** One chosen take: its file name inside the generated folder and its length in seconds. */
export interface ChosenTake {
  file: string
  duration: number
}

/** The chosen takes by track id (`{}` when none was made). */
export type ChosenManifest = Record<string, ChosenTake>

/** The track ids that may play where the player is, most specific first: the room's, then the act loop's. */
export function trackIdsAt(
  place: { actName: string; roomKey: string },
  musicFile: string,
): string[] {
  if (place.actName === '' || musicFile === '') return []
  const loop = actLoopId(musicFile)
  return place.roomKey === ''
    ? [loop]
    : [roomTrackId(place.actName, place.roomKey), loop]
}

/** The take of the first of `ids` that has one, or null when none has. */
export function chooseTrack(
  manifest: ChosenManifest,
  ids: string[],
): ChosenTake | null {
  for (const id of ids) {
    const take = manifest[id]
    if (take) return take
  }
  return null
}

/** What a scene plays where no chosen take does: the act's own music file. */
export const ACT_FILE = 'act-file'

/** A scene's music: a chosen take, the act's own file (`ACT_FILE`) or none (null), at the mix's level. */
export interface SceneMusicChoice {
  /** What plays. */
  music: ChosenTake | typeof ACT_FILE | null
  /** The music's level, 0 to 3, 1 as chosen. */
  level: number
}

/**
 * The music of a scene at `place`. Where its mix entry gives no music, what
 * the game chooses (the room's take, else the act loop's, else the act's own
 * file) at 1; else the track the mix names at its level, and no music for no
 * track or for one with no chosen take.
 */
export function sceneMusic(
  place: { actName: string; roomKey: string },
  musicFile: string,
  manifest: ChosenManifest,
  entry: SceneEntry | undefined,
): SceneMusicChoice {
  const mixed = entry?.music
  if (!mixed)
    return {
      music: chooseTrack(manifest, trackIdsAt(place, musicFile)) ?? ACT_FILE,
      level: 1,
    }
  const { track, level } = mixed
  const take =
    track !== null && Object.hasOwn(manifest, track) ? manifest[track] : null
  return { music: take, level }
}

/** How long the game waits for the manifest before playing its own files, in ms. */
const MANIFEST_TIMEOUT_MS = 3000

/**
 * Fetches the manifest of chosen takes (the music's, unless `url` names
 * another); a missing, unreadable, malformed or slow one means none were made.
 */
export async function loadChosenManifest(
  url: string = `/audio/music/${GENERATED_MUSIC_DIR}manifest.json`,
): Promise<ChosenManifest> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(MANIFEST_TIMEOUT_MS),
    })
    if (response.ok) {
      const manifest: unknown = await response.json()
      if (typeof manifest === 'object' && manifest !== null)
        return manifest as ChosenManifest
    }
  } catch {
    // No takes chosen: the game plays its own files.
  }
  return {}
}
