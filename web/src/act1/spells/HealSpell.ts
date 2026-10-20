import {
  Spell,
  type Character,
  type GameState,
  event,
  characterName,
} from '@/engine'

/** Simple restorative spell for Act I; supports self-cast and targeted healing. */
export class HealSpell extends Spell {
  constructor() {
    super({
      id: 'heal',
      name: 'heal',
      description:
        'A restorative spell that mends wounds and alleviates ailments.',
    })
  }

  /** Cast the spell without a target (self-cast behavior). */
  override castSpell(_gameState: GameState): string {
    return (
      event('You cast [spell_name]heal[/spell_name] on yourself.') +
      '\n' +
      'A warm light envelops you, and you feel your wounds mending.'
    )
  }

  /** Heal a target character and return the narrative describing the effect. */
  override castOnCharacter(
    _gameState: GameState,
    character: Character,
  ): string {
    const name = character.name
    return (
      event(
        `You cast [spell_name]heal[/spell_name] on ${characterName(name)}.`,
      ) +
      '\nA warm light envelops ' +
      `${characterName(name)} and the character seems a bit healthier.`
    )
  }
}
