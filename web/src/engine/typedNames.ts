/**
 * How a name the player typed reaches its thing, one rule for every kind of
 * thing and every verb: the words as typed first, so a name that begins with
 * an article of its own still answers, and then without a leading "a", "an"
 * or "the". A character, and only a character, is also reached by one word of
 * its name.
 */
import type { Character } from './Character'

const ARTICLES: readonly string[] = ['a', 'an', 'the']

/** Words of a character's name that never name anyone on their own. */
const NAME_JOINING_WORDS: readonly string[] = ['of', 'and', ...ARTICLES]

/** Whether the word is an article. */
export function isArticle(word: string): boolean {
  return ARTICLES.includes(word.toLowerCase())
}

/**
 * The name without its leading article. A name with none is returned as it is,
 * and so is an article on its own, which stays a name.
 */
export function withoutArticle(typed: string): string {
  const [, first, rest] = /^(\S+)\s+(\S.*)$/.exec(typed.trim()) ?? []
  return first !== undefined && isArticle(first) ? rest : typed
}

/**
 * What `find` answers for the name as typed or, when that is null, for the
 * name without its article; null when neither answers.
 */
export function resolveName<T>(
  typed: string,
  find: (name: string) => T | null,
): T | null {
  const found = find(typed)
  if (found !== null) return found
  const bare = withoutArticle(typed)
  return bare === typed ? null : find(bare)
}

/**
 * The character among `characters` the words name, or null: one answering to
 * the whole name, or else the only one whose name holds the single word typed
 * ("guardian" for the Tide-Born Guardian).
 */
export function characterNamed(
  typed: string,
  characters: readonly Character[],
): Character | null {
  return (
    resolveName(
      typed,
      (name) =>
        characters.find((character) => character.answersTo(name)) ?? null,
    ) ?? characterByWord(withoutArticle(typed), characters)
  )
}

/**
 * The one character whose name holds the word, or null when none does or
 * several do. Joining words such as "of" never name anyone.
 */
function characterByWord(
  typed: string,
  characters: readonly Character[],
): Character | null {
  const word = typed.trim().toLowerCase()
  if (word === '' || /\s/.test(word) || NAME_JOINING_WORDS.includes(word))
    return null
  const matches = characters.filter((character) =>
    character.name.toLowerCase().split(/\s+/).includes(word),
  )
  return matches.length === 1 ? matches[0] : null
}
