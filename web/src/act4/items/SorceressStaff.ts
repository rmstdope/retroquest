import { Item, type GameState, event } from '@/engine'
import {
  FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED,
  FLAG_ACT4_SORCERESS_OF_LIES_STARTED,
} from '../Act4StoryFlags'

/** The Sorceress's staff: crowned with the silver mask until she is redeemed. */
export class SorceressStaff extends Item {
  constructor() {
    super({
      name: 'Staff',
      description:
        'The mask is smooth and smiling, with no eyes behind it. It is the ' +
        "very mark that sat beneath Elena's curse in Greendale. This is the " +
        'hand that cursed her.',
    })
  }

  /** Also answers to "sorceress's staff". */
  override answersTo(name: string): boolean {
    return super.answersTo(name) || name.toLowerCase() === "sorceress's staff"
  }

  /** Looking at the staff starts the quest; it is bare once she is redeemed. */
  /** The mask on the staff makes no sound; what it hides wants more than ears. */
  override listen(_gameState: GameState): string {
    return (
      'The silver mask makes no sound at all. Whatever it is hiding wants ' +
      'more than ears.'
    )
  }

  override examine(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_STARTED, true)
    if (gameState.getStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED)) {
      return event(
        'Her staff lies across her knees, bare where the mask once sat.',
      )
    }
    return event(this.description)
  }
}
