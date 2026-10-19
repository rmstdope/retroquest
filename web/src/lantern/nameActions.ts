import { displayName } from './displayName'

/**
 * One thing to do with a name clicked in the story: a command, or (Give…,
 * Cast…) a list of choices that each have one.
 */
export interface NameAction {
  label: string
  command?: string
  choices?: NameAction[]
}

/** What is around: names as the engine gives them (no markup, no counts). */
export interface Around {
  characters: string[]
  items: string[]
  bag: string[]
  /** Spells the player knows, by name. */
  spells?: string[]
  /** Short names the story uses ("journal") → full item names. */
  shortNames?: Record<string, string>
}

const same = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase()

/**
 * The item name the story means: its short name resolved ("journal" →
 * "Elior's Journal"), or the singular of a plain plural ("chickens") when
 * only that is around.
 */
function itemName(said: string, around: Around): string {
  const full = around.shortNames?.[said]
  if (full) return full.toLowerCase()
  const known = [...around.items, ...around.bag].map((i) => i.toLowerCase())
  if (
    !known.includes(said) &&
    said.endsWith('s') &&
    known.includes(said.slice(0, -1))
  )
    return said.slice(0, -1)
  return said
}

/**
 * The actions that fit a character or item named in the story, given what is
 * in the room, the bag and the spells known; none when it is not here. A
 * character also gets Give… (each thing in the bag) and Cast… (each spell).
 */
export function nameActions(
  kind: 'character' | 'item',
  text: string,
  around: Around,
): NameAction[] {
  const said = text.trim().toLowerCase()
  const name = itemName(said, around)
  const actions = (labels: Array<[string, string]>) =>
    labels.map(([label, verb]) => ({ label, command: `${verb} ${name}` }))
  if (kind === 'character') {
    if (!around.characters.some((c) => same(c, name))) return []
    const [talk, examine] = actions([
      ['Talk to', 'talk to'],
      ['Examine', 'examine'],
    ])
    const choices = (
      label: string,
      things: string[],
      command: (t: string) => string,
    ) =>
      things.length
        ? [
            {
              label,
              choices: things.map((t) => ({
                label: displayName(t),
                command: command(t.toLowerCase()),
              })),
            },
          ]
        : []
    return [
      talk,
      ...choices('Give…', around.bag, (item) => `give ${item} to ${name}`),
      ...choices(
        'Cast…',
        around.spells ?? [],
        (spell) => `cast ${spell} on ${name}`,
      ),
      examine,
    ]
  }
  if (around.bag.some((i) => same(i, name)))
    return actions([
      ['Use', 'use'],
      ['Drop', 'drop'],
      ['Examine', 'examine'],
    ])
  if (around.items.some((i) => same(i, name)))
    return actions([
      ['Take', 'take'],
      ['Examine', 'examine'],
    ])
  return []
}
