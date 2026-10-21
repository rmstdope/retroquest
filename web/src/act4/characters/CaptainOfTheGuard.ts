import { Character, type GameState, characterName, speech } from '@/engine'
import {
  FLAG_ACT4_CAPTAIN_MAN_IN_GREY_TOLD,
  FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED,
  FLAG_ACT4_SERVANTS_FREED,
} from '../Act4StoryFlags'

/**
 * A captain of King Alden's royal guard, enthralled in the Outer Courtyard.
 * Optional lore: the blessing that frees the servants also wakes him, and his
 * line changes from muddled to clear. He gives no item and opens nothing.
 */
export class CaptainOfTheGuard extends Character {
  constructor() {
    super({
      name: 'Captain of the Guard',
      description:
        'A captain of the royal guard, his tabard black with soot. His eyes are ' +
        'open but see nothing, and his hand rests on a sword he has forgotten ' +
        'how to draw.',
    })
  }

  /** Also answers to "captain". */
  override answersTo(name: string): boolean {
    return super.answersTo(name) || name.toLowerCase() === 'captain'
  }

  /** Return the captain's words, muddled while enthralled and clear once freed;
   * the first clear talk after the knight's redemption adds the man in grey. */
  override talkTo(gameState: GameState): string {
    const name = characterName(this.name)
    if (!gameState.getStoryFlag(FLAG_ACT4_SERVANTS_FREED)) {
      return (
        `The ${name} stares through you. ` +
        speech(
          "'I held the gate for King Alden once. Now I hold it for... " +
            "I cannot remember.'",
        )
      )
    }
    let line =
      "'I remember now. King Alden used to walk the walls at night and talk " +
      'to whoever was on them. That is how they got him. Cedric stood his ' +
      'post — it was shadows that came for Alden, not any blade of ours. If ' +
      'you see Sir Cedric again, tell him I am sorry I ever doubted him.'
    if (
      gameState.getStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED) &&
      !gameState.getStoryFlag(FLAG_ACT4_CAPTAIN_MAN_IN_GREY_TOLD)
    ) {
      gameState.setStoryFlag(FLAG_ACT4_CAPTAIN_MAN_IN_GREY_TOLD, true)
      line +=
        ' A man in grey came through here while you were gone, on his knees. ' +
        'He asked my name. I told him.'
    }
    return (
      `The ${name} lifts his head and meets your eyes. ` + speech(`${line}'`)
    )
  }
}
