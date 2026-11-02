/**
 * Spell news: a spell the player has just learned, told in the middle of the
 * picture the way quest news is (`stageArrival`). It is made from the spell's
 * name and the description the Spells list gives, and it takes the engine's
 * "You have learned …" sentence off the narrator's card, since the middle
 * tells it (Story so far keeps the whole text).
 */

/** A spell learned in a turn, ready to be told. */
export interface SpellNews {
  /** The name capitalised as a heading ("Greater Heal"). */
  name: string
  /** The spell's own description, as the Spells list gives it. */
  text: string
}

/** The heading of a piece of spell news. */
export const SPELL_HEADING = 'New spell'

const NAME_TAG = /\[\/?spell_name\]/g

/** A spell's name as a title: the first letter of every word capitalised, the rest as written. */
export function spellTitle(name: string): string {
  return name.replace(
    /(^|\s)(\S)/g,
    (_all, space: string, letter: string) => `${space}${letter.toUpperCase()}`,
  )
}

/** The news of a spell from its name as the Spells list gives it (markup) and its description. */
export function toSpellNews(
  nameMarkup: string,
  description: string,
): SpellNews {
  return {
    name: spellTitle(nameMarkup.replace(NAME_TAG, '')),
    text: description,
  }
}

/** A sentence that tells what was learned: from "You have learned" to its closing . or !. */
const LEARNED_SENTENCE = /You have learned [^.!]*?(?:[.!](?=\s|$|\[)|[.!]$)/g
const NAMED_SPELL = /\[spell_name\]([\s\S]*?)\[\/spell_name\]/g
const EMPTY_TAGS = /\[([a-z_]+)\]\s*\[\/\1\]/g

/**
 * The text without the sentences that tell the spells learned this turn: a
 * sentence goes only when every spell it names is one of `spells`. A line or
 * tag left empty goes with it.
 */
export function withoutLearnedLines(text: string, spells: SpellNews[]): string {
  if (!spells.length) return text
  const learned = new Set(spells.map((spell) => spell.name.toLowerCase()))
  const names = (sentence: string): string[] =>
    [...sentence.matchAll(NAMED_SPELL)].map((match) =>
      spellTitle(match[1]).toLowerCase(),
    )
  const stripped = text.replace(LEARNED_SENTENCE, (sentence) => {
    const named = names(sentence)
    return named.length && named.every((name) => learned.has(name))
      ? ''
      : sentence
  })
  if (stripped === text) return text
  return stripped
    .replace(EMPTY_TAGS, '')
    .split('\n')
    .map((line) => line.replace(/ {2,}/g, ' ').replace(/^ +| +$/g, ''))
    .filter((line, index, lines) => line !== '' || lines[index - 1] !== '')
    .join('\n')
    .replace(/^\n+|\n+$/g, '')
}
