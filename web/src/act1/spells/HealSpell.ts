import {
  Spell,
  type Character,
  type GameState,
  event,
  characterName,
} from '@/engine'
import { Fisherman } from '../characters/Fisherman'

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

  /** Heal a target character; the fisherman's busted arm mends for real. */
  override castOnCharacter(gameState: GameState, character: Character): string {
    const name = character.name
    const castMsg = event(
      `You cast [spell_name]heal[/spell_name] on ${characterName(name)}.`,
    )
    if (character instanceof Fisherman) {
      return castMsg + '\n' + character.healArm(gameState)
    }
    return (
      castMsg +
      '\nA warm light envelops ' +
      `${characterName(name)} and the character seems a bit healthier.`
    )
  }
}
