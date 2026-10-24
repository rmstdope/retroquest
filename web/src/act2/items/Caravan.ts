import { Item, type GameState, clue, dialogue } from '@/engine'
import { FLAG_MERCHANTS_HEALED } from '../Act2StoryFlags'

/** A large rescued merchant caravan object; non-carriable but interactive. */
export class Caravan extends Item {
  constructor() {
    super({
      name: 'caravan',
      shortName: 'caravan',
      description:
        'The rescued merchant caravan, battered but intact. Several merchants ' +
        'huddle around their damaged wagon, grateful to be alive. Their ' +
        'faces show relief mixed with exhaustion from their ordeal in the ' +
        'ravine. Crates of goods are scattered around, some damaged but ' +
        'most salvageable.',
      canBeCarried: false, // A caravan is too large to carry
    })
  }

  /** Also answers to "merchants", the word the greater heal is cast on. */
  override answersTo(name: string): boolean {
    return super.answersTo(name) || name.toLowerCase() === 'merchants'
  }

  /**
   * Greater heal on the rescued merchants: an optional moment. The first cast
   * heals them and an unnamed spice trader speaks for the group; later casts
   * get a short dim refusal. No virtue is recorded.
   */
  receiveGreaterHeal(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_MERCHANTS_HEALED)) {
      return clue(
        'The merchants are already on the mend. A spice trader waves ' +
          'you off: "Save it for someone who needs it."',
      )
    }
    gameState.setStoryFlag(FLAG_MERCHANTS_HEALED, true)
    return (
      '[success]Golden light settles on split lips and wrenched ankles, ' +
      'and one by one the merchants stop wincing.[/success]' +
      '\n\n' +
      'A spice trader flexes a hand she has been cradling since the ravine.' +
      '\n\n' +
      dialogue(
        'Spice trader',
        "Three days down there and I'd stopped feeling these fingers. " +
          'Tell Thorne he owes you twice now.',
      )
    )
  }

  /** Describe the state of the caravan and the grateful merchants. */
  override examine(_gameState: GameState): string {
    return (
      "The merchant caravan is in rough shape but the people are safe. The wagon's " +
      'wheels are cracked and the canvas cover is torn, but the structure is ' +
      'sound. Several merchants tend to minor injuries while sorting through ' +
      'their goods. You see spice containers, bolts of fine cloth, and various ' +
      'trade items. The merchants look at you with deep gratitude—you clearly ' +
      'saved their lives.'
    )
  }
}
