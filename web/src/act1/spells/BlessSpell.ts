import {
  Spell,
  type Character,
  type GameState,
  event,
  characterName,
} from '@/engine'
import { Priest } from '../characters/Priest'
import {
  FLAG_JOURNEY_BLESS_COMPLETED,
  FLAG_PRIEST_BLESSED,
} from '../Act1StoryFlags'

/** Divine incantation granting temporary protection and strength to a target. */
export class BlessSpell extends Spell {
  constructor() {
    super({
      id: 'bless',
      name: 'bless',
      description:
        'A divine incantation that offers protection and strength to the caster.',
    })
  }

  /** Bless Elior himself, readying him for the journey. */
  override castSpell(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_JOURNEY_BLESS_COMPLETED, true)
    return (
      event('You cast [spell_name]bless[/spell_name] on yourself.') +
      '\n' +
      'Your resolve is strengthened, and you feel more prepared for the ' +
      'challenges that lie ahead on your journey.'
    )
  }

  /** Bless another character; the priest remembers being blessed. */
  override castOnCharacter(gameState: GameState, character: Character): string {
    if (character instanceof Priest)
      gameState.setStoryFlag(FLAG_PRIEST_BLESSED, true)
    const name = character.name
    return (
      event(
        'You cast [spell_name]bless[/spell_name] on ' +
          `${characterName(name)}.`,
      ) +
      '\nA divine light surrounds ' +
      `${characterName(name)}, and they seem ` +
      'strengthened and more resolute.'
    )
  }
}
