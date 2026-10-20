import { Room } from '@/engine'

/**
 * The approach to Malakar's throne, where King Alden awaits rescue.
 *
 * King's rescue and revelation of the parents' legacy through a hidden vault.
 */
export class ThroneChamberApproach extends Room {
  constructor() {
    super({
      name: 'Throne Chamber Approach',
      description:
        'A magnificent antechamber leads toward the heart of the fortress, its ' +
        "marble floors inlaid with gold depicting the kingdom's glorious past. " +
        'Heroic statues line the walls, their faces noble but mournful, as if ' +
        "witnessing the corruption that has befallen their realm. At the chamber's " +
        'end, a crystal prison holds a regal figure whose life force slowly ebbs ' +
        'away, while hidden alcoves promise secrets waiting to be uncovered by ' +
        'those deemed worthy of the truth.',
      items: [],
      characters: [],
      exits: {
        west: 'MemoryVault',
        east: 'ThroneChamer',
        north: 'RoyalGardens',
      },
    })
  }
}
