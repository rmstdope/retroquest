import { markedPath, type MarkedPath } from '@/engine'

/**
 * The golden path with its marks: a step starting `@` is not a command but
 * names the point of the path where it stands, which an optional scene of
 * `tts/act4/branches.json` plays after.
 */
export const ACT4_GOLDEN: MarkedPath = markedPath([
  'examine ward stones',
  '@examine-ward-stones',
  'cast light on right stone',
  '@cast-light-on-right-stone',
  "take guardian's chain",
  '@take-guardians-chain',
  "take guardian's essence",
  'e',
  '@in-outer-courtyard',
  "use guardian's essence with trapped servants",
  'cast bless on trapped servants',
  '@cast-bless-on-trapped-servants',
  "take servant's pendant",
  'n',
  "use servant's pendant",
  's',
  'w',
  'n',
  'examine echoes',
  '@examine-echoes',
  'take echo stone',
  's',
  'e',
  'n',
  '@in-mirror-labyrinth',
  'w',
  'w',
  "use servant's pendant",
  'e',
  '@in-mirror-labyrinth-2',
  's',
  'w',
  'n',
  '@in-hall-of-echoes',
  'cast truth sight on knight of despair',
  '@cast-truth-sight-on-knight-of-despair',
  'cast truth sight on banners',
  '@cast-truth-sight-on-banners',
  'cast truth sight on echo stone',
  '@cast-truth-sight-on-echo-stone',
  "use guardian's chain",
  'say redemption to knight',
  '@say-redemption-to-knight',
  'e',
  '@in-tower-of-shadows',
  'say mira to whispers',
  'say cedric to whispers',
  '@say-cedric-to-whispers',
  'say nyx to whispers',
  '@say-nyx-to-whispers',
  'up',
  '@in-chamber-of-whispers',
  "use knight's redemption",
  '@use-knights-redemption',
  "cast heart's truth on sorceress",
  '@cast-hearts-truth-on-sorceress',
  "cast heart's truth on staff",
  "cast heart's truth on whispers",
  'say understanding to sorceress',
  '@say-understanding-to-sorceress',
  'n',
  '@in-memory-vault',
  'use enhanced echo stone with memory orbs',
  '@use-enhanced-echo-stone-with-memory-orbs',
  "use sorceress's truth",
  '@use-sorceresss-truth',
  'say patience to shadow',
  '@say-patience-to-shadow',
  'use ancient amulet on door',
  'e',
  '@in-parents-vault',
  'examine memories',
  'n',
  '@in-throne-chamber',
  'talk to malakar',
  '@talk-to-malakar',
  'say refrain to malakar',
  'use ancient amulet',
  '@use-ancient-amulet',
  'use lifelight elixir on malakar',
  '@use-lifelight-elixir-on-malakar',
  'say forgiveness to malakar',
  '@say-forgiveness-to-malakar',
  'cast forgiveness on wound',
  '@cast-forgiveness-on-wound',
  'n',
  '@in-willowbrook-field',
  'cast grow',
  '@cast-grow',
])

/**
 * The commands that play Act 4's golden path from the Fortress Gates to the
 * end of the story: breaking the ward guardians, freeing the trapped servants
 * in the Outer Courtyard, then fetching the Echo Stone from the Hall of
 * Echoes, walking the Mirror Labyrinth (west, west, then east once the
 * pendant has shown the empty corridor), redeeming the Knight of Despair and
 * the Sorceress of Lies, answering the Shadow of the Past and seeing the
 * parents' memories, then facing Malakar in the Throne Chamber. The path takes
 * the forgiveness ending (the other endings are branches), heals the Wound in
 * Time and ends by casting grow on Willowbrook Field.
 */
export const ACT4_GOLDEN_PATH: string[] = ACT4_GOLDEN.commands
