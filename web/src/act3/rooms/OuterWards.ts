import { Room } from '@/engine'
import type { GameState } from '@/engine'
import { WardingPillars } from '../items/WardingPillars'
import { SeaweedTangle } from '../items/SeaweedTangle'

/**
 * A flooded courtyard with three old pillars for tideward sigil work.
 *
 * Search only describes the courtyard and points out the warding pillars;
 * purification and sigil engraving live on the `WardingPillars` item.
 */
export class OuterWards extends Room {
  constructor() {
    super({
      name: 'Outer Wards',
      description:
        'The courtyard lies half under the sea. ' +
        'Three old pillars rise from the black water, ' +
        'their faces scored with shallow marks. ' +
        'Brine beads along the carved lines and catches the moon in small ' +
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

  /** Give a save made with older wording the current description. */
  override refreshSavedText(): void {
    this.description = new OuterWards().description
  }

  /** Describe the courtyard and warding pillars without performing attunement. */
  override search(_gameState: GameState): string {
    return (
      'Apart from the three warding pillars rising from the black ' +
      'water, the drowned courtyard holds little of interest; the pillars ' +
      'alone seem keyed to the moon and tide.'
    )
  }
}
