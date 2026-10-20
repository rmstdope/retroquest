import { Room } from '@/engine'
import { AshScholar } from '../characters/AshScholar'
import { EmberwaterCanteen } from '../items/EmberwaterCanteen'

/** Wind-carved paths zig-zagging across black rock with canvas shelters. */
export class LowerSwitchbacks extends Room {
  constructor() {
    super({
      name: 'Lower Switchbacks',
      description:
        'Wind‑carved paths snake across black, glassy rock; ash skims the ' +
        "air and the scent of iron hangs on the wind. A small scholars' " +
        'camp clings to a lee: canvas shelters patched with soot, low ' +
        'braziers for warmth, and drying racks where scorched notes and ' +
        'map fragments flutter. Workbenches hold polishing stones and ' +
        'brass fittings—evidence of a diligent, makeshift atelier repairing ' +
        'mirror segments found among the outcrops. Beyond the camp, the ' +
        'slope falls into jagged obsidian ribs and steaming vents where ' +
        'fumaroles hiss; sparks drift like trapped fireflies when the wind ' +
        'turns.',
      items: [new EmberwaterCanteen()],
      characters: [new AshScholar()],
      exits: { north: 'ObsidianOutcrops', east: 'EmberGallery' },
    })
  }
}
