/**
 * Word spans for the read-along highlight.
 *
 * The recordings' word timings refer to `narrationWords` of a block: its
 * words split on whitespace, punctuation attached. `wrapWords` marks the same
 * words in the block's rendered HTML, so the story view can light the one
 * being spoken (`[data-w="n"]`). A word that runs across an inline tag is
 * several spans with the same index.
 */

/** Matches an HTML tag, whitespace, or a run of other characters. */
const PIECES = /(<[^>]*>)|(\s+)|([^\s<]+)/g

/**
 * `html` (as `renderMarkup` makes it) with each word in a `lq-w` span, and the
 * number of words. Words are numbered from `start`, for text that follows
 * other words of the same narrated unit (a room's name, a quest's heading).
 */
export function wrapWords(
  html: string,
  start = 0,
): { html: string; count: number } {
  let index = start - 1
  let inWord = false
  const wrapped = html.replace(
    PIECES,
    (_piece, tag?: string, space?: string, word?: string) => {
      if (tag !== undefined) {
        // A line break separates words; other tags sit inside or between them.
        if (/^<br\b/i.test(tag)) inWord = false
        return tag
      }
      if (space !== undefined) {
        inWord = false
        return space
      }
      if (!inWord) {
        index++
        inWord = true
      }
      return `<span class="lq-w" data-w="${index}">${word}</span>`
    },
  )
  return { html: wrapped, count: index + 1 - start }
}
