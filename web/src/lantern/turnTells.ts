import type { Turn } from '@/stores/useGameStore'
import { parseTurn } from './parseTurn'
import { arrivesOnPicture, recordOnlyFrom } from './stageArrival'
import { toldAsSpeech } from './stageSpeech'

/**
 * Whether a turn has anything for the narration paper to tell: an answer (an
 * error reply too), an item or spell chip, a quest card or a room arrival.
 * This decides it for the phone's paper (`turnHasCard` does for the laptop's
 * cards); a turn that tells nothing shows no paper and no tab.
 */
export function turnTells(turn: Turn): boolean {
  return (
    turn.text.trim() !== '' ||
    !!turn.arrival ||
    turn.gained.length > 0 ||
    turn.lost.length > 0 ||
    (turn.quests?.length ?? 0) > 0
  )
}

/**
 * Whether a turn leaves something on the stage's narration paper, so it is
 * one of its cards (`StoryTurn` decides what each card shows): a room told on
 * the card (a look, a revisit, a load: not one told in the middle of the
 * picture), a block of the answer, or what the bag lost (its chips). Not the
 * command (it is not echoed), not quest news (the stage tells it in the
 * middle), not what the bag gained (it flies to its button), and not the
 * closing arrival lines of a talk that moved Elior (`recordOnlyFrom`).
 * With the speech told beside the paper (`speechBeside`, the two-sided
 * laptop) a character's quote told as speech (`toldAsSpeech`) is not the
 * paper's either; in the one column it is.
 */
export function turnHasCard(turn: Turn, speechBeside = false): boolean {
  if (turn.lost.length > 0) return true
  if (turn.arrival && !arrivesOnPicture(turn)) return true
  const blocks = parseTurn(turn.text)
  return blocks
    .slice(0, recordOnlyFrom(turn, blocks))
    .some((block) =>
      block.kind === 'checklist'
        ? block.items.length > 0
        : block.markup.trim() !== '' &&
          !(
            speechBeside &&
            block.kind === 'dialogue' &&
            !!block.speaker &&
            toldAsSpeech(turn)
          ),
    )
}

/**
 * Whether a turn clears the cards before it: one that moves to another room
 * (a load counts as one, see `LOADED_ROOM`) or a system arrival with no
 * command, such as the one that opens an act.
 */
export function startsFresh(turn: Turn): boolean {
  return turn.description?.moved === true || (!turn.command && !!turn.arrival)
}
