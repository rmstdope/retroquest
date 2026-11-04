import { balance } from './parseTurn'
import { shownWords } from './questTextHtml'

/**
 * Cutting an arrival part into pages (the laptop stage). A part taller than
 * the room the text has is split between lines, then between paragraphs (line
 * breaks inside a line), then between sentences, so that each page fits at the
 * full type size. Whether a page fits is decided by the caller (it needs
 * layout); everything here is pure. A piece keeps the place of its first word
 * in its line (`wordStart`), so the narrator's word can be followed across
 * pages and the read-along can number the words of a piece.
 */

/** One line of a part, as `ArrivalLine` gives it. */
export interface PageSource {
  unit: number
  markup: string
  /** Stays on the page of the line before it (a speaker's quote). */
  joinsPrevious?: boolean
}

/** A slice of a line: a paragraph or a sentence, balanced on its own. */
export interface ArrivalPiece {
  unit: number
  markup: string
  /** What joins it to the piece before it in the same line: '' (first), '\n' or ' '. */
  sep: '' | '\n' | ' '
  /** The narration words of the line before this piece. */
  wordStart: number
}

/** A line, or part of it, as a page shows it. */
export interface PageLine {
  unit: number
  markup: string
  wordStart: number
}

/** One page: its pieces, where the narrator's first word on it is, and whether it must scroll. */
export interface ArrivalPage {
  pieces: ArrivalPiece[]
  firstUnit: number
  firstWord: number
  /** A single sentence taller than any page: the page scrolls, as the phone's arrival does. */
  scrolls: boolean
}

/** Whether a set of pieces fits the room the text has. */
export type Fits = (pieces: ArrivalPiece[]) => boolean

/** After sentence-ending punctuation (and closing tags or quotes), white space. */
const SENTENCE_END = /(?<=[.!?…](?:\[\/\w+\])*["'”’)]*)\s+/

/** Pieces from texts, each balanced on its own and numbered from `start`. */
function piecesOf(
  unit: number,
  texts: string[],
  seps: ArrivalPiece['sep'][],
  start: number,
): ArrivalPiece[] {
  const open: string[] = []
  let words = start
  return texts.map((text, i) => {
    const markup = balance(text, open)
    const piece: ArrivalPiece = { unit, markup, sep: seps[i], wordStart: words }
    words += shownWords(markup).length
    return piece
  })
}

/** A line as one piece. */
function whole(line: PageSource): ArrivalPiece {
  return { unit: line.unit, markup: line.markup, sep: '', wordStart: 0 }
}

/** A line split at its line breaks into paragraphs (blank ones dropped). */
export function splitParagraphs(line: PageSource): ArrivalPiece[] {
  const texts = line.markup.split('\n').filter((text) => text.trim())
  return piecesOf(
    line.unit,
    texts,
    texts.map((_text, i) => (i ? '\n' : '')),
    0,
  )
}

/** A piece split between its sentences; its separator is kept by the first and a space by the rest. */
export function splitSentences(piece: ArrivalPiece): ArrivalPiece[] {
  const texts = piece.markup.split(SENTENCE_END).filter((text) => text.trim())
  const parts = piecesOf(
    piece.unit,
    texts,
    texts.map((_text, i) => (i ? ' ' : piece.sep)),
    piece.wordStart,
  )
  return parts
}

/**
 * The pages of a part. Greedy: each page holds as many whole lines, in order,
 * as `fits` allows; a line too tall for a page of its own is cut between its
 * paragraphs, and a paragraph between its sentences; a sentence that still
 * does not fit gets a page of its own that scrolls.
 */
export function paginate(lines: PageSource[], fits: Fits): ArrivalPage[] {
  const pages: ArrivalPage[] = []
  let current: ArrivalPiece[] = []
  let scrolls = false

  /** Close the page being filled. */
  function close(): void {
    if (!current.length) return
    pages.push({
      pieces: current,
      firstUnit: current[0].unit,
      firstWord: current[0].wordStart,
      scrolls,
    })
    current = []
    scrolls = false
  }

  /** Put one piece on the page being filled; one too tall for a page alone is cut finer, by `cut`. */
  function place(
    piece: ArrivalPiece,
    cut: ((each: ArrivalPiece) => ArrivalPiece[])[],
  ): void {
    if (fits([...current, piece])) {
      current.push(piece)
      return
    }
    close()
    if (fits([piece])) {
      current.push(piece)
      return
    }
    for (let level = 0; level < cut.length; level++) {
      const finer = cut[level](piece)
      if (finer.length < 2) continue
      for (const each of finer) place(each, cut.slice(level + 1))
      return
    }
    // Taller than any page: it stands alone and scrolls.
    current.push(piece)
    scrolls = true
    close()
  }

  // A quote travels with the line that introduces its speaker, while both fit a page.
  const groups: PageSource[][] = []
  for (const line of lines) {
    if (line.joinsPrevious && groups.length)
      groups[groups.length - 1].push(line)
    else groups.push([line])
  }
  const cuts = [splitParagraphs, splitSentences]
  for (const group of groups) {
    const pieces = group.map(whole)
    if (pieces.length > 1) {
      if (fits([...current, ...pieces])) {
        current.push(...pieces)
        continue
      }
      close()
      if (fits(pieces)) {
        current.push(...pieces)
        continue
      }
    }
    for (const piece of pieces) place(piece, cuts)
  }
  close()
  return pages
}

/** What a page shows: its pieces of one line joined back into that line. */
export function pageLines(page: ArrivalPage): PageLine[] {
  const lines: PageLine[] = []
  for (const piece of page.pieces) {
    const last = lines[lines.length - 1]
    if (last && last.unit === piece.unit && piece.sep)
      last.markup += piece.sep + piece.markup
    else
      lines.push({
        unit: piece.unit,
        markup: piece.markup,
        wordStart: piece.wordStart,
      })
  }
  return lines
}
