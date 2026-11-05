/**
 * The game's sound effects: the clips Content Studio's Sound effects workspace
 * makes (`tts/effects.json`, written by `tts/extract-effects.ts`). A clip is
 * made once and may play in several scenes; which scenes play it, how and how
 * loud is the studio's scene mix (see `sceneMix.ts`). Until the navigator
 * chooses a take in the studio, an effect is silent. The studio's rewordings
 * of an effect are its own, in `content-studio/effects/edits.json`.
 */
/** A sound effect in Content Studio's list format. */
export interface EffectEntry {
  /** Slug naming the effect's clip; unique across the game. */
  id: string
  /** The game's starting words for the studio's model: what the effect sounds like. */
  text: string
  /** Length in seconds the studio makes it. */
  seconds: number
  /** True for a clip made to play round and round; absent for a one-shot. */
  loops?: true
}

/** Every clip of the game, in the order the studio lists them. */
export const GAME_EFFECTS: readonly EffectEntry[] = [
  {
    id: 'rain',
    text:
      'heavy rain beating on wooden shutters in the dark, a steady ' +
      'downpour, no thunder',
    seconds: 20,
    loops: true,
  },
  {
    id: 'lightning',
    text:
      'a lightning strike very close by, a sharp crack of thunder that ' +
      'shakes the air and rolls away into the distance',
    seconds: 5,
  },
  {
    id: 'hearth-fire',
    text:
      'a small wood fire crackling gently in a cottage hearth, soft pops ' +
      'and hisses, warm and close',
    seconds: 20,
    loops: true,
  },
  {
    id: 'wind-gusts',
    text:
      'wind gusting around an old wooden building, whistling softly ' +
      'through gaps in the boards',
    seconds: 20,
    loops: true,
  },
  {
    id: 'wood-creak',
    text:
      'old wooden boards creaking under strain, a single slow groan ' +
      'of weathered timber',
    seconds: 3,
  },
  {
    id: 'breeze-leaves',
    text:
      'a light breeze rustling through leaves and tall grass in the open ' +
      'countryside, calm, no birds',
    seconds: 20,
    loops: true,
  },
  {
    id: 'crow-caw',
    text: 'a lone crow cawing twice, somewhere in the distance over open fields',
    seconds: 3,
  },
  {
    id: 'chickens',
    text:
      'a small flock of hens clucking and scratching in straw inside a ' +
      'wooden coop, close by',
    seconds: 20,
    loops: true,
  },
  {
    id: 'hen-squawk',
    text: 'a startled hen squawking and flapping its wings in a wooden coop',
    seconds: 3,
  },
  {
    id: 'well-drip',
    text:
      'a single drop of water falling into a deep stone well, a small ' +
      'echoing plink',
    seconds: 2,
  },
  {
    id: 'forge-fire',
    text:
      'the low roar of hot coals in a blacksmith forge, a steady draught ' +
      'and crackle, no hammering',
    seconds: 20,
    loops: true,
  },
  {
    id: 'anvil-strike',
    text:
      'a blacksmith hammer ringing on an anvil, three steady blows on hot ' +
      'iron, the metal ringing after',
    seconds: 4,
  },
  {
    id: 'shop-bell',
    text:
      'a small brass bell over a shop door jingling as the door opens and ' +
      'closes',
    seconds: 2,
  },
  {
    id: 'glass-clink',
    text:
      'glass bottles and jars clinking softly as they are moved on a ' +
      'wooden shelf',
    seconds: 2,
  },
  {
    id: 'village-murmur',
    text:
      'a quiet village square, a few hushed voices at market stalls and ' +
      'footsteps on cobblestones, no words can be made out',
    seconds: 20,
    loops: true,
  },
  {
    id: 'fountain',
    text: 'an old stone fountain trickling and splashing softly into its basin',
    seconds: 20,
    loops: true,
  },
  {
    id: 'birdsong',
    text:
      'songbirds calling and answering in a sunlit wood, near and far, ' +
      'no wind',
    seconds: 20,
    loops: true,
  },
  {
    id: 'twig-snap',
    text:
      'a twig snapping underfoot somewhere in the undergrowth, then a ' +
      'short rustle of leaves',
    seconds: 2,
  },
  {
    id: 'river',
    text:
      'a gentle river flowing slowly past reeds, soft lapping at a muddy ' +
      'bank',
    seconds: 20,
    loops: true,
  },
  {
    id: 'insects-hum',
    text:
      'summer insects humming and buzzing lazily over still water, ' +
      'dragonflies and gnats',
    seconds: 20,
    loops: true,
  },
  {
    id: 'chapel-door',
    text:
      'a heavy wooden chapel door swinging shut with a deep thud that ' +
      'echoes through a stone hall',
    seconds: 3,
  },
  {
    id: 'chapel-hush',
    text:
      'the hush of a cool, empty stone chapel, a faint echo of distant ' +
      'air, very quiet',
    seconds: 20,
    loops: true,
  },
  {
    id: 'horse-snort',
    text:
      'a horse snorting and stamping a hoof on a dirt road, then ' +
      'tearing at grass',
    seconds: 3,
  },
  {
    id: 'cat-purr',
    text: 'a cat purring contentedly in its sleep, close by, slow and soft',
    seconds: 20,
    loops: true,
  },
  {
    id: 'mechanism-whir',
    text:
      'a small black-iron clockwork mechanism whirring and ticking to ' +
      'itself, steady and faintly wrong',
    seconds: 20,
    loops: true,
  },
  {
    id: 'fox-whimper',
    text:
      'a small fox kit whimpering weakly, tired and frightened, in the ' +
      'undergrowth',
    seconds: 3,
  },
  {
    id: 'glade-hush',
    text:
      'an unnatural, heavy stillness in a dark forest clearing, a faint ' +
      'low hum, no birds, no wind',
    seconds: 20,
    loops: true,
  },
]

/** The clips as Content Studio's list: id, words (`text`), length and, for a loop, `loops`. */
export function effectsList(): EffectEntry[] {
  return GAME_EFFECTS.map(({ id, text, seconds, loops }) =>
    loops ? { id, text, seconds, loops } : { id, text, seconds },
  )
}
