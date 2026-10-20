import { Spell, type Character, type GameState } from '@/engine'
import { FLAG_JOURNEY_BLESS_COMPLETED } from '../Act1StoryFlags'

/** Divine incantation granting temporary protection and strength to a target. */
export class BlessSpell extends Spell {
  constructor() {
    super({
      name: 'bless',
      description:
        'A divine incantation that offers protection and strength to the caster.',
    })
  }

  override castSpell(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_JOURNEY_BLESS_COMPLETED, true)
    return (
      '[event]You cast [spell_name]bless[/spell_name] on yourself.[/event]\n' +
      'Your resolve is strengthened, and you feel more prepared for the ' +
      'challenges that lie ahead on your journey.'
    )
  }

  override castOnCharacter(
    _gameState: GameState,
    character: Character,
  ): string {
    const name = character.name
    return (
      '[event]You cast [spell_name]bless[/spell_name] on ' +
      `[character_name]${name}[/character_name].[/event]\n` +
      'A divine light surrounds ' +
      `[character_name]${name}[/character_name], and they seem ` +
      'strengthened and more resolute.'
    )
  }
}
