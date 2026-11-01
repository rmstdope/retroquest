import type { Turn } from '@/stores/useGameStore'
import { arrivesOnPicture } from './stageArrival'

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
 * Whether a turn leaves a narration card on the laptop stage: any command the
 * player typed (a turn where only someone speaks gets a slim card with just
 * the command), or anything the turn tells other than a room told in the
 * middle of the picture (the arrival that opens an act leaves no card).
 */
export function turnHasCard(turn: Turn): boolean {
  if (turn.command !== null) return true
  if (!arrivesOnPicture(turn)) return turnTells(turn)
  return (
    turn.text.trim() !== '' ||
    turn.gained.length > 0 ||
    turn.lost.length > 0 ||
    (turn.quests?.length ?? 0) > 0
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
