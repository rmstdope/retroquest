/**
 * A quest's text as the quest card shows it. A checklist quest's needs
 * (`[success] * …` and `[pending] * …` lines, see `parseTurn`) become a list
 * instead of bullet text, and its other lines paragraphs; any other text is
 * rendered as it is. The list's marks are drawn by the card's styles, so the
 * HTML holds the same words the narration reads (`questTextBlocks`) and the
 * read-along can number them; `shownWords` counts them for a piece of such text.
 */

import { renderMarkup } from '@/utils/theme'
import { narrationWords } from './narrationManifest'
import { parseTurn } from './parseTurn'

/** The bullet of a checklist line (`[pending] * …`), after its opening tag. */
const CHECKLIST_BULLET_LINE = /^(\s*\[(?:success|pending)\]\s*)\*\s*/gm

/** The words of `markup` as it is shown and read: its narration words, less the bullets of checklist lines. */
export function shownWords(markup: string): string[] {
  return narrationWords(markup.replace(CHECKLIST_BULLET_LINE, '$1'))
}

/** The HTML of a quest's text: paragraphs, and each checklist as a `<ul>` of done and pending items. */
export function questTextHtml(text: string): string {
  const blocks = parseTurn(text)
  if (!blocks.some((block) => block.kind === 'checklist'))
    return renderMarkup(text)
  return blocks
    .map((block) => {
      if (block.kind !== 'checklist')
        return `<p class="lq-quest-para">${renderMarkup(block.markup)}</p>`
      const items = block.items.map(
        (item) =>
          `<li class="${item.done ? 'lq-check-done' : 'lq-check-pending'}">` +
          `${renderMarkup(item.markup)}</li>`,
      )
      return `<ul class="lq-quest-checklist">\n${items.join('\n')}\n</ul>`
    })
    .join('\n')
}
