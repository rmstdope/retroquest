import { Character, type GameState, type Item, dialogue } from '@/engine'
import {
  FLAG_ACT4_CEDRIC_FORGAVE,
  FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED,
  FLAG_ACT4_KNIGHT_SEEN_THROUGH,
} from '../Act4StoryFlags'
import { endingPlayed } from '../endings'
import { KnightsRedemption } from '../items/KnightsRedemption'
import { CEDRIC_ON_STAIR } from '../rooms/hallDescriptions'

/**
 * Sir Cedric in the Hall of Echoes, by the south door. He has followed Elior
 * in and faces the knight who framed him. Everything he says or shows follows
 * the story flags (the knight seen through, redeemed, forgiven, the ending), so his state
 * needs no fields and survives a save by itself.
 */
export class SirCedricInTheHall extends Character {
  constructor() {
    super({
      name: 'Sir Cedric',
      description: 'Sir Cedric, by the south door, his eyes on the knight.',
    })
  }

  /** Also answers to "cedric". */
  override answersTo(name: string): boolean {
    return super.answersTo(name) || name.toLowerCase() === 'cedric'
  }

  /** By the south door, or sitting on the stair once he has forgiven. */
  override examine(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT4_CEDRIC_FORGAVE)) return CEDRIC_ON_STAIR
    return this.description
  }

  /** What he says follows what he knows of the knight, what he chose, and whether it is over. */
  override talkTo(gameState: GameState): string {
    if (endingPlayed(gameState)) {
      return dialogue(
        this.name,
        gameState.getStoryFlag(FLAG_ACT4_CEDRIC_FORGAVE)
          ? 'It is done, then. I can see it on you. We will sit a while yet, ' +
              'he and I. Then I will see him out of here. You have my word.'
          : 'It is done, then. I can see it on you. I will keep an eye on ' +
              'him until the king sends for him. You have my word.',
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT4_CEDRIC_FORGAVE)) {
      return dialogue(
        this.name,
        'Go on up. I will wait here with him. Someone should.',
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED)) {
      return dialogue(this.name, 'Go on up. I will keep an eye on him.')
    }
    if (gameState.getStoryFlag(FLAG_ACT4_KNIGHT_SEEN_THROUGH)) {
      return dialogue(
        this.name,
        'Grey cloak, twisted rune. I know him now. Do what you came to do. I ' +
          'will hear what he has to say.',
      )
    }
    return dialogue(
      this.name,
      "That voice. I have heard it before, Elior, on the king's walls. I " +
        'would swear to it. I cannot see the face that goes with it.',
    )
  }

  /** The knight's badge went to Elior, and he leaves it there. */
  override giveItem(gameState: GameState, item: Item): string {
    if (!(item instanceof KnightsRedemption)) {
      return super.giveItem(gameState, item)
    }
    return dialogue(
      this.name,
      'He gave that to you, not to me. Keep it. What he owed me he said to ' +
        'my face.',
    )
  }
}
