/**
 * What characters say on the room's picture: the pure parts. A turn's answer
 * becomes the lines of the speech thread (`speechLines`), each on the side of
 * its speaker; `speakerColor` gives a name its steady card colour, and
 * `readingPauseMs` is how long a line is read before the next one appears
 * when no narrator reads it. The conversation itself is kept by
 * `useStageSpeechStore`.
 */
import { balance, type TurnBlock } from './parseTurn'
import { displayName } from './displayName'
import { narrationWords } from './narrationManifest'

/** The name Elior's own words are shown under. */
export const ELIOR = 'Elior'

/** One line of the speech thread. */
export interface SpeechLine {
  /** The block of the answer it comes from, which is its narration unit (as `turnUnits`). */
  unit: number
  /** The speaker's name as the game shows it. */
  speaker: string
  /** Elior speaks from the left, everyone else from the right. */
  side: 'left' | 'right'
  /** The words, as engine markup, balanced on their own. */
  markup: string
  /** How many narrated words of the quote come before this paragraph (0 for the first). */
  firstWord: number
}

/** A line break between paragraphs (the game writes them with one or with a blank line). */
const PARAGRAPH_BREAK = /\n+/

/**
 * The lines of a turn's picture, in the order they were said: one for each
 * paragraph of each quote a character says. A quote nobody names (a letter, a
 * sign, the game's own "You say … to …") is writing, not speech, and is left
 * to the story.
 */
export function speechLines(blocks: TurnBlock[]): SpeechLine[] {
  const lines: SpeechLine[] = []
  blocks.forEach((block, unit) => {
    if (block.kind !== 'dialogue' || !block.speaker) return
    const speaker = displayName(block.speaker)
    const side = speaker === ELIOR ? 'left' : 'right'
    const open: string[] = []
    let firstWord = 0
    for (const paragraph of block.markup.split(PARAGRAPH_BREAK)) {
      if (!paragraph.trim()) continue
      lines.push({
        unit,
        speaker,
        side,
        markup: balance(paragraph.trim(), open),
        firstWord,
      })
      firstWord += narrationWords(paragraph).length
    }
  })
  return lines
}

/** The "say <words> to <character>" command: what Elior says, and to whom. */
const SAY_COMMAND = /^\s*say\s+(.+?)\s+to\s+\S/i

/**
 * Elior's own line when the command was `say <words> to <someone>`: the words
 * as he typed them, said before anyone answers. It belongs to no block of the
 * answer, so its unit is -1. Null for any other command.
 */
export function eliorLine(command: string | null): SpeechLine | null {
  const words = command ? SAY_COMMAND.exec(command)?.[1]?.trim() : undefined
  return words
    ? { unit: -1, speaker: ELIOR, side: 'left', markup: words, firstWord: 0 }
    : null
}

/** Elior's card colour, as drawn. */
const ELIOR_COLOR = '#c47a1a'

/** Deep hues that carry white text at 4.5:1. */
const PALETTE = [
  '#8a5a9e',
  '#4b6fa8',
  '#2f7a62',
  '#a1523c',
  '#66701f',
  '#a34a78',
  '#3f6f8f',
  '#7b5e3b',
]

/** The steady colour of a character's stand-in card, chosen from the name alone. */
export function speakerColor(name: string): string {
  const key = name.trim().toLowerCase()
  if (key === ELIOR.toLowerCase()) return ELIOR_COLOR
  let hash = 0
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

/** Any markup tag, which takes no reading time. */
const TAGS = /\[\/?[a-z_]+\]/g

/** The pause before the next line when nothing is read aloud: by the length of the words, 0.9 to 6 seconds. */
export function readingPauseMs(markup: string): number {
  const length = markup.replace(TAGS, '').length
  return Math.min(6000, Math.max(900, 600 + 35 * length))
}

/**
 * Which lines head a run of one speaker (the ones that carry the name and the
 * portrait), given each line's speaker and the index of the first line still
 * showing at the top of the picture. Lines before it have left; a run whose
 * first line has left is headed by its first line still showing.
 */
export function runHeads(speakers: string[], firstShowing: number): boolean[] {
  return speakers.map(
    (speaker, index) =>
      index >= firstShowing &&
      (index === firstShowing || speakers[index - 1] !== speaker),
  )
}
