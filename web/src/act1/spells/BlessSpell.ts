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
        'The blessing the priest said over you when you found the ' +
        "founders' locket.",
    })
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
    const name = character.name
    return (
      'A divine light surrounds ' +
      `${characterName(name)}, and they seem ` +
      'strengthened and more resolute.'
    )
  }
}
