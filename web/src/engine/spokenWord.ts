/**
 * How the game hears what Elior says to a character: one normaliser for
 * answers that must be the whole utterance, and one whole-word matcher for
 * answers that may sit inside a sentence. The `sayTo` of Act III and Act IV go through these, so
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
    .trim()
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

/** Words that turn a sentence against what it names; "n't" splits off as "t". */
const NEGATIONS = ['not', 'never', 'no', 'cannot', 'nor', 't']

/**
 * Whether the words say one of the answers and do not deny it: "I forgive
 * you" affirms "forgive", "I will never forgive you" does not. Use it where a
 * sentence may carry the answer and a stray negation must not count.
 */
export function affirms(words: string, answers: readonly string[]): boolean {
  return (
    saysAnyOf(words, answers) &&
    !wordsOf(words).some((word) => NEGATIONS.includes(word))
  )
}
