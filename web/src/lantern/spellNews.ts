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
  const byName = new Map(
    spells.map((spell) => [spell.name.toLowerCase(), spell]),
  )
  let stripped = ''
  let from = 0
  for (const match of text.matchAll(LEARNED_SENTENCE)) {
    const named = [...match[0].matchAll(NAMED_SPELL)].map((each) =>
      byName.get(spellTitle(each[1]).toLowerCase()),
    )
    if (!named.length || named.some((spell) => !spell)) continue
    let end = match.index + match[0].length
    // The spell's own description right after the sentence is told in the middle too.
    for (const spell of named) {
      const rest = text.slice(end)
      const gap = rest.length - rest.trimStart().length
      if (spell && rest.slice(gap).startsWith(spell.text))
        end += gap + spell.text.length
    }
    stripped += text.slice(from, match.index)
    from = end
  }
  if (from === 0 && stripped === '') return text
  stripped += text.slice(from)
  return stripped
    .replace(EMPTY_TAGS, '')
    .replace(/\[([a-z_]+)\] +/g, '[$1]')
    .replace(/ +\[\/([a-z_]+)\]/g, '[/$1]')
    .split('\n')
    .map((line) => line.replace(/ {2,}/g, ' ').replace(/^ +| +$/g, ''))
    .filter((line, index, lines) => line !== '' || lines[index - 1] !== '')
    .join('\n')
    .replace(/^\n+|\n+$/g, '')
}
