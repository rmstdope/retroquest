/**
 * The engine's text markup: the one vocabulary of tags, helpers that write
 * attributed dialogue and events, and a checker that finds malformed markup.
 *
 * Content returns strings such as `[character_name]Mira[/character_name]`;
 * the UI (utils/theme.ts, lantern/parseTurn.ts) renders them. Keeping the
 * vocabulary here means the theme, the parser and the tests agree on it.
 */

/** All known tags of the engine markup. */
export const MARKUP_TAGS: readonly string[] = [
  'character_name',
  'dialogue',
  'item_name',
  'spell_name',
  'room_name',
  'quest_name',
  'event',
  'failure',
  'pending',
  'success',
  'exits',
  'bold',
  'dim',
] as const

/** Wrap `text` as an event line: `[event]text[/event]`. */
export function event(text: string): string {
  return `[event]${text}[/event]`
}

/**
 * Write a spoken line attributed to `speaker`: the speaker's name in
 * narration, then the words as `[dialogue]`, so the UI can show who speaks.
 */
export function dialogue(speaker: string, words: string): string {
  return (
    `[character_name]${speaker}[/character_name]\n` +
    `[dialogue]${words}[/dialogue]`
  )
}

const TAG_PATTERN = /\[(\/?)([a-z_]+)\]/g

/**
 * Find malformed markup in one piece of engine output: unknown tags, tags
 * that are unbalanced, unclosed or nested in themselves, and dialogue with no
 * `[character_name]` in the narration before it (names inside dialogue never
 * count, as in parseTurn). Returns one message per problem; empty when well formed.
 */
export function findMarkupProblems(text: string): string[] {
  const problems: string[] = []
  const open: string[] = []
  let sawSpeaker = false
  for (const match of text.matchAll(TAG_PATTERN)) {
    const [, closing, tag] = match
    const shown = `[${closing}${tag}]`
    if (!MARKUP_TAGS.includes(tag)) {
      problems.push(`unknown tag ${shown}`)
      continue
    }
    if (!closing) {
      if (open.includes(tag)) problems.push(`nested ${shown}`)
      if (tag === 'dialogue' && !sawSpeaker)
        problems.push('unattributed dialogue (no [character_name] before it)')
      open.push(tag)
    } else if (open.at(-1) === tag) {
      open.pop()
    } else {
      problems.push(`unbalanced ${shown}`)
      const index = open.lastIndexOf(tag)
      if (index >= 0) open.splice(index)
    }
    if (tag === 'character_name' && !closing && !open.includes('dialogue'))
      sawSpeaker = true
  }
  for (const tag of open) problems.push(`unclosed [${tag}]`)
  return problems
}
