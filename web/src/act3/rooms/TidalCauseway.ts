import { Room } from '@/engine'
import type { GameState } from '@/engine'
import { Mural } from '../items/Mural'
import { RustedLockerKey } from '../items/RustedLockerKey'
import { BarnacledBeamFragment } from '../items/BarnacledBeamFragment'

/** Moon-washed causeways linking broken arches to half-drowned plazas. */
export class TidalCauseway extends Room {
  lightCast = false

  constructor() {
    super({
      name: 'Tidal Causeway',
      description:
        'Thin causeways of old stone lift from the black water like ribs. ' +
        'Moonlight skims the wet stones; salt and wind carry half‑heard ' +
        'songs. Broken arches stand like quiet mouths, guarding what the ' +
        'sea keeps.',
      items: [new Mural(), new BarnacledBeamFragment()],
      characters: [],
      exits: { north: 'ShorelineMarkers', east: 'SubmergedAntechamber' },
    })
  }

  /**
   * Cast light in the causeway to reveal things hidden in mural-shadow.
   *
   * Reveals a rusted locker key the first time light is focused here;
   * subsequent casts report nothing new.
   */
  castLightHere(_gameState: GameState): string {
    if (this.lightCast) {
      return (
        "[event]Your light washes over the stones; the mural's shadows are " +
        'familiar now and nothing new comes free.[/event]'
      )
    }
    this.addItem(new RustedLockerKey())
    this.lightCast = true
    return (
      '[event]Your light catches a patch of pigment and a small hollow. In the ' +
      'shadowed cranny, something metallic flakes free — a corroded key rests ' +
      'in the rock.[/event]'
    )
  }
}
