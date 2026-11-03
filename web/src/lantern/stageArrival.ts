import type { RoomDescription } from '@/engine'
import { narrationWords } from './narrationManifest'
import type { NarrationUnit } from './narrationUnits'
import { parseTurn, type TurnBlock } from './parseTurn'
import { blockVoice, NARRATOR } from './narrationScript'
import { SPELL_HEADING, type SpellNews } from './spellNews'
import {
  newQuestKicker,
  questCompleteKicker,
  type QuestNews,
} from './questNews'

/**
 * Telling a room's arrival on the picture (the laptop stage): which turns do
 * it, what its parts are and how long each is read when nobody narrates it.
 */

/** How fast an arrival is read when it is not narrated. */
export const ARRIVAL_WORDS_PER_SECOND = 4
/** No part is read for less than this long (seconds). */
export const ARRIVAL_MIN_SECONDS = 6
/** How long the arrival stays after the narrator has finished its last part (ms). */
export const ARRIVAL_CLEAR_AFTER_MS = 1500

/** One line of an arrival part, the narration unit it is spoken as, and its markup. */
export interface ArrivalLine {
  unit: number
  markup: string
  /** The narration words that come before the markup in its unit (the room's name before the description); 0 when absent. */
  wordBase?: number
  /** A speaker's quote: it stays on the page of the line before it, which introduces the speaker. */
  joinsPrevious?: true
}

/** One thing shown at a time on the picture: what happens on arrival, then the description. */
export interface ArrivalPart {
  kind: 'events' | 'description' | 'news'
  /** For `news`: the quest news this part tells. */
  news?: QuestNews
  /** For `news` that tells a learned spell: the spell (then `news` is absent). */
  spell?: SpellNews
  lines: ArrivalLine[]
  /** Whether the narrator speaks any of it (it has a recording). */
  voiced: boolean
  /** The first part of an arrival whose talk is told on the sides first (`sideBlocks`): it waits until those words are told. */
  afterWords?: true
}

/** How long a part is read when it is not narrated (ms). */
export function readingTimeMs(markup: string): number {
  const seconds = narrationWords(markup).length / ARRIVAL_WORDS_PER_SECOND
  return Math.max(ARRIVAL_MIN_SECONDS, Math.round(seconds)) * 1000
}

/**
 * Whether a turn's arrival is told on the picture: a player's move (or the
 * look that opens an act) into a room for the first time. A look, a revisit
 * and a load are not.
 */
export function arrivesOnPicture(turn: {
  narrate?: true
  description: RoomDescription | null
  arrival: unknown
}): boolean {
  const description = turn.description
  return (
    !!turn.narrate &&
    !!turn.arrival &&
    !!description &&
    description.moved &&
    description.firstVisit
  )
}

/**
 * How many of the answer's first blocks are told on the sides (the narrator's
 * card and the speech) before the arrival comes up in the middle. A talk that
 * takes Elior to another room (answering the dream's voice) is told as every
 * conversation is, up to the arrival lines it ends on ("You are in …"); any
 * other move tells its whole answer in the middle, so none.
 */
export function sideBlocks(
  turn: { addressed?: string },
  blocks: TurnBlock[],
): number {
  if (!turn.addressed) return 0
  let count = blocks.length
  while (count > 0 && blocks[count - 1].kind === 'event') count--
  return count
}

/**
 * Where the scene of a talk that took Elior to another room changes: the
 * narrator's last paragraph on the sides, which tells the move (the dream's
 * "The dark lets go of you…", Mira's "…traces a prism…"); a speaker's line
 * after it (Sir Cedric at the fortress gate) comes in the new room. Everything
 * before it is told over the old picture. -1 for any other turn, or a moving
 * talk with no narrator's paragraph on the sides.
 */
export function sceneBlock(
  turn: { addressed?: string; description: { moved: boolean } | null },
  blocks: TurnBlock[],
): number {
  if (!turn.description?.moved) return -1
  for (let i = sideBlocks(turn, blocks) - 1; i >= 0; i--)
    if (blockVoice(blocks[i])?.speaker === NARRATOR) return i
  return -1
}

