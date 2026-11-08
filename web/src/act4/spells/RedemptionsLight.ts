import {
  Spell,
  characterName,
  dialogue,
  remembered,
  speech,
  type Character,
  type GameState,
  type Item,
} from '@/engine'
import { endingPlayed } from '../endings'
import { GhostlyWarriors } from '../characters/GhostlyWarriors'
import { KnightOfDespair } from '../characters/KnightOfDespair'
import { Malakar } from '../characters/Malakar'
import { ShadowOfThePast } from '../characters/ShadowOfThePast'
import { SorceressOfLies } from '../characters/SorceressOfLies'
import { Wound } from '../items/Wound'
import {
  FLAG_ACT4_CEDRIC_FORGAVE,
  FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED,
  FLAG_ACT4_WARRIORS_AT_PEACE,
  VIRTUE_MERCY,
} from '../Act4StoryFlags'

/** What the light does where there is nothing to redeem. */
const NOTHING_TO_REDEEM =
  '[dim]Soft light gathers in your hand and fades. There is no fallen soul ' +
  'here to remember itself.[/dim]'

/** What the light does to the Shadow of the Past: it needs none. */
const SHADOW_LINE =
  'Light gathers in your hand, and the Shadow turns from it, gently.\n' +
  dialogue(
    'Shadow of the Past',
    'I have done nothing but remember. Keep it for him.',
  )

/** What the light does to the wound in time: it is no soul, and drinks it. */
const WOUND_LINE =
  'The light runs into the wound and is gone. There is no one in it to ' +
  'remember.'

/** What the light does to the redeemed Sorceress. */
const SORCERESS_LINE =
  `Soft light touches the ${characterName('Unmasked Sorceress')}. She does ` +
  'not flinch.\n' +
  dialogue(
    'Unmasked Sorceress',
    'So this is what it is, to be looked at without a lie.',
  )

/**
 * Learned from the Knight of Despair: reminds a fallen soul of who it was.
 * Cast on the Ghostly Warriors it puts them at peace (mercy), and Sir Cedric
 * forgives the knight. On the Shadow, the redeemed Sorceress, Malakar and
 * the wound in time it only shows a line.
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

  /** The wound is no soul: the light runs into it, until it is gone. */
  override castOnItem(gameState: GameState, target: Item): string {
    if (!(target instanceof Wound)) return super.castOnItem(gameState, target)
    return endingPlayed(gameState)
      ? '[dim]The wound is gone.[/dim]'
      : WOUND_LINE
  }

  /** The warriors are put at peace (mercy, once) and Sir Cedric forgives the knight; the knight needs no more; Malakar answers by the scene's stage. */
  override castOnCharacter(gameState: GameState, target: Character): string {
    if (target instanceof ShadowOfThePast) return SHADOW_LINE
    if (target instanceof Malakar) {
      return target.receiveRedemptionsLight(gameState)
    }
    if (
      target instanceof SorceressOfLies &&
      gameState.getStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED)
    ) {
      return SORCERESS_LINE
    }
    if (!(target instanceof GhostlyWarriors)) {
      return target instanceof KnightOfDespair
        ? NOTHING_TO_REDEEM
        : super.castOnCharacter(gameState, target)
    }
    const room = gameState.currentRoom
    room.characters = room.characters.filter((c) => c !== target)
    gameState.setStoryFlag(FLAG_ACT4_WARRIORS_AT_PEACE, true)
    gameState.setStoryFlag(FLAG_ACT4_CEDRIC_FORGAVE, true)
    gameState.addVirtue(VIRTUE_MERCY)
    return (
      'Soft light spills from your hands across the hall. One by one the ' +
      "ghostly warriors lower their blades. One puts a hand on another's " +
      'shoulder. Then they fade, at peace.\n' +
      `${characterName('Sir Cedric')} watches the last of them go. Then he ` +
      'crosses the hall and offers the knight his hand.\n' +
      speech('If they can be let go, so can this. I forgive you. Get up.') +
      '\n' +
      remembered('Mercy')
    )
  }
}
