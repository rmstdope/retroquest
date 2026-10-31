/**
 * The music the navigator chose in Content Studio. The studio writes each chosen
 * take to `public/audio/music/generated/` with a `manifest.json` of
 * `{ trackId: { file, duration } }`; the game plays a room's take in that room,
 * the act loop's take across the act, and its own file where no take was made.
 */
import { actLoopId, roomTrackId } from '@/lantern/musicLists'

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

/** How long the game waits for the manifest before playing its own files, in ms. */
const MANIFEST_TIMEOUT_MS = 3000

/** Fetches the manifest of chosen takes; a missing, unreadable, malformed or slow one means none were made. */
export async function loadChosenManifest(): Promise<ChosenManifest> {
  try {
    const response = await fetch(
      `/audio/music/${GENERATED_MUSIC_DIR}manifest.json`,
      { signal: AbortSignal.timeout(MANIFEST_TIMEOUT_MS) },
    )
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
