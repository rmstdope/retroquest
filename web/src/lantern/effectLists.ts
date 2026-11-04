/**
 * The game's sound effects: the clips Content Studio's Sound effects workspace
 * makes (`tts/effects.json`, written by `tts/extract-effects.ts`), and which
 * rooms play them and how. A clip is made once and may play in several rooms,
 * each at its own pace: round and round, now and then, or once on entering,
 * and some only while the room is in one sound state (see `EffectWhen`).
 * The effects of a room belong to its own music track: they start when that
 * track starts and fade out with it (see `ambience.ts`). Until the navigator
 * chooses a take in the studio, an effect is silent.
 */
import { roomTrackId } from './musicLists'

/** A sound effect in Content Studio's list format. */
export interface EffectEntry {
  /** Slug naming the effect's clip; unique across the game. */
  id: string
  /** The game's starting description for the studio's model. */
  description: string
  /** Length in seconds the studio makes it. */
  seconds: number
  /** True for a clip made to play round and round; absent for a one-shot. */
  loops?: true
}

/** How an effect plays while its track does: round and round, now and then, or once. */
export type EffectPlay =
  | { loops: true }
  | {
      loops: false
      /** The wait from one start to the next, in seconds: a random time between the two. */
      everySeconds: readonly [number, number]
    }
  | {
      loops: false
      /** The wait after the track starts before the one time it plays, in seconds. */
      afterSeconds: number
    }

/**
 * When an effect plays: always, or only while its room is in one sound state
 * (the room's `soundState`, such as a withered field or a lit glade).
 */
export interface EffectWhen {
  /** The room's sound state the effect plays in; absent for an effect that always plays. */
  state?: string
}

/** One effect of a track's ambience: its clip's id, how it plays and when. */
export type AmbientEffect = { id: string } & EffectPlay & EffectWhen

/** Every clip of the game, in the order the studio lists them. */
export const GAME_EFFECTS: readonly EffectEntry[] = [
  {
    id: 'rain',
    description:
      'heavy rain beating on wooden shutters in the dark, a steady ' +
      'downpour, no thunder',
    seconds: 20,
    loops: true,
  },
  {
    id: 'lightning',
    description:
      'a lightning strike very close by, a sharp crack of thunder that ' +
      'shakes the air and rolls away into the distance',
    seconds: 5,
  },
  {
    id: 'hearth-fire',
    description:
      'a small wood fire crackling gently in a cottage hearth, soft pops ' +
      'and hisses, warm and close',
    seconds: 20,
    loops: true,
  },
  {
    id: 'wind-gusts',
    description:
      'wind gusting around an old wooden building, whistling softly ' +
      'through gaps in the boards',
    seconds: 20,
    loops: true,
  },
  {
    id: 'wood-creak',
    description:
      'old wooden boards creaking under strain, a single slow groan ' +
      'of weathered timber',
    seconds: 3,
  },
  {
    id: 'breeze-leaves',
    description:
      'a light breeze rustling through leaves and tall grass in the open ' +
      'countryside, calm, no birds',
    seconds: 20,
    loops: true,
  },
  {
    id: 'crow-caw',
    description:
      'a lone crow cawing twice, somewhere in the distance over open fields',
    seconds: 3,
  },
  {
    id: 'chickens',
    description:
      'a small flock of hens clucking and scratching in straw inside a ' +
      'wooden coop, close by',
    seconds: 20,
    loops: true,
  },
  {
    id: 'hen-squawk',
    description:
      'a startled hen squawking and flapping its wings in a wooden coop',
    seconds: 3,
  },
  {
    id: 'well-drip',
    description:
      'a single drop of water falling into a deep stone well, a small ' +
      'echoing plink',
    seconds: 2,
  },
  {
    id: 'forge-fire',
    description:
      'the low roar of hot coals in a blacksmith forge, a steady draught ' +
      'and crackle, no hammering',
    seconds: 20,
    loops: true,
  },
  {
    id: 'anvil-strike',
    description:
      'a blacksmith hammer ringing on an anvil, three steady blows on hot ' +
      'iron, the metal ringing after',
    seconds: 4,
  },
  {
    id: 'shop-bell',
    description:
      'a small brass bell over a shop door jingling as the door opens and ' +
      'closes',
    seconds: 2,
  },
  {
    id: 'glass-clink',
    description:
      'glass bottles and jars clinking softly as they are moved on a ' +
      'wooden shelf',
    seconds: 2,
  },
  {
    id: 'village-murmur',
    description:
      'a quiet village square, a few hushed voices at market stalls and ' +
      'footsteps on cobblestones, no words can be made out',
    seconds: 20,
    loops: true,
  },
  {
    id: 'fountain',
    description:
      'an old stone fountain trickling and splashing softly into its basin',
    seconds: 20,
    loops: true,
  },
  {
    id: 'birdsong',
    description:
      'songbirds calling and answering in a sunlit wood, near and far, ' +
      'no wind',
    seconds: 20,
    loops: true,
  },
  {
    id: 'twig-snap',
    description:
      'a twig snapping underfoot somewhere in the undergrowth, then a ' +
      'short rustle of leaves',
    seconds: 2,
  },
  {
    id: 'river',
    description:
      'a gentle river flowing slowly past reeds, soft lapping at a muddy ' +
      'bank',
    seconds: 20,
    loops: true,
  },
  {
    id: 'insects-hum',
    description:
      'summer insects humming and buzzing lazily over still water, ' +
      'dragonflies and gnats',
    seconds: 20,
    loops: true,
  },
  {
    id: 'chapel-door',
    description:
      'a heavy wooden chapel door swinging shut with a deep thud that ' +
      'echoes through a stone hall',
    seconds: 3,
  },
  {
    id: 'chapel-hush',
    description:
      'the hush of a cool, empty stone chapel, a faint echo of distant ' +
      'air, very quiet',
    seconds: 20,
    loops: true,
  },
  {
    id: 'horse-snort',
    description:
      'a horse snorting and stamping a hoof on a dirt road, then ' +
      'tearing at grass',
    seconds: 3,
  },
  {
    id: 'cat-purr',
    description:
      'a cat purring contentedly in its sleep, close by, slow and soft',
    seconds: 20,
    loops: true,
  },
  {
    id: 'mechanism-whir',
    description:
      'a small black-iron clockwork mechanism whirring and ticking to ' +
      'itself, steady and faintly wrong',
    seconds: 20,
    loops: true,
  },
  {
    id: 'fox-whimper',
    description:
      'a small fox kit whimpering weakly, tired and frightened, in the ' +
      'undergrowth',
    seconds: 3,
  },
  {
    id: 'glade-hush',
    description:
      'an unnatural, heavy stillness in a dark forest clearing, a faint ' +
      'low hum, no birds, no wind',
    seconds: 20,
    loops: true,
  },
]

