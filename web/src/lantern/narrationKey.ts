/**
 * The key that ties a story block to its recorded narration.
 *
 * A recording is made for a speaker saying a text; the story view later shows
 * that text as a block with markup. Both sides derive the same key from the
 * speaker and the plain words, so a block finds its recording without any id
 * travelling through the engine. Changed wording gives a new key, which is how
 * a recording that no longer matches its text is noticed.
 */

import { MARKUP_TAGS } from '@/engine/markup'

/** Any opening or closing engine markup tag (bracketed words in prose don't count). */
const ANY_TAG = new RegExp(`\\[/?(${MARKUP_TAGS.join('|')})\\]`, 'g')

/** The words a block says: markup stripped, whitespace collapsed, trimmed. */
export function narrationText(markup: string): string {
  return markup.replace(ANY_TAG, '').replace(/\s+/g, ' ').trim()
}

/**
 * cyrb53: a small, fast 53-bit string hash. Not cryptographic; it only needs
 * to keep a few thousand lines apart.
 */
function cyrb53(text: string): number {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ code, 2654435761)
    h2 = Math.imul(h2 ^ code, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

/**
 * The recording key for `speaker` saying `markup`: fourteen hex characters,
 * the same whatever the markup, spacing or the speaker's case.
 */
export function narrationKey(speaker: string, markup: string): string {
  const text = `${speaker.trim().toLowerCase()}\n${narrationText(markup)}`
  return cyrb53(text).toString(16).padStart(14, '0')
}
