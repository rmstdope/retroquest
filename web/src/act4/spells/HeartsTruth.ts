import { Spell, type Character, type GameState, type Item } from '@/engine'
import {
  FLAG_ACT4_SERVANTS_FREED,
  FLAG_ACT4_STAFF_HEARD,
  FLAG_ACT4_THRONE_REFRAIN_SAID,
  FLAG_ACT4_WHISPERS_HEARD,
} from '../Act4StoryFlags'
import { Malakar } from '../characters/Malakar'
import { SorceressOfLies } from '../characters/SorceressOfLies'
import { TrappedServants } from '../characters/TrappedServants'
import { CrystalWhispers } from '../items/CrystalWhispers'
import { SorceressStaff } from '../items/SorceressStaff'

/** What the spell hears where there is no lie. */
const NOTHING_TO_HEAR =
  '[dim]You listen for a hidden heart, but there is no lie here to hear ' +
  'beneath.[/dim]'

/** What the staff's mask hides, once. */
const STAFF_HEARD =
  "Beneath the mask's smile there is something small and " +
  'lonely. It was made to be looked at, and no one ever looked at it. Only ' +
  'away.'

/** Whose voice the whispers are, once. */
const WHISPERS_HEARD =
  'The whispers are not many voices. They ' +
  'are one: hers, repeating every lie she has ever told so that she never ' +
  'has to hear the silence.'

/** The voice beneath Malakar's, until the refrain is said. */
const MALAKAR_HEARD =
  "Beneath Malakar's voice runs another, low and cold: the voice from your " +
  'dreams. The Shadow is here, in the room, speaking through him.'

/** What the freed servants will not say. */
const SERVANTS_HEARD =
  'Beneath their thanks you hear what none of them will say: they are ' +
  'afraid to go home and find no one waiting.'

/**
 * Learned when the knight's badge is shown to the Sorceress of Lies: hears the
 * true heart beneath a lie. In the Chamber of Whispers the Sorceress, her
 * staff and the crystals each give a part of her (all three are needed before
 * she can be answered); Malakar (until the refrain) and the freed servants
 * give a line of their own.
 */
export class HeartsTruth extends Spell {
  constructor() {
    super({
      id: 'hearts_truth',
      name: "Heart's Truth",
      description: 'Hear the true heart beneath a lie.',
    })
  }

  /** Nothing to hear without a target. */
  override castSpell(_gameState: GameState): string {
    return NOTHING_TO_HEAR
  }

  /** The staff and the crystals each have a heart to hear; nothing in any other item. */
  override castOnItem(gameState: GameState, target: Item): string {
    if (target instanceof SorceressStaff) {
      return this.hearOnce(
        gameState,
        FLAG_ACT4_STAFF_HEARD,
        STAFF_HEARD,
        'You have already heard what the mask hides.',
      )
    }
    if (target instanceof CrystalWhispers) {
      return this.hearOnce(
        gameState,
        FLAG_ACT4_WHISPERS_HEARD,
        WHISPERS_HEARD,
        'You have already heard whose voice the whispers are.',
      )
    }
    return NOTHING_TO_HEAR
  }

  /** The Sorceress, Malakar (before the refrain) and the freed servants have a heart to hear. */
  override castOnCharacter(gameState: GameState, target: Character): string {
    if (target instanceof SorceressOfLies) return target.hearHeart(gameState)
    if (
      target instanceof Malakar &&
      !gameState.getStoryFlag(FLAG_ACT4_THRONE_REFRAIN_SAID)
    ) {
      return MALAKAR_HEARD
    }
    if (
      target instanceof TrappedServants &&
      gameState.getStoryFlag(FLAG_ACT4_SERVANTS_FREED)
    ) {
      return SERVANTS_HEARD
    }
    return NOTHING_TO_HEAR
  }

  /** One of the chamber's three hearts: the line the first time, the dim line after. */
  private hearOnce(
    gameState: GameState,
    flag: string,
    line: string,
    already: string,
  ): string {
    if (gameState.getStoryFlag(flag)) return `[dim]${already}[/dim]`
    gameState.setStoryFlag(flag, true)
    return line
  }
}
