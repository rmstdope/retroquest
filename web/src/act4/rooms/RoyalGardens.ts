import { Room } from '@/engine'

/**
 * A restored sanctuary where the final choice about Malakar's fate is made.
 *
 * Epilogue space for determining the kingdom's future through player choice.
 */
export class RoyalGardens extends Room {
  constructor() {
    super({
      name: 'Royal Gardens',
      description:
        'Sunlight filters through ancient oaks whose leaves whisper with renewed ' +
        'life, while crystal-clear streams meander between beds of blooming flowers ' +
        'that seem to glow with inner light. The corruption has been cleansed from ' +
        'this sacred space, revealing its true beauty—a garden where hope grows ' +
        'eternal and second chances blossom like spring after the longest winter. ' +
        'Stone benches invite quiet contemplation, and the very air hums with the ' +
        'promise of new beginnings and the weight of momentous decisions.',
      items: [],
      characters: [],
      exits: { south: 'ThroneChamberApproach' },
    })
  }
}
