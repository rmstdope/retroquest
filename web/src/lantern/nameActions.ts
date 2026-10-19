/** One thing to do with a name clicked in the story. */
export interface NameAction {
  label: string
  command: string
}

/** What is around: names as the engine gives them (no markup, no counts). */
export interface Around {
  characters: string[]
  items: string[]
  bag: string[]
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
 * in the room and the bag; none when it is not here.
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
    return around.characters.some((c) => same(c, name))
      ? actions([
          ['Talk to', 'talk to'],
          ['Examine', 'examine'],
        ])
      : []
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