/** The track of an Act I room by its key, as `roomTrackId` gives it. */
function act1(roomKey: string): string {
  return roomTrackId('Act1', roomKey)
}

/** The effects of each room's track, by track id: which clip plays and how. */
export const ROOM_AMBIENCE: Readonly<Record<string, readonly AmbientEffect[]>> =
  {
    [act1('TheDream')]: [
      { id: 'rain', loops: true },
      { id: 'lightning', loops: false, everySeconds: [3, 8] },
    ],
    [act1('EliorsCottage')]: [{ id: 'hearth-fire', loops: true }],
    [act1('VegetableField')]: [
      { id: 'breeze-leaves', loops: true },
      {
        id: 'crow-caw',
        loops: false,
        everySeconds: [10, 25],
        state: 'withered',
      },
      { id: 'birdsong', loops: true, state: 'green' },
    ],
    [act1('ChickenCoop')]: [
      { id: 'chickens', loops: true },
      { id: 'hen-squawk', loops: false, everySeconds: [6, 15] },
    ],
    [act1('VillageWell')]: [
      { id: 'well-drip', loops: false, everySeconds: [4, 10] },
    ],
    [act1('BlacksmithsForge')]: [
      { id: 'forge-fire', loops: true },
      { id: 'anvil-strike', loops: false, everySeconds: [4, 9] },
    ],
    [act1('GeneralStore')]: [
      { id: 'shop-bell', loops: false, afterSeconds: 1.5 },
      { id: 'glass-clink', loops: false, everySeconds: [15, 30] },
      { id: 'cat-purr', loops: true, state: 'cat-home' },
    ],
    [act1('VillageSquare')]: [
      { id: 'village-murmur', loops: true },
      { id: 'fountain', loops: true },
    ],
    [act1('MirasHut')]: [
      { id: 'glass-clink', loops: false, everySeconds: [8, 20] },
    ],
    [act1('AbandonedShed')]: [
      { id: 'wind-gusts', loops: true },
      { id: 'wood-creak', loops: false, everySeconds: [6, 14] },
    ],
    [act1('OldMill')]: [
      { id: 'wind-gusts', loops: true },
      { id: 'mechanism-whir', loops: true, state: 'whirring' },
      { id: 'wood-creak', loops: false, everySeconds: [5, 12] },
    ],
    [act1('Riverbank')]: [
      { id: 'river', loops: true },
      { id: 'insects-hum', loops: true },
    ],
    [act1('ForestPath')]: [
      { id: 'birdsong', loops: true },
      { id: 'twig-snap', loops: false, everySeconds: [8, 20] },
      {
        id: 'fox-whimper',
        loops: false,
        everySeconds: [10, 20],
        state: 'kit-trapped',
      },
    ],
    [act1('HiddenGlade')]: [
      { id: 'glade-hush', loops: true, state: 'dim' },
      { id: 'birdsong', loops: true, state: 'lit' },
      { id: 'breeze-leaves', loops: true, state: 'lit' },
    ],
    [act1('VillageChapel')]: [
      { id: 'chapel-door', loops: false, afterSeconds: 1.5 },
      { id: 'chapel-hush', loops: true },
      { id: 'wood-creak', loops: false, everySeconds: [15, 30] },
    ],
    [act1('RoadToGreendale')]: [
      { id: 'birdsong', loops: true },
      { id: 'breeze-leaves', loops: true },
      { id: 'horse-snort', loops: false, everySeconds: [12, 25] },
    ],
  }

/** The clips as Content Studio's list: id, description, length and, for a loop, `loops`. */
export function effectsList(): EffectEntry[] {
  return GAME_EFFECTS.map(({ id, description, seconds, loops }) =>
    loops ? { id, description, seconds, loops } : { id, description, seconds },
  )
}

/** The effects that play with `track`, each with how it plays; none for a track without any. */
export function ambienceAt(track: string): AmbientEffect[] {
  return Object.hasOwn(ROOM_AMBIENCE, track) ? [...ROOM_AMBIENCE[track]] : []
}
