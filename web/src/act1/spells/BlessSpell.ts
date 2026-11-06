import { Spell, type Character, type GameState, characterName } from '@/engine'
import { Priest } from '../characters/Priest'
import {
  FLAG_JOURNEY_BLESS_COMPLETED,
  FLAG_PRIEST_BLESSED,
} from '../Act1StoryFlags'

/** The priest's blessing, remembered: gives strength to Elior or another character. */
export class BlessSpell extends Spell {
  constructor() {
    super({
      id: 'bless',
      name: 'bless',
      description:
        `The blessing the ${characterName('priest')} said over you when you found the ` +
        "founders' locket.",
    })
  }

  /** Give a spell known in an older save the current description, which colours who taught it. */
  override refreshSavedText(): void {
    this.description = new BlessSpell().description
  }

  /** Bless Elior himself, readying him for the journey. */
  override castSpell(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_JOURNEY_BLESS_COMPLETED, true)
    return (
      'A quiet warmth settles on your shoulders and stays, the way the ' +
      `${characterName('priest')}'s hand did.`
    )
  }

  /** Bless another character; the priest remembers being blessed. */
  override castOnCharacter(gameState: GameState, character: Character): string {
    if (character instanceof Priest)
      gameState.setStoryFlag(FLAG_PRIEST_BLESSED, true)
    return (
      `A divine light surrounds ${character.nameInSentence()} ` +
      'and leaves strength and resolve behind.'
    )
  }
}
