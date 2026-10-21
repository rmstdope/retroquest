/**
 * Normalises what Elior says to a character, so the five Act IV `sayTo`
 * implementations (True Self, Malakar, Shadow of the Past, Sorceress of Lies
 * and Knight of Despair) all read a spoken word the same way.
 */

/**
 * Trims the words, strips a leading quote mark and any trailing quote marks,
 * full stops or exclamation marks, and lower-cases the result.
 */
export function normaliseSpokenWord(words: string): string {
  return words
    .trim()
    .replace(/^['"“]|['"”.!]+$/g, '')
    .toLowerCase()
}
