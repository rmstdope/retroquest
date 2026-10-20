import { Room } from '@/engine'
import { CrystalOfLight } from '../items/CrystalOfLight'
import { TideBornGuardian } from '../characters/TideBornGuardian'

/** A domed chamber where water stands glass-still with rippling sigils. */
export class SanctumOfTheTide extends Room {
  constructor() {
    super({
      name: 'Sanctum of the Tide',
      description:
        'A vaulted chamber where water hangs like a dark mirror, its surface ' +
        'etched with sigils that breathe and shift. Pale motes of light drift ' +
        'along the ripples, arranging themselves into slow, impatient runes. ' +
        "At the room's heart a shallow basin holds a cold, humming brightness; " +
        'the air tastes of brine and vows left unsaid.',
      items: [new CrystalOfLight()],
      characters: [new TideBornGuardian()],
      exits: { west: 'SubmergedAntechamber' },
    })
  }
}
