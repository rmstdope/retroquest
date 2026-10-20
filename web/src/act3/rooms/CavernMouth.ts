import { Room } from '@/engine'
import { MineOverseer } from '../characters/MineOverseer'

/** The misty entrance to the ancient cavern system. */
export class CavernMouth extends Room {
  constructor() {
    super({
      name: 'Cavern Mouth',
      description:
        'A broad entry arch yawns before you, curtained by tendrils of cold mist ' +
        'that coil and writhe like spectral fingers. Lantern light wavers and dims ' +
        'at the threshold, as if the darkness within hungers to devour illumination. ' +
        'Ancient symbols are carved into the weathered stone archway, their meanings ' +
        'lost to time but somehow still resonating with a faint, otherworldly power. ' +
        'The air carries whispers of forgotten secrets and the weight of ages past.',
      items: [],
      characters: [new MineOverseer()],
      exits: { north: 'ToolCache', east: 'StillnessVestibule' },
    })
  }
}
