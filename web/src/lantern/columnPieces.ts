/**
 * How one turn is told in the single column of a phone or a narrow window:
 * the pieces of the turn in the order they happened, like a play script. A
 * piece is either a narrator card (a run of the answer's blocks that no
 * character speaks) or one spoken line; the narrator's words come in the
 * column exactly where they happened between the lines. The command is typed
 * on the first card, or on a slim card of its own when the turn begins with
 * speech; item chips stay on the card that names them; the turn's news lines
 * come last, after the last spoken line.
 */
import type { Turn } from '@/stores/useGameStore'
import { arrivesOnPicture } from './stageArrival'
import { displayName } from './displayName'
import { eliorLine, speechLines, type SpeechLine } from './stageSpeech'
import type { TurnBlock } from './parseTurn'

/** A narrator card and what of the turn it carries. */
export interface CardPiece {
  kind: 'card'
  /** Indexes of the answer's blocks it tells, in order. */
  blocks: number[]
  /** It starts with the command as typed. */
  command: boolean
  /** It tells the room as a bare description. */
  arrival: boolean
  /** It carries the item and spell chips. */
  chips: boolean
  /** It carries the turn's quest news (slim lines or cards). */
  news: boolean
}

/** One spoken line of the turn. */
export interface LinePiece {
  kind: 'line'
  line: SpeechLine
}

/** A piece of a turn in the column. */
export type ColumnPiece = CardPiece | LinePiece

/** Any markup tag. */
const TAGS = /\[\/?[a-z_]+\]/g

/** A new, empty card. */
function emptyCard(): CardPiece {
  return {
    kind: 'card',
    blocks: [],
    command: false,
    arrival: false,
    chips: false,
    news: false,
  }
}

/** The plain, lower-case words a block tells, to find the item it names. */
function plain(block: TurnBlock | undefined): string {
  if (!block) return ''
  const markup =
    block.kind === 'checklist'
      ? block.items.map((item) => item.markup).join(' ')
      : block.markup
  return markup.replace(TAGS, '').toLowerCase()
}

/**
 * The pieces of `turn` (whose answer is `blocks`) in the order they happened.
 * The quotes of a conversation turn (one that addresses someone and stays in
 * the room) are lines, Elior's own words first; in any other turn they stay on
 * the narrator's cards.
 */
export function columnPieces(turn: Turn, blocks: TurnBlock[]): ColumnPiece[] {
  const talking = !!turn.addressed && turn.description?.moved !== true
  const pieces: ColumnPiece[] = []
  const own = talking ? eliorLine(turn.command) : null
  if (own) pieces.push({ kind: 'line', line: own })
  const lines = talking ? speechLines(blocks) : []
  const lastCard = (): CardPiece | undefined => {
    const last = pieces.at(-1)
    return last?.kind === 'card' ? last : undefined
  }
  blocks.forEach((_block, index) => {
    const mine = lines.filter((line) => line.unit === index)
    if (mine.length) {
      for (const line of mine) pieces.push({ kind: 'line', line })
      return
    }
    let card = lastCard()
    if (!card) pieces.push((card = emptyCard()))
    card.blocks.push(index)
  })
  if (turn.arrival && !arrivesOnPicture(turn)) {
    let card = lastCard()
    if (!card) pieces.push((card = emptyCard()))
    card.arrival = true
  }
  if (turn.command !== null) {
    const first = pieces[0]
    if (first?.kind === 'card') first.command = true
    else pieces.unshift({ ...emptyCard(), command: true })
  }
  const chips = [...turn.gained, ...turn.lost]
  if (chips.length) {
    const cards = pieces.filter((p): p is CardPiece => p.kind === 'card')
    const names = chips.map((chip) => displayName(chip.name).toLowerCase())
    const text = (card: CardPiece): string =>
      card.blocks.map((index) => plain(blocks[index])).join(' ')
    const naming = cards.filter((card) =>
      names.some((name) => text(card).includes(name)),
    )
    let target = naming.at(-1) ?? cards.at(-1)
    if (!target) pieces.push((target = emptyCard()))
    target.chips = true
  }
  if ((turn.quests?.length ?? 0) > 0) {
    let card = lastCard()
    if (!card) pieces.push((card = emptyCard()))
    card.news = true
  }
  return pieces
}
