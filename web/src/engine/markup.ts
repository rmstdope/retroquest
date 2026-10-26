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
  'clue',
  'pending',
  'success',
  'exits',
  'bold',
  'dim',
  'italic',
  'breath',
  'gesture',
  'effect',
]

/** Wrap `text` as an event line: `[event]text[/event]`. */
export function event(text: string): string {
  return `[event]${text}[/event]`
}

/**
 * Mark `text` as the player's gesture: the sentence that only repeats what
 * the typed command already says ("You give her the scroll."). The story view
 * shows no gesture and narration voices none, so content may keep it beside
 * the effect without the player hearing the command twice.
 */
export function gesture(text: string): string {
  return `[gesture]${text}[/gesture]`
}

/**
 * Mark `text` as an effect: what happens, even when it opens in the player's
 * voice ("You recite the chant at each stone."). It reads as plain narration
 * and is the one way a sentence that looks like an echo of the command is
 * known not to be one.
 */
export function effect(text: string): string {
  return `[effect]${text}[/effect]`
}

/**
 * Wrap `text` as a failure that tells the player something about the world or
 * gives a clue: `[failure][clue]text[/clue][/failure]`. The story view shows
 * it in the red failure box and reads it aloud, while a plain `[failure]`
 * refusal stays silent. It is still a `[failure]` to the game. Keep any echo
 * of the command out of it, on its own `event()` line before it.
 */
export function clue(text: string): string {
  return `[failure][clue]${text}[/clue][/failure]`
}

/**
 * The amber "remembered" line that follows a virtue moment:
 * `[event]✦ <label> — this will be remembered[/event]`. Acts name the virtue
 * (Mercy, Truth, Selflessness) and share this one wording.
 */
export function remembered(label: string): string {
  return event(`✦ ${label} — this will be remembered`)
}

/**
 * Wrap `name` as a character name inside running text:
 * `[character_name]name[/character_name]`.
 */
export function characterName(name: string): string {
  return `[character_name]${name}[/character_name]`
}

/**
 * Wrap `words` as speech inside running text, with no name line of its own:
 * `[dialogue]words[/dialogue]`. Use it when narration already names the
 * speaker; use `dialogue()` when the name should be written for you.
 */
export function speech(words: string): string {
  return `[dialogue]${words}[/dialogue]`
}

/**
 * Write a spoken line attributed to `speaker`: the speaker's name on a line of
 * its own, then the words as `[dialogue]`. The story view drops a name-only
 * line directly before its quote, so the player sees the name once, as the
 * label above the quote.
 */
export function dialogue(speaker: string, words: string): string {
  return (
    `[character_name]${speaker}[/character_name]\n` +
    `[dialogue]${words}[/dialogue]`
  )
}

/**
 * Write words that have no speaker, such as a journal page or a letter. The
 * empty `[character_name]` says the missing speaker is deliberate: the checker
 * accepts it and the story view shows the quote with no label.
 */
export function writing(words: string): string {
  return `[character_name][/character_name]\n[dialogue]${words}[/dialogue]`
}

/**
 * Make sure the first `[dialogue]` of `text` has a speaker: when no
 * `[character_name]` comes before it, the speaker's name goes on a line of
 * its own right before the quote, which the story view shows as the label.
 * Text with no dialogue, or whose dialogue is already attributed, comes back
 * unchanged. Use it where an answer opens with narration or speech that no
 * longer has a command line naming who is speaking.
 */
export function attributeSpeech(speaker: string, text: string): string {
  const quote = text.indexOf('[dialogue]')
  if (quote < 0 || text.slice(0, quote).includes('[character_name]'))
    return text
  const lead = quote === 0 || text[quote - 1] === '\n' ? '' : '\n'
  return (
    text.slice(0, quote) +
    `${lead}[character_name]${speaker}[/character_name]\n` +
    text.slice(quote)
  )
}

const TAG_PATTERN = /\[(\/?)([a-z_]+)\]/g

/**
 * Find malformed markup in one piece of engine output: unknown tags, tags
 * that are unbalanced, unclosed or nested in themselves, and dialogue with no
 * `[character_name]` in the narration before it (names inside dialogue never
 * count, as in parseTurn). A speaker is any name seen so far, so after unsigned
 * `writing()` a later plain `[dialogue]` in the same answer is accepted too and
 * shown without a label; give it its own name line. Returns one message per problem; empty when well formed.
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
