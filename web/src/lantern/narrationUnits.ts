/**
 * What the story view narrates in one turn, in the order it shows it.
 *
 * A turn is a list of units: one per block of the answer (index-aligned with
 * `parseTurn`, so the view finds unit `i` for block `i`), then the room
 * name and description of an arrival, then one unit per quest card. A unit is
 * made of parts, each a voiced line (`blockVoice`, `arrivalBlocks`,
 * `newQuestBlocks`, `questCompleteBlocks`) with its
 * recording or none. A unit with no part is silent: events, plain failures,
 * checklists, a revisited room and a quest update appear at once; a new
 * room, a room looked at again, a new quest's card and a completed quest's
 * record are read.
 */

import type { QuestNews } from './questNews'
import {
  findClip,
  type NarrationClip,
  type NarrationManifest,
} from './narrationManifest'
import {
  arrivalBlocks,
  blockVoice,
  chapterHeading,
  newQuestBlocks,
  questCompleteBlocks,
} from './narrationScript'
import { parseTurn } from './parseTurn'

/** One voiced line of a unit: its markup, and the recording if the manifest has one. */
export interface NarrationPart {
  markup: string
  clip: NarrationClip | null
}

/** The breath before a new scene: a room arrival, or a chapter page's text after its heading (ms). */
export const SCENE_PAUSE_MS = 1000

/** One thing the view reveals at a time: an answer's block, an arrival's description or a quest card. */
export interface NarrationUnit {
  kind: 'block' | 'arrival' | 'quest'
  /** The lines spoken in turn; empty when the unit is silent. */
  parts: NarrationPart[]
  /** A longer pause before the unit is shown and read (ms), counted from the last voice. */
  pauseBefore?: number
}

/** The parts of a turn the narration reads: its answer, the arrival (if any) and quest news. */
export interface NarratedTurnInput {
  text: string
  arrival: { room: string; description: string } | null
  quests?: QuestNews[]
}

/** A part for each voiced block, with its recording if there is one. */
function partsOf(
  blocks: { speaker: string; markup: string }[],
  manifest: NarrationManifest,
): NarrationPart[] {
  return blocks.map((block) => ({
    markup: block.markup,
    clip: findClip(manifest, block.speaker, block.markup),
  }))
}

/** The unit of a turn's first quest card: after its answer's blocks and its arrival. */
export function firstQuestUnit(turn: NarratedTurnInput): number {
  return parseTurn(turn.text).length + (turn.arrival ? 1 : 0)
}

/**
 * Whether a turn's arrival is read: on a first visit, or when the player
 * looked around; a revisited room appears at once.
 */
export function readsArrival(turn: {
  firstVisit?: true
  lookedAround?: true
}): boolean {
  return Boolean(turn.firstVisit || turn.lookedAround)
}

/**
 * The units of a turn. `firstVisit` says whether its arrival is read (see
 * `readsArrival`; only then are the room's name and description voiced).
 */
export function turnUnits(
  turn: NarratedTurnInput,
  firstVisit: boolean,
  manifest: NarrationManifest,
): NarrationUnit[] {
  const units: NarrationUnit[] = parseTurn(turn.text).map((block) => {
    const voice = blockVoice(block)
    return {
      kind: 'block',
      parts: voice ? partsOf([voice], manifest) : [],
    }
  })
  if (turn.arrival)
    units.push({
      kind: 'arrival',
      pauseBefore: SCENE_PAUSE_MS,
      parts: firstVisit
        ? partsOf(
            arrivalBlocks(turn.arrival.room, turn.arrival.description),
            manifest,
          )
        : [],
    })
  for (const news of turn.quests ?? [])
    units.push({
      kind: 'quest',
      parts:
        news.kind === 'new'
          ? partsOf(newQuestBlocks(news), manifest)
          : news.kind === 'completed'
            ? partsOf(questCompleteBlocks(news), manifest)
            : [],
    })
  return units
}

/** The `turnId` the store narrates the open pop-up (chapter page or quest-complete) under; story turns count from 1. */
export const POPUP_NARRATION_ID = -1

/** A chapter page as the narration reads it. */
export interface NarratedChapter {
  kind: 'intro' | 'complete'
  /** "Act I". */
  act: string
  /** "The Call to Adventure". */
  title: string
  /** Engine markup: the intro text, or the act-complete text. */
  body: string
}

/**
 * The units of a chapter page: unit 0 is its title (read as the page's
 * heading: an intro's "Act I: The Call to Adventure", a completion's "Act I
 * complete. The Call to Adventure."; with no recording it shows at once),
 * then one unit per block of the body, index-aligned with `parseTurn` so the
 * page finds unit `i + 1` for block `i`.
 */
export function chapterUnits(
  chapter: NarratedChapter,
  manifest: NarrationManifest,
): NarrationUnit[] {
  const voice = chapterHeading(chapter.kind, chapter.act, chapter.title)
  const heading = voice ? partsOf([voice], manifest) : []
  return [
    { kind: 'block', parts: heading },
    ...parseTurn(chapter.body).map((block, index): NarrationUnit => {
      const voice = blockVoice(block)
      const unit: NarrationUnit = {
        kind: 'block',
        parts: voice ? partsOf([voice], manifest) : [],
      }
      // The text starts after a breath once the heading has been read (a
      // heading with no recording shows at once and nothing waits for it).
      if (index === 0 && heading[0]?.clip) unit.pauseBefore = SCENE_PAUSE_MS
      return unit
    }),
  ]
}
