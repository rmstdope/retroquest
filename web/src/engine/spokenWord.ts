/**
 * How the game hears what Elior says to a character: one normaliser for
 * answers that must be the whole utterance, and one whole-word matcher for
 * answers that may sit inside a sentence. Every `sayTo` goes through these, so
 * a new riddle cannot reintroduce a substring match ("impatience" is not
 * "patience").
 */

/**
 * Trims the words, strips a leading quote mark and any trailing quote marks,
 * full stops or exclamation marks, collapses inner whitespace and lower-cases
 * the result.
 */
export function normaliseSpokenWord(words: string): string {
  return words
    .trim()
    .replace(/^['"“]|['"”.!]+$/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

/** The lower-case words of an utterance, split on anything that is not a letter. */
function wordsOf(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((word) => word !== '')
}

/**
 * Whether the words contain any of the answers as whole words. An answer of
 * several words must appear as those words in a row. Case and punctuation do
 * not matter; the answers are the synonym list, kept as data by the caller.
 */
export function saysAnyOf(words: string, answers: readonly string[]): boolean {
  const spoken = wordsOf(words)
  return answers.some((answer) => {
    const wanted = wordsOf(answer)
    if (wanted.length === 0) return false
    for (let i = 0; i + wanted.length <= spoken.length; i++) {
      if (wanted.every((word, j) => spoken[i + j] === word)) return true
    }
    return false
  })
}
