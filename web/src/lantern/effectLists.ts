/**
 * The game's sound effects: the list Content Studio's Sound effects workspace
 * reads (`tts/effects.json`, written by `tts/extract-effects.ts`), and where
 * and how the game plays each one. An effect belongs to a room's own music
 * track: it starts when that track starts and fades out with it (see
 * `ambience.ts`). Until the navigator chooses a take in the studio, an effect
 * is silent.
 */

/** A sound effect in Content Studio's list format. */
export interface EffectEntry {
  /** Slug naming the effect's clip; unique across the game. */
  id: string
  /** The game's starting description for the studio's model. */
  description: string
  /** Length in seconds the studio makes it. */
  seconds: number
  /** True for an effect the game plays round and round; absent for one played once. */
  loops?: true
}

/** How an effect plays while its track does: round and round, or once now and then. */
export type EffectPlay =
  | { loops: true }
  | {
      loops: false
      /** The wait from one start to the next, in seconds: a random time between the two. */
      everySeconds: readonly [number, number]
    }

/** A sound effect of the game: what the studio makes and where the game plays it. */
export type GameEffect = Omit<EffectEntry, 'loops'> &
  EffectPlay & {
    /** The music track (`roomTrackId`) the effect plays with. */
    track: string
  }

/** One effect of a track's ambience: its id and how it plays. */
export type AmbientEffect = { id: string } & EffectPlay

/** The track of The Dream (`roomTrackId('Act1', 'TheDream')`). */
const THE_DREAM = 'act1-the-dream'

/** Every sound effect of the game, in the order the studio lists them. */
export const GAME_EFFECTS: readonly GameEffect[] = [
  {
    id: 'rain',
    description:
      'heavy rain beating on wooden shutters in the dark, a steady ' +
      'downpour, no thunder',
    seconds: 20,
    track: THE_DREAM,
    loops: true,
  },
  {
    id: 'lightning',
    description:
      'a lightning strike very close by, a sharp crack of thunder that ' +
      'shakes the air and rolls away into the distance',
    seconds: 5,
    track: THE_DREAM,
    loops: false,
    everySeconds: [3, 8],
  },
]

/** The effects as Content Studio's list: id, description, length and, for a loop, `loops`. */
export function effectsList(): EffectEntry[] {
  return GAME_EFFECTS.map(({ id, description, seconds, loops }) =>
    loops ? { id, description, seconds, loops } : { id, description, seconds },
  )
}

/** The effects that play with `track`, each with how it plays; none for a track without any. */
export function ambienceAt(track: string): AmbientEffect[] {
  return GAME_EFFECTS.filter((effect) => effect.track === track).map(
    (effect) =>
      effect.loops
        ? { id: effect.id, loops: true }
        : { id: effect.id, loops: false, everySeconds: effect.everySeconds },
  )
}
