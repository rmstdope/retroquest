/**
 * The commands that play Act 4's golden path from the Fortress Gates as far as
 * the act is playable today: breaking the ward guardians, then freeing the
 * trapped servants in the Outer Courtyard and stepping into the Mirror Labyrinth. Each later Act 4
 * piece appends its steps here as it lands.
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
  'take loyalty token',
  "take servant's pendant",
  'n',
]
