import { Room } from '@/engine'
import type { GameState } from '@/engine'
import { WardingPillars } from '../items/WardingPillars'
import { SeaweedTangle } from '../items/SeaweedTangle'

/**
 * A flooded courtyard with three ancient pillars for tideward sigil work.
 *
 * Search only describes the courtyard and points out the warding pillars;
 * purification and sigil engraving live on the `WardingPillars` item.
 */
export class OuterWards extends Room {
  constructor() {
    super({
      name: 'Outer Wards',
      description:
        'The courtyard lies half-swallowed by the sea. Three ancient pillars ' +
        'rise from the black water, their faces scored with shallow marks. ' +
        'Brine beads along the carved lines and they catch the moon in small ' +
        'rings of light.',
      items: [new WardingPillars(), new SeaweedTangle()],
      characters: [],
      exits: {
        south: 'SubmergedAntechamber',
        east: 'CollapsedPier',
        west: 'ShorelineMarkers',
      },
    })
  }

  /** Describe the courtyard and warding pillars without performing attunement. */
  override search(_gameState: GameState): string {
    return (
      'Apart from the three ancient warding pillars rising from the black ' +
      'water, the drowned courtyard holds little of interest; the pillars ' +
      'alone seem keyed to the moon and tide.'
    )
  }
}
