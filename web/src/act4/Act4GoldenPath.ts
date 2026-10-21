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
export const ACT4_GOLDEN_PATH: string[] = [
  'examine ward stones',
  'take ward stone fragment',
  'use ward stone fragment with barriers',
  'cast light on ward stones',
  "take guardian's chain",
  "take guardian's essence",
  'e',
  "use guardian's essence with trapped servants",
  'cast bless on trapped servants',
  "take servant's pendant",
  'n',
  "use servant's pendant",
  's',
  'w',
  'n',
  'examine echoes',
  'take echo stone',
  's',
  'e',
  'n',
  'w',
  'w',
  "use servant's pendant",
  'e',
  's',
  'w',
  'n',
  'cast truth sight on knight of despair',
  "use guardian's chain",
  'say redemption to knight',
  'e',
  'say mira to whispers',
  'say cedric to whispers',
  'say nyx to whispers',
  'up',
  "use knight's redemption",
  "cast heart's truth on sorceress",
  'say understanding to sorceress',
  'n',
  'use enhanced echo stone with memory orbs',
  "use sorceress's truth",
  'say patience to shadow',
  'use ancient amulet on door',
  'e',
  'examine memories',
  'n',
  'talk to malakar',
  'say refrain to malakar',
  'use ancient amulet',
  'use lifelight elixir on malakar',
  'say forgiveness to malakar',
  'cast forgiveness on wound',
  'n',
  'cast grow',
]
