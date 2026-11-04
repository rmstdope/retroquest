/**
 * The scenes the game declares for Content Studio's Scenes workspace
 * (`tts/act<N>/scenes.json`, written by `tts/extract-act.ts`): one per room,
 * under the room's music track id, with the room's sound states and the
 * triggers the game can fire in it. What each scene plays is the mix the
 * studio writes (`sceneMix.ts`).
 */
import type { Act } from '@/engine'
import { roomTrackId } from './musicLists'

/** The name the scenes give a room's default sound state where the game calls it ''. */
export const PLAIN_SOUND_STATE = 'plain'

/** One scene as the declarations list it. */
export interface SceneDeclaration {
  /** The room's music track id; unique across the game. */
  id: string
  /** What the studio calls it: the room's name. */
  name: string
  /** The scene's named sound states, the default first; none when it always sounds the same. */
  states: string[]
  /** The names the game can fire in the scene; none yet. */
  triggers: string[]
}

/** A room's sound state as the scenes name it: '' is `PLAIN_SOUND_STATE`. */
export function sceneStateOf(state: string): string {
  return state === '' ? PLAIN_SOUND_STATE : state
}

/** One scene for each room of `act`, in the act's order. */
export function actScenes(act: Act): SceneDeclaration[] {
  return Object.entries(act.rooms).map(([key, room]) => ({
    id: roomTrackId(act.name, key),
    name: room.name,
    states: room.soundStates().map(sceneStateOf),
    triggers: [],
  }))
}
