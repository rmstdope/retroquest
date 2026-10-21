import { Character, type GameState, dialogue, event } from '@/engine'
import {
  FLAG_ACT4_BADGE_SHOWN,
  FLAG_ACT4_HEARTS_TRUTH_CAST,
  FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED,
  FLAG_ACT4_SORCERESS_OF_LIES_STARTED,
  FLAG_ACT4_SORCERESS_TRUTH_ACQUIRED,
} from '../Act4StoryFlags'
import { SorceressTruth } from '../items/SorceressTruth'
import { CHAMBER_AFTER_REDEMPTION } from '../rooms/chamberDescriptions'

/** What she is called once she is redeemed. */
const UNMASKED_NAME = 'Unmasked Sorceress'

/** The three speeches of the confession, in order. */
const CONFESSION = [
  'Elena. The girl at the inn. Malakar wanted every healer in the kingdom ' +
    "at her bedside and none at the king's. So I cursed her, and set my " +
    'mask on her wrist so they would know whose work it was, and fear it.',
  "I told the king's physicians he was only tired. I told the court he " +
    'had gone hunting. I have told so many lies that I forgot what my own ' +
    'voice sounds like.',
  'No one has ever spoken to me without a lie. Not Malakar, not his ' +
    'servants, not the ones I cursed. You are the first. I did not know it ' +
    'would hurt.',
]

/**
 * The Sorceress of Lies, who holds the Chamber of Whispers. The knight's badge
 * and Heart's Truth let Elior hear her loneliness; the word "understanding"
 * redeems her, and she stays by the open arch as the Unmasked Sorceress.
 */
export class SorceressOfLies extends Character {
  constructor() {
    super({
      name: 'Sorceress of Lies',
      description:
        'She is beautiful in the way the chamber is beautiful: a little too ' +
        'perfect, a little wrong. Her smile never reaches her eyes.',
    })
  }

  /** Also answers to "sorceress" and "unmasked sorceress", whatever her name is now. */
  override answersTo(name: string): boolean {
    return (
      super.answersTo(name) ||
      ['sorceress', 'sorceress of lies', 'unmasked sorceress'].includes(
        name.toLowerCase(),
      )
    )
  }

  /** Heart's Truth: shows her loneliness (once); starts the quest like any meeting. */
  hearHeart(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_STARTED, true)
    if (gameState.getStoryFlag(FLAG_ACT4_HEARTS_TRUTH_CAST)) {
      return '[dim]You already hear her heart beneath the lies.[/dim]'
    }
    gameState.setStoryFlag(FLAG_ACT4_HEARTS_TRUTH_CAST, true)
    return event(
      'The whispers fall away. Beneath them the Sorceress is alone, as she ' +
        'has always been: no one has ever spoken to her without a lie, and ' +
        'she has never answered with anything else.',
    )
  }

  /** Her look, which changes once she is redeemed. */
  override examine(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_STARTED, true)
    if (gameState.getStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED)) {
      return event(
        "Without the chamber's glamour she looks tired and ordinary, a woman " +
          'who has not slept in years. She keeps her eyes on the arch.',
      )
    }
    return event(this.description)
  }

  /** What she says changes as the badge is shown and she is redeemed. */
  override talkTo(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_STARTED, true)
    if (gameState.getStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED)) {
      return dialogue(
        this.name,
        'Go on, through the arch. What waits there has been waiting for you ' +
          'longer than I have. And Elior — tell Elena I am sorry. It is the ' +
          'first true thing I have asked anyone to carry.',
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT4_BADGE_SHOWN)) {
      return dialogue(
        this.name,
        'He turned? Then he is a fool. Everyone lies, little Elior. No one ' +
          'has ever understood a word I said. Why would you be the first?',
      )
    }
    return dialogue(
      this.name,
      'Little Elior. Your parents sold you to save themselves, did you know? ' +
        'Malakar told me so himself. Turn back.',
    )
  }

  /** Only "understanding" works, and only once the badge is shown and her heart heard. */
  override sayTo(gameState: GameState, words: string): string {
    gameState.setStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_STARTED, true)
    if (gameState.getStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED)) {
      return '[dim]She has already been heard. She nods to you, once.[/dim]'
    }
    const word = words
      .trim()
      .replace(/^['"]|['"]$/g, '')
      .toLowerCase()
    if (word !== 'understanding') return '[dim]The Sorceress only smiles.[/dim]'
    if (!gameState.getStoryFlag(FLAG_ACT4_BADGE_SHOWN)) {
      return (
        '[failure]She laughs, and the chamber laughs with her. Your word is ' +
        'lost among the whispers.[/failure]'
      )
    }
    if (!gameState.getStoryFlag(FLAG_ACT4_HEARTS_TRUTH_CAST)) {
      return (
        '[failure]You cannot answer a pain you cannot hear. Listen to her ' +
        'first.[/failure]'
      )
    }
    return this.redeem(gameState)
  }

  /**
   * The redemption: the confession, then the mask, the completed quest, the
   * open arch and the changed chamber.
   */
  private redeem(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED, true)
    gameState.setStoryFlag(FLAG_ACT4_SORCERESS_TRUTH_ACQUIRED, true)
    const confession = CONFESSION.map((speech) => dialogue(this.name, speech))
    this.name = UNMASKED_NAME

    gameState.addItemToInventory(new SorceressTruth())
    gameState.currentRoom.description = CHAMBER_AFTER_REDEMPTION

    return [
      event(
        '“I understand,” you say. “You have been alone in here a long ' +
          'time.” The Sorceress goes very still. One by one the crystals ' +
          'stop whispering, until the chamber is silent for the first time ' +
          'in years.',
      ),
      ...confession,
      event(
        'She lifts the silver mask from her staff and puts it in your hands.',
      ),
      event("You received [item_name]Sorceress's Truth[/item_name]!"),
    ].join('\n')
  }
}
