import { Room, type Exits, type GameState } from '@/engine'
import { KingAlden } from '../characters/KingAlden'
import { Malakar } from '../characters/Malakar'
import { CrystalPrison } from '../items/CrystalPrison'
import { Wound } from '../items/Wound'
import { endingPlayed } from '../endings'
import { THRONE_CHAMBER_FIRST } from './throneDescriptions'

/**
 * The seat of Malakar's power and the climax of Act IV: King Alden hangs in
 * his crystal prison, the wound in time bleeds beside him, and Malakar waits
 * for Elior's answer. The scene itself is played by Malakar, the Ancient
 * Amulet, the Lifelight Elixir and the prison; the room holds them together
 * and its description follows the scene. South to the Parents' Vault stays
 * open at all times; once the wound is closed an arch opens to the north,
 * the way home to Willowbrook Field.
 */
export class ThroneChamer extends Room {
  constructor() {
    super({
      name: 'Throne Chamber',
      description: THRONE_CHAMBER_FIRST,
      items: [new CrystalPrison(), new Wound()],
      characters: [new Malakar(), new KingAlden()],
      exits: { south: 'ParentsVault' },
    })
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
