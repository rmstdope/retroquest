import { Room } from '@/engine'
import type { GameState } from '@/engine'
import { AshFern } from '../items/AshFern'
import { CooledSlag } from '../items/CooledSlag'

/** A vaulted cavern veined with cooling flows smelling of charcoal and iron. */
export class EmberGallery extends Room {
  /** Whether deposits have been discovered by searching. */
  depositsRevealed = false

  constructor() {
    super({
      name: 'Ember Gallery',
      description:
        'A vaulted cavern veined with cooling lava; ' +
        'the air smells of charcoal and iron. ' +
        'Steam rises from cracks in the floor. ' +
        'On the worktables, fireglass and cooled slag lie sorted into heaps ' +
        'for wards, as if whoever sorted them meant to come back.',
      items: [],
      characters: [],
      exits: { north: 'MirrorTerraces', west: 'LowerSwitchbacks' },
    })
  }

  /** Give a save made with older wording the current description. */
  override refreshSavedText(): void {
    this.description = new EmberGallery().description
  }

  /** Reveal ash-fern and cooled slag deposits when searched the first time. */
  override search(_gameState: GameState): string {
    if (!this.depositsRevealed) {
      this.depositsRevealed = true
      this.items.push(new AshFern())
      this.items.push(new CooledSlag())
      return (
        'You sift through the sorted fragments on the worktable and ' +
        'find a brittle frond of ash-fern tucked in a tool roll, and a pile ' +
        'of cooled slag fragments sifted into a shallow basin. They look ' +
        'suitable for warding mixtures.'
      )
    }
    return (
      'You search the Ember Gallery again but find nothing new beyond the ' +
      'worktables and sorted fragments.'
    )
  }
}
