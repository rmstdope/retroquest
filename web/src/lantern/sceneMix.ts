/**
 * The scene mix Content Studio writes (`scenes/act<N>.mix.json`, one per act,
 * the `scenes.paths.mix` of `content-studio.json`): for each scene the
 * declarations list (`sceneLists.ts`), its music and level and the effects that
 * play in it, how, in which state and how loud. The game reads the mix scene
 * by scene: an entry with a problem is left out, so that scene plays as if it
 * had none (its own track, no effects), and the others play. A mix file that
 * is not there is an empty mix.
 */

/** The highest level of a scene's music or an effect: three times the clip as made. */
export const MAX_SCENE_LEVEL = 3

/** How an effect plays in its scene. */
export type ScenePlay =
  | { mode: 'loop' }
  | {
      mode: 'random'
      /** The wait before each start, in seconds: a random time between the two, the first 0 or more and no longer than the second. */
      everySeconds: readonly [number, number]
    }
  | {
      mode: 'once'
      /** The wait after entering before the one time it plays, in seconds. */
      afterSeconds: number
    }
  | {
      mode: 'trigger'
      /** The name the game fires to play it. */
      trigger: string
    }

/** One row of a scene's effects: a clip, how it plays, when and how loud. */
export interface MixEffect {
  /** The clip's id in the game's effects list. */
  id: string
  /** How it plays. */
  play: ScenePlay
  /** The scene's state it plays in; absent for one that always plays. */
  state?: string
  /** Its level, 0 to `MAX_SCENE_LEVEL`, 1 being the clip as made. */
  level: number
}

/** A scene's music: the track it plays (null for none) and its level. */
export interface SceneMusic {
  /** The id of the music track; null for no music. */
  track: string | null
  /** The music's level, 0 to `MAX_SCENE_LEVEL`, 1 as chosen. */
  level: number
}

/** One scene of the mix. */
export interface SceneEntry {
  /** Its music; absent for what the game chooses, at level 1. */
  music?: SceneMusic
  /** Its effects, in the table's order; none when the mix gives none. */
  effects: MixEffect[]
}

/** The mix: each scene's entry by its id. */
export type SceneMix = Readonly<Record<string, SceneEntry>>

/** True for a plain object (not an array or null). */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** The level `value` reads as, or undefined when it is not one. */
function levelOf(value: unknown): number | undefined {
  return typeof value === 'number' && value >= 0 && value <= MAX_SCENE_LEVEL
    ? value
    : undefined
}

/** The way of playing `value` reads as, or undefined when it is not one. */
function playOf(value: unknown): ScenePlay | undefined {
  if (!isRecord(value)) return undefined
  switch (value.mode) {
    case 'loop':
      return { mode: 'loop' }
    case 'random': {
      const every = value.everySeconds
      if (
        Array.isArray(every) &&
        every.length === 2 &&
        typeof every[0] === 'number' &&
        typeof every[1] === 'number' &&
        every[0] >= 0 &&
        every[0] <= every[1]
      )
        return { mode: 'random', everySeconds: [every[0], every[1]] }
      return undefined
    }
    case 'once':
      return typeof value.afterSeconds === 'number' && value.afterSeconds >= 0
        ? { mode: 'once', afterSeconds: value.afterSeconds }
        : undefined
    case 'trigger':
      return typeof value.trigger === 'string'
        ? { mode: 'trigger', trigger: value.trigger }
        : undefined
    default:
      return undefined
  }
}

/** The effect row `value` reads as, or undefined when it has a problem. */
function effectOf(value: unknown): MixEffect | undefined {
  if (!isRecord(value) || typeof value.id !== 'string') return undefined
  const play = playOf(value.play)
  const level = levelOf(value.level)
  if (play === undefined || level === undefined) return undefined
  if (value.state === undefined) return { id: value.id, play, level }
  return typeof value.state === 'string'
    ? { id: value.id, play, state: value.state, level }
    : undefined
}

/** The scene entry `value` reads as, or undefined when it has a problem. */
function entryOf(value: unknown): SceneEntry | undefined {
  if (!isRecord(value)) return undefined
  const effects: MixEffect[] = []
  if (value.effects !== undefined) {
    if (!Array.isArray(value.effects)) return undefined
    for (const row of value.effects) {
      const effect = effectOf(row)
      if (effect === undefined) return undefined
      effects.push(effect)
    }
  }
  if (value.music === undefined) return { effects }
  const music = value.music
  if (!isRecord(music)) return undefined
  const level = levelOf(music.level)
  if (level === undefined) return undefined
  if (music.track !== null && typeof music.track !== 'string') return undefined
  return { music: { track: music.track, level }, effects }
}

/** Reads a mix file's contents scene by scene, leaving out each entry with a problem. */
export function readSceneMix(raw: unknown): Record<string, SceneEntry> {
  const mix: Record<string, SceneEntry> = {}
  if (!isRecord(raw) || !isRecord(raw.scenes)) return mix
  for (const [id, value] of Object.entries(raw.scenes)) {
    const entry = entryOf(value)
    if (entry !== undefined) mix[id] = entry
  }
  return mix
}

/** The game's mix: every act's committed mix file, read and merged. */
export const SCENE_MIX: SceneMix = Object.assign(
  {},
  ...Object.values(
    import.meta.glob<unknown>('./scenes/*.mix.json', {
      eager: true,
      import: 'default',
    }),
  ).map(readSceneMix),
)

/** The entry of scene `id` in `mix`; undefined for a scene it has none for. */
export function sceneMixOf(
  id: string,
  mix: SceneMix = SCENE_MIX,
): SceneEntry | undefined {
  return Object.hasOwn(mix, id) ? mix[id] : undefined
}
