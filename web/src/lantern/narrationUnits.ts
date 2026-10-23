/**
 * What the story view narrates in one turn, in the order it shows it.
 *
 * A turn is a list of units: one per block of the answer (index-aligned with
 * `parseTurn`, so the view finds unit `i` for block `i`), then the room
 * description of an arrival, then one unit per quest card. A unit is made of
 * parts, each a voiced line (`blockVoice`, `questCardBlocks`) with its
 * recording or none. A unit with no part is silent: events, failures,
 * checklists, a revisited room and quest records other than a new quest's
 * card appear at once.
 */

import type { QuestNews } from './questNews'
import {
  findClip,
  type NarrationClip,
  type NarrationManifest,
} from './narrationManifest'
import { blockVoice, questCardBlocks, turnBlocks } from './narrationScript'
import { parseTurn } from './parseTurn'

/** One voiced line of a unit: its markup, and the recording if the manifest has one. */
export interface NarrationPart {
  markup: string
  clip: NarrationClip | null
}

/** One thing the view reveals at a time: an answer's block, an arrival's description or a quest card. */
export interface NarrationUnit {
  kind: 'block' | 'arrival' | 'quest'
  /** The lines spoken in turn; empty when the unit is silent. */
  parts: NarrationPart[]
}

/** The parts of a turn the narration reads: its answer, the arrival (if any) and quest news. */
export interface NarratedTurnInput {
  text: string
  arrival: { description: string } | null
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

/**
 * The units of a turn. `firstVisit` says whether the room it arrives in is new
 * to the player (only then is the description read).
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
      parts: firstVisit
        ? partsOf(turnBlocks(turn.arrival.description), manifest)
        : [],
    })
  for (const news of turn.quests ?? [])
    units.push({
      kind: 'quest',
      parts:
        news.kind === 'new'
          ? partsOf(questCardBlocks(news.text), manifest)
          : [],
    })
  return units
}
