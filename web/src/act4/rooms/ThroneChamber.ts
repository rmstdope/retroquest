import { Room, type Exits, type GameState } from '@/engine'
import { KingAlden } from '../characters/KingAlden'
import { Malakar } from '../characters/Malakar'
import { CrystalPrison } from '../items/CrystalPrison'
import { Wound } from '../items/Wound'
import { Throne } from '../items/Throne'
import { endingPlayed } from '../endings'
import {
  FLAG_ACT4_ELIXIR_ON_KING,
  FLAG_ACT4_ELIXIR_ON_MALAKAR,
  FLAG_ACT4_THRONE_AMULET_OPENED,
} from '../Act4StoryFlags'
import {
  THRONE_CHAMBER_AMULET,
  THRONE_CHAMBER_FIRST,
  THRONE_CHAMBER_HEALED,
  THRONE_CHAMBER_JUSTICE,
  THRONE_CHAMBER_REDEMPTION,
  THRONE_CHAMBER_SACRIFICE,
  THRONE_CHAMBER_SHATTERED,
} from './throneDescriptions'

/** The chamber's look once each ending has played. */
const AFTER_ENDING = {
  redemption: THRONE_CHAMBER_REDEMPTION,
  justice: THRONE_CHAMBER_JUSTICE,
  sacrifice: THRONE_CHAMBER_SACRIFICE,
}

/**
 * The seat of Malakar's power and the climax of Act IV: King Alden hangs in
 * his crystal prison, the wound in time bleeds beside him, and Malakar waits
 * for Elior's answer. The scene itself is played by Malakar, the Ancient
 * Amulet, the Lifelight Elixir and the prison; the room holds them together
 * and its description follows the scene. South to the Parents' Vault stays
 * open at all times; once the wound is closed an arch opens to the north,
 * the way home to Willowbrook Field.
 */
export class ThroneChamber extends Room {
  constructor() {
    super({
      name: 'Throne Chamber',
      description: THRONE_CHAMBER_FIRST,
      items: [new CrystalPrison(), new Wound(), new Throne()],
      characters: [new Malakar(), new KingAlden()],
      exits: { south: 'ParentsVault' },
    })
  }

  /** Saves from before the throne could be looked at get it back. */
  override refreshSavedText(_gameState: GameState): void {
    if (!this.items.some((item) => item instanceof Throne)) {
      this.addItem(new Throne())
    }
  }

  /**
   * The chamber's look follows the scene: the ending that has played, else
   * the elixir given to the king or to Malakar, else the opened amulet.
   */
  override descriptionFor(gameState: GameState): string {
    const ending = endingPlayed(gameState)
    if (ending) return AFTER_ENDING[ending]
    if (gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_KING)) {
      return THRONE_CHAMBER_SHATTERED
    }
    if (gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_MALAKAR)) {
      return THRONE_CHAMBER_HEALED
    }
    if (gameState.getStoryFlag(FLAG_ACT4_THRONE_AMULET_OPENED)) {
      return THRONE_CHAMBER_AMULET
    }
    return super.descriptionFor(gameState)
  }

  /** South always; north, the way home, once an ending has been played. */
  override getExits(gameState: GameState): Exits {
    return endingPlayed(gameState)
      ? { ...this.exits, north: 'WillowbrookField' }
      : this.exits
  }

  /** The arch is only "the way home" to the player. */
  override exitLabel(gameState: GameState, direction: string): string | null {
    return direction === 'north' && endingPlayed(gameState)
      ? 'the way home'
      : null
  }
}
