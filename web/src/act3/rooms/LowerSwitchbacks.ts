import { Room, type GameState } from '@/engine'
import { AshScholar } from '../characters/AshScholar'
import { EmberwaterCanteen } from '../items/EmberwaterCanteen'

/** Wind-carved paths zig-zagging across black rock with canvas shelters. */
export class LowerSwitchbacks extends Room {
  constructor() {
    super({
      name: 'Lower Switchbacks',
      description:
        'Paths wind back and forth across black, glassy rock, ' +
        'and ash blows on the wind. ' +
        "In the lee of the slope stands a scholar's camp: " +
        'soot-patched canvas, low braziers, ' +
        'and racks where scorched notes and scraps of map flap. ' +
        'A workbench holds polishing stones and brass fittings ' +
        'for mending mirror segments, the kind found among the outcrops. ' +
        'Above the camp the slope climbs into obsidian, ' +
        'and vents hiss farther off.',
      items: [new EmberwaterCanteen()],
      characters: [new AshScholar()],
      exits: { north: 'ObsidianOutcrops', east: 'EmberGallery' },
    })
  }

  /**
   * The room's look, from the current wording, so a save made before a
   * wording change shows the current text.
   */
  override descriptionFor(_gameState: GameState): string {
    return new LowerSwitchbacks().description
  }
}
