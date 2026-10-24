import { Character, type GameState, clue, dialogue } from '@/engine'
import {
  FLAG_ACT4_BADGE_SHOWN,
  FLAG_ACT4_HEARTS_TRUTH_CAST,
  FLAG_ACT4_STAFF_HEARD,
  FLAG_ACT4_WHISPERS_HEARD,
  FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED,
  FLAG_ACT4_SORCERESS_OF_LIES_STARTED,
  FLAG_ACT4_SORCERESS_TRUTH_ACQUIRED,
} from '../Act4StoryFlags'
import { SorceressTruth } from '../items/SorceressTruth'
import { CHAMBER_AFTER_REDEMPTION } from '../rooms/chamberDescriptions'
import { normaliseSpokenWord } from '../spokenWord'

/** What the chamber does the moment she is heard. */
const CRYSTALS_QUIET =
  'One by one the crystals stop whispering, until the chamber is silent for ' +
  'the first time in years.'

/** What she is called once she is redeemed. */
const UNMASKED_NAME = 'Unmasked Sorceress'

/** The hearts (hers, the staff's, the whispers') needed before the word works. */
const HEARTS_NEEDED = 3

/** The three speeches of the confession, in order. */
const CONFESSION = [
  'Elena. The girl at the inn. Malakar wanted every healer in the kingdom ' +
    "at her bedside and none at the king's. So I cursed her, and set my " +
    'mask on her wrist so they would know whose work it was, and fear it. ' +
    'And I watched the inn door, to see who would come for a mark like ' +
    'that. The healer from Willowbrook never did. I should have known ' +
    'then what that meant.',
  "I told the king's physicians he was only tired. I told the court he " +
    'had gone hunting. I have told so many lies that I forgot what my own ' +
    'voice sounds like. And I told you your parents sold you. Mine did. I ' +
    'wanted it to be true of everyone, so that it would not only be true of ' +
    'me.',
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

  /** How many of the chamber's three hearts (hers, the staff's, the whispers') Elior has heard. */
  heartsHeard(gameState: GameState): number {
    return [
      FLAG_ACT4_HEARTS_TRUTH_CAST,
      FLAG_ACT4_STAFF_HEARD,
      FLAG_ACT4_WHISPERS_HEARD,
    ].filter((flag) => gameState.getStoryFlag(flag)).length
  }

  /** Heart's Truth: shows her loneliness and the girl sold in a hungry winter (once); starts the quest like any meeting. */
  hearHeart(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_STARTED, true)
    if (gameState.getStoryFlag(FLAG_ACT4_HEARTS_TRUTH_CAST)) {
      return '[dim]You already hear her heart beneath the lies.[/dim]'
    }
    gameState.setStoryFlag(FLAG_ACT4_HEARTS_TRUTH_CAST, true)
    return [
      'The whispers fall away. Beneath them the Sorceress is alone, as she ' +
        'has always been: no one has ever spoken to her without a lie, and ' +
        'she has never answered with anything else.',
      'And under the loneliness, older and smaller: a girl in a hungry ' +
        'winter, and the parents who sold her for a sack of grain. She ' +
        'tells you the lie because she believes it. It is the only story ' +
        'about parents she has ever known.',
    ].join('\n')
  }

  /** Her look, which changes once she is redeemed. */
  override examine(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_STARTED, true)
    if (gameState.getStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED)) {
      return (
        "Without the chamber's glamour she looks tired and ordinary, a woman " +
        'who has not slept in years. She keeps her eyes on the arch.'
      )
    }
    return this.description
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

  /** Only "understanding" works, and only once the badge is shown and all three hearts are heard. */
  override sayTo(gameState: GameState, words: string): string {
    gameState.setStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_STARTED, true)
    if (gameState.getStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED)) {
      return '[dim]She has already been heard. She nods to you, once.[/dim]'
    }
    const word = normaliseSpokenWord(words)
    if (word !== 'understanding') return '[dim]The Sorceress only smiles.[/dim]'
    return this.understandBy(
      gameState,
      [
        dialogue(
          'Elior',
          'I understand. You have been alone in here a long time.',
        ),
        `The Sorceress goes very still. ${CRYSTALS_QUIET}`,
      ].join('\n'),
    )
  }

  /**
   * Listening in the chamber is understanding too: with the badge shown and
   * all three hearts heard, standing still and listening to her redeems her
   * as the word does. Before that, the same refusals as the word.
   */
  listenedTo(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_STARTED, true)
    if (gameState.getStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED)) {
      return '[dim]She has already been heard. The chamber is quiet.[/dim]'
    }
    return this.understandBy(
      gameState,
      'You say nothing. You stand in the middle of her chamber and ' +
        'listen, to all of it, for as long as it takes. The Sorceress ' +
        `goes very still. ${CRYSTALS_QUIET}`,
    )
  }

  /** The shared gates and the redemption, led in by what Elior did (ready-made lines): the word, or the listening. */
  private understandBy(gameState: GameState, lead: string): string {
    if (!gameState.getStoryFlag(FLAG_ACT4_BADGE_SHOWN)) {
      return clue(
        'She laughs, and the chamber laughs with her. Whatever you ' +
          'came to give her is lost among the whispers.',
      )
    }
    const heard = this.heartsHeard(gameState)
    if (heard > 0 && heard < HEARTS_NEEDED) {
      return clue(
        'You have heard some of her, but not all. There is more in ' +
          'this chamber that is hers to listen to.',
      )
    }
    if (heard === 0) {
      return clue(
        'You cannot answer a pain you cannot hear. Beneath the ' +
          'whispers her heart is saying something, too quietly for ears ' +
          'alone.',
      )
    }
    return this.redeem(gameState, lead)
  }

  /**
   * The redemption: the confession, then the mask, the completed quest, the
   * open arch and the changed chamber.
   */
  private redeem(gameState: GameState, lead: string): string {
    gameState.setStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED, true)
    gameState.setStoryFlag(FLAG_ACT4_SORCERESS_TRUTH_ACQUIRED, true)
    const confession = CONFESSION.map((speech) => dialogue(this.name, speech))
    this.name = UNMASKED_NAME

    gameState.addItemToInventory(new SorceressTruth())
    gameState.currentRoom.description = CHAMBER_AFTER_REDEMPTION

    return [
      lead,
      ...confession,
      'She lifts the silver mask from her staff and puts it in your hands.',
      "You received [item_name]Sorceress's Truth[/item_name]!",
    ].join('\n')
  }
}
