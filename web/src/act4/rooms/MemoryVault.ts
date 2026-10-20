import { Room } from '@/engine'

/**
 * A temporal chamber containing fragments of Malakar's memories and past.
 *
 * Reveals the truth about Malakar's corruption and the possibility of redemption.
 */
export class MemoryVault extends Room {
  constructor() {
    super({
      name: 'Memory Vault',
      description:
        'This mystical chamber exists partially outside of time itself, its walls ' +
        'covered in floating orbs of crystallized memory that flicker with scenes ' +
        'from long ago. The air ripples with temporal distortions, and fragments of ' +
        "the past drift like spectral snow through the space. At the room's center, " +
        'a shadowy figure wavers between existence and void, reaching out with ' +
        'desperate longing toward memories that seem to slip away like morning mist.',
      items: [],
      characters: [],
      exits: { south: 'ChamberOfWhispers', east: 'ThroneChamberApproach' },
    })
  }
}
