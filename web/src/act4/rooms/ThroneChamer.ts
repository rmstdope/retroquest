import { Room } from '@/engine'

/**
 * The seat of corrupted power where Malakar awaits final judgment.
 *
 * Ultimate confrontation where all previous choices determine the outcome.
 */
export class ThroneChamer extends Room {
  constructor() {
    super({
      name: 'Throne Chamber',
      description:
        'The corrupted heart of the kingdom spreads before you—a throne room ' +
        'twisted by shadow magic into a monument of despair. The obsidian throne ' +
        'pulses with malevolent energy, surrounded by floating crystals that hum ' +
        'with captured screams. Dark tapestries depicting scenes of conquest and ' +
        'suffering drape the walls, while the very air crackles with the weight ' +
        'of accumulated power and pain. Here, where light once brought hope, only ' +
        'darkness remains—waiting for someone brave enough to challenge its dominion.',
      items: [],
      characters: [],
      exits: { west: 'ThroneChamberApproach' },
    })
  }
}
