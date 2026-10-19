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
}

const same = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase()

/**
 * The actions that fit a character or item named in the story, given what is
 * in the room and the bag; none when it is not here.
 */
export function nameActions(
  kind: 'character' | 'item',
  text: string,
  around: Around,
): NameAction[] {
  const name = text.trim().toLowerCase()
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
