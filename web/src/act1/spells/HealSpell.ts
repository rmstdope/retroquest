import {
  Spell,
  type Character,
  type GameState,
  type Item,
  characterName,
} from '@/engine'
import { Fisherman } from '../characters/Fisherman'
import { Snare } from '../items/Snare'

/** Simple restorative spell for Act I; supports self-cast and targeted healing. */
export class HealSpell extends Spell {
  constructor() {
    super({
      id: 'heal',
      name: 'heal',
      description: 'The first thing Mira showed you: how to mend.',
    })
  }

  /** Cast the spell without a target (self-cast behavior). */
  override castSpell(_gameState: GameState): string {
    return 'A warm light envelops you, and you feel your wounds mending.'
  }

  /** Heal cast on the snared kit: the wire comes first; an empty snare has nothing to mend. */
  override castOnItem(gameState: GameState, item: Item): string {
    if (!(item instanceof Snare)) return super.castOnItem(gameState, item)
    if (item.freed) {
      return (
        'There is nothing here to mend. The kit took its leg with it, and ' +
        'it was whole enough to run.'
      )
    }
    return (
      'The warmth reaches the kit and it flinches from it. The wire is ' +
      'still in the leg; mending flesh around iron would be cruelty, and ' +
      'the kit knows it before you do.'
    )
  }

  /** Heal a target character; the fisherman's busted arm mends for real. */
  override castOnCharacter(gameState: GameState, character: Character): string {
    const name = character.name
    if (character instanceof Fisherman) {
      return character.healArm(gameState)
    }
    return (
      `A warm light settles over ${characterName(name)}. ` +
      'There was nothing in them that needed mending.'
    )
  }
}
