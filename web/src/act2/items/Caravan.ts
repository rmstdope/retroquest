import { Item, type GameState, clue, dialogue } from '@/engine'
import { FLAG_MERCHANTS_HEALED } from '../Act2StoryFlags'

/** A large rescued merchant caravan object; non-carriable but interactive. */
export class Caravan extends Item {
  constructor() {
    super({
      name: 'caravan',
      shortName: 'caravan',
      description:
        'The rescued merchants, battered and footsore. Several of them ' +
        'huddle beside the goods they carried up, grateful to be alive. Their ' +
        'faces show relief mixed with exhaustion from their ordeal in the ' +
        'ravine. Crates of goods are scattered around, some damaged but ' +
        'most salvageable.',
      canBeCarried: false, // A caravan is too large to carry
    })
  }

  /** Also answers to "merchants", the word the greater heal is cast on. */
  override otherNames(): string[] {
    return ['merchants']
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

  /** Describe the rescued merchants and the goods they carried up; the wagon stayed in the ravine. */
  override examine(_gameState: GameState): string {
    return (
      'The merchant caravan is in rough shape but the people are safe. The ' +
      'wagon is still at the bottom of the ravine, on its side; what they own ' +
      'now is what they carried up the rope. Several merchants tend to minor ' +
      'injuries while sorting through those goods. You see spice containers, ' +
      'bolts of fine cloth, and various trade items. ' +
      'The merchants look at you with deep gratitude—you clearly ' +
      'saved their lives.'
    )
  }
}
