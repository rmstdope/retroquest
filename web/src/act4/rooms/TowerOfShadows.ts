import { Room } from '@/engine'

/**
 * A twisted tower where shadows take corporeal form and doubt runs rampant.
 *
 * Tests the player's resolve against psychological attacks; the loyalty token
 * proves bonds of trust to dispel shadow magic.
 */
export class TowerOfShadows extends Room {
  constructor() {
    super({
      name: 'Tower of Shadows',
      description:
        'A spiraling tower of black stone pierces the gloom, its walls seeming to ' +
        'absorb light itself. Tendrils of living shadow coil around the structure, ' +
        'reaching out with grasping fingers toward any source of warmth or hope. ' +
        'The air grows thicker with each step upward, and whispered doubts slither ' +
        'into your mind like poison. Windows reveal only deeper darkness, and the ' +
        'very shadows appear to mock your every movement with silent, dancing forms.',
      items: [],
      characters: [],
      exits: { south: 'HallOfEchoes', up: 'ChamberOfWhispers' },
    })
  }
}