/**
 * The parts of an arrival: the answer's words (a departure line, an event)
 * if there are any, then the room's description. A talk that moved Elior
 * leaves its words to the sides (`sideBlocks`), and its first part waits for
 * them (`afterWords`). `units` are the turn's narration units, to say which
 * part has a voice; the description is the unit after the answer's blocks.
 */
export function arrivalParts(
  turn: {
    text: string
    arrival: { description: string } | null
    addressed?: string
  },
  units: NarrationUnit[],
): ArrivalPart[] {
  const blocks = parseTurn(turn.text)
  const aside = sideBlocks(turn, blocks)
  /** Whether any line has a recording, from part `from` of its unit on. */
  const spoken = (lines: ArrivalLine[], from = 0): boolean =>
    lines.some((line) =>
      units[line.unit]?.parts.slice(from).some((part) => part.clip !== null),
    )
  const events: ArrivalLine[] = []
  blocks.forEach((block, unit) => {
    if (unit >= aside && block.kind !== 'checklist' && block.markup.trim())
      events.push(
        block.kind === 'dialogue'
          ? { unit, markup: block.markup, joinsPrevious: true }
          : { unit, markup: block.markup },
      )
  })
  const parts: ArrivalPart[] = []
  if (events.length)
    parts.push({ kind: 'events', lines: events, voiced: spoken(events) })
  if (turn.arrival) {
    const name = units[blocks.length]?.parts[0]?.markup ?? ''
    const lines = [
      {
        unit: blocks.length,
        markup: turn.arrival.description,
        wordBase: narrationWords(name).length,
      },
    ]
    // The unit's first part is the room's name, which the plate shows.
    parts.push({ kind: 'description', lines, voiced: spoken(lines, 1) })
  }
  if (aside > 0 && parts.length) parts[0].afterWords = true
  return parts
}

/** Whether a turn has news (a learned spell, quest news) to tell in the middle of the picture (on the stage, once its words are told). */
export function newsOnPicture(turn: {
  quests?: QuestNews[]
  spells?: SpellNews[]
}): boolean {
  return (turn.quests?.length ?? 0) + (turn.spells?.length ?? 0) > 0
}

/** The heading of a piece of quest news (the slim line has no count; the middle adds the act's count to a completion). */
export function newsSlimHeading(news: QuestNews): string {
  if (news.kind === 'updated') return 'Quest updated'
  return news.kind === 'new'
    ? newQuestKicker(news.main)
    : questCompleteKicker(news.main)
}

/**
 * The parts for a turn's news, one for each piece, after the answer's blocks
 * and the arrival: the learned spells first, in the order learned, then the
 * quest news. `units` are the turn's narration units, to say which piece has
 * a voice; a piece's unit is its heading, its name, then its text, so the
 * text's words start after the first two.
 */
export function newsParts(
  turn: {
    text: string
    arrival: unknown
    spells?: SpellNews[]
    quests?: QuestNews[]
  },
  units: NarrationUnit[],
): ArrivalPart[] {
  const first = parseTurn(turn.text).length + (turn.arrival ? 1 : 0)
  const spells = turn.spells ?? []
  const spoken = (unit: number): boolean =>
    !!units[unit]?.parts.some((part) => part.clip !== null)
  const told: ArrivalPart[] = spells.map((spell, index) => ({
    kind: 'news',
    spell,
    lines: [
      {
        unit: first + index,
        markup: spell.text,
        wordBase:
          narrationWords(SPELL_HEADING).length +
          narrationWords(spell.name).length,
      },
    ],
    voiced: spoken(first + index),
  }))
  for (const [index, news] of (turn.quests ?? []).entries()) {
    const unit = first + spells.length + index
    const heading = newsSlimHeading(news)
    told.push({
      kind: 'news',
      news,
      lines: [
        {
          unit,
          markup: news.text,
          wordBase:
            narrationWords(heading).length + narrationWords(news.name).length,
        },
      ],
      voiced: spoken(unit),
    })
  }
  return told
}
