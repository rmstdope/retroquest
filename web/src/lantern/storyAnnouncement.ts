/**
 * What a screen reader is told when a story turn appears (`StoryAnnouncer`):
 * one announcement for each bubble of the turn, in plain words. The sentences
 * of a bubble keep a space between them (and between lines), so they are not
 * read as one word; a quote is spoken as "Speaker: line".
 */
import { parseTurn } from './parseTurn'
import { renderMarkup } from '@/utils/theme'

/** The plain words of markup: tags dropped, entities decoded, line breaks and runs of space one space. */
function plainWords(markup: string): string {
  return renderMarkup(markup)
    .replace(/<br\s*\/?>/g, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

/** The announcements of one turn's raw markup, one for each bubble, in order. */
export function announcementsOf(raw: string): string[] {
  const spoken: string[] = []
  for (const block of parseTurn(raw)) {
    const words =
      block.kind === 'checklist'
        ? block.items
            .map((item) => plainWords(item.markup))
            .map((text) => (/[.!?]$/.test(text) ? text : `${text}.`))
            .join(' ')
        : plainWords(block.markup)
    if (!words) continue
    spoken.push(
      block.kind === 'dialogue' && block.speaker
        ? `${plainWords(block.speaker)}: ${words}`
        : words,
    )
  }
  return spoken
}
