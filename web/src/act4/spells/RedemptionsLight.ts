import {
  Spell,
  dialogue,
  event,
  type Character,
  type GameState,
} from '@/engine'
import { GhostlyWarriors } from '../characters/GhostlyWarriors'
import { KnightOfDespair } from '../characters/KnightOfDespair'
import { HALL_AFTER_REDEMPTION } from '../rooms/hallDescriptions'
import {
  FLAG_ACT4_CEDRIC_FORGAVE,
  FLAG_ACT4_WARRIORS_AT_PEACE,
  VIRTUE_MERCY,
} from '../Act4StoryFlags'

/** What the light does where there is nothing to redeem. */
const NOTHING_TO_REDEEM =
  '[dim]Soft light gathers in your hand and fades. There is no fallen soul ' +
  'here to remember itself.[/dim]'

/**
 * Learned from the Knight of Despair: reminds a fallen soul of who it was.
 * Cast on the Ghostly Warriors it puts them at peace (mercy), and Sir Cedric
 * forgives the knight.
 */
export class RedemptionsLight extends Spell {
  constructor() {
    super({
      id: 'redemptions_light',
      name: "Redemption's Light",
      description: 'Light that reminds a fallen soul of who it was.',
    })
  }

  /** Nothing to redeem without a target. */
  override castSpell(_gameState: GameState): string {
    return NOTHING_TO_REDEEM
  }

  /** The warriors are put at peace (mercy, once) and Sir Cedric forgives the knight; the knight needs no more. */
  override castOnCharacter(gameState: GameState, target: Character): string {
    if (!(target instanceof GhostlyWarriors)) {
      return target instanceof KnightOfDespair
        ? NOTHING_TO_REDEEM
        : super.castOnCharacter(gameState, target)
    }
    const room = gameState.currentRoom
    room.characters = room.characters.filter((c) => c !== target)
    room.description = HALL_AFTER_REDEMPTION
    gameState.setStoryFlag(FLAG_ACT4_WARRIORS_AT_PEACE, true)
    gameState.setStoryFlag(FLAG_ACT4_CEDRIC_FORGAVE, true)
    gameState.addVirtue(VIRTUE_MERCY)
    return (
      event(
        'Soft light spills from your hands across the hall. One by one the ' +
          'ghostly warriors lower their blades and look at one another as if ' +
          'for the first time. Then they fade, at peace.',
      ) +
      '\n' +
      event(
        'Sir Cedric watches the last of them go. Then he crosses the hall ' +
          'and offers the knight his hand.',
      ) +
      '\n' +
      dialogue(
        'Sir Cedric',
        'If they can be let go, so can this. I forgive you. Get up.',
      ) +
      '\n[dim]Elior will remember this.[/dim]'
    )
  }
}
