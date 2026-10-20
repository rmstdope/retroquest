import { Room } from '@/engine'

/**
 * The sorceress's domain where truth becomes malleable and lies feel real.
 *
 * Confrontation with the Sorceress of Lies, testing empathy and understanding.
 */
export class ChamberOfWhispers extends Room {
  constructor() {
    super({
      name: 'Chamber of Whispers',
      description:
        'This circular chamber pulses with an otherworldly beauty that feels wrong, ' +
        'as if reality itself has been twisted into a more pleasing shape. Crystalline ' +
        'formations jut from the walls, each one humming with barely audible whispers ' +
        'that speak of your deepest desires and fears. The floor shifts beneath your ' +
        'feet like liquid glass, and the air shimmers with illusions that promise ' +
        "everything you've ever wanted while hiding terrible truths in their depths.",
      items: [],
      characters: [],
      exits: { down: 'TowerOfShadows', north: 'MemoryVault' },
    })
  }
}
