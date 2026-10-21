import { Room } from '@/engine'
import type { Exits, GameState } from '@/engine'
import { Herald } from '../characters/Herald'
import { CastleGuardCaptain } from '../characters/CastleGuardCaptain'

/** The Castle Approach description; `Act2.afterLoad` restores it in older saves. */
export const CASTLE_APPROACH_DESCRIPTION =
  "A wide avenue lined with statues of Greendale's heroes leads to an impressive " +
  'castle of white stone. Tall spires reach toward the sky, and colorful banners ' +
  'snap in the wind. ' +
  'Fewer guards than the posts were built for patrol the approach, and those who ' +
  'remain keep their voices low. The royal standard is gone from the highest spire.'

/**
 * Castle Approach room: ceremonial avenue gating access to the castle courtyard.
 *
 * `getExits()` removes `west` until `enableCastleCourtyard()` is invoked (after
 * presenting the entry pass to the Herald).
 */
export class CastleApproach extends Room {
  castleCourtyardEnabled = false

  constructor() {
    super({
      name: 'Castle Approach',
      description: CASTLE_APPROACH_DESCRIPTION,
      items: [],
      characters: [new Herald(), new CastleGuardCaptain()],
      exits: { south: 'MainSquare', west: 'CastleCourtyard' },
    })
  }

  /** Return exits; withhold the west exit until protocol is fulfilled. */
  override getExits(gameState: GameState): Exits {
    const exits: Exits = { ...super.getExits(gameState) }
    // Remove west exit to CastleCourtyard until entry pass has been shown to herald
    if (!this.castleCourtyardEnabled && 'west' in exits) {
      delete exits.west
    }
    return exits
  }

  /** Enable the west exit to the castle courtyard after entry pass validation. */
  enableCastleCourtyard(): void {
    this.castleCourtyardEnabled = true
  }
}
