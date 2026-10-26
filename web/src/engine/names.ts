/**
 * How a character's, item's or room's name reads inside a sentence.
 *
 * Content objects have one `name`, the key the parser matches ("barmaid
 * elena", "elior's journal"). Content may case it as it likes ("Echo Stone");
 * this module decides the case it reads in. Whatever the engine prints about an
 * object goes through `nameInSentence`, the single place that knows the rules:
 * the markup tag of the kind, capitals, and the article a name does or does
 * not take.
 */

/** What a name belongs to; picks the markup tag and the article rules. */
export type NameKind = 'character' | 'item' | 'room'

/** Where in the sentence the name stands. */
export interface NameOptions {
  /** The name opens the sentence, so an article before it is capitalised. */
  atStart?: boolean
  /**
   * The name is a person's own ("Elior's Journal", "Mira's Hut"), so it takes
   * no article. Content says so explicitly: a possessive in the name alone
   * does not ("the Blacksmith's Forge" still takes "the").
   */
  bare?: boolean
  /**
   * The character is named by what it is, not who ("merchant", "deer"), so
   * the name takes "the" and stays lower case like an item's. Content says
   * so explicitly; without it a character's name is a proper name.
   */
  common?: boolean
}

/** Words a title keeps lower case ("Captain of the Guard"). */
const MINOR_WORDS = ['of', 'the']

/** Capitalise every word but the minor ones after the first. */
function titleCase(name: string): string {
  return name
    .split(' ')
    .map((word, i) =>
      i > 0 && MINOR_WORDS.includes(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ')
}

/**
 * The marked-up name as it reads in a sentence.
 *
 * - A character is a proper name: title-cased, no article, wherever it stands;
 *   unless `common` says it is named by what it is, when it reads like an
 *   item ("the merchant", "The merchant" with `atStart`).
 * - An item or room takes "the" ("The" with `atStart`), unless `bare` says its
 *   name is a person's own. A bare item is title-cased ("Elior's Journal");
 *   any other item reads in lower case, however content cased its name ("the
 *   enhanced echo stone"); a room's name is already cased, and a leading
 *   "The " of it is dropped so the article is not said twice.
 */
export function nameInSentence(
  kind: NameKind,
  name: string,
  options: NameOptions = {},
): string {
  if (kind === 'character' && options.common !== true) {
    return `[character_name]${titleCase(name)}[/character_name]`
  }
  const tag =
    kind === 'character'
      ? 'character_name'
      : kind === 'item'
        ? 'item_name'
        : 'room_name'
  const bare = options.bare === true
  const shown =
    kind === 'item' && bare
      ? titleCase(name)
      : kind === 'room'
        ? name.replace(/^The /, '')
        : kind === 'item'
          ? name.toLowerCase()
          : name
  const marked = `[${tag}]${shown}[/${tag}]`
  if (bare) return marked
  return `${options.atStart ? 'The' : 'the'} ${marked}`
}

/**
 * The indefinite article a name takes, by its first sound as its spelling
 * shows it: "an" before a vowel ("an enhanced echo stone"), "a" otherwise.
 */
export function indefiniteArticle(name: string): 'a' | 'an' {
  return /^[aeiou]/i.test(name.trim()) ? 'an' : 'a'
}
