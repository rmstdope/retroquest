import { Room, event } from '@/engine'
import type { GameState } from '@/engine'
import { Mural } from '../items/Mural'
import { RustedLockerKey } from '../items/RustedLockerKey'
import { BarnacledBeamFragment } from '../items/BarnacledBeamFragment'
import { FLAG_ACT3_SEA_SEALED_LETTER_READ } from '../Act3StoryFlags'

/** The sentence the room gains once the curse has shown itself here. */
const CURSE_LINE = 'Dead sea birds line the stones, and the surf runs grey.'

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
      return event(
        "Your light washes over the stones; the mural's shadows are " +
          'familiar now and nothing new comes free.',
      )
    }
    this.addItem(new RustedLockerKey())
    this.lightCast = true
    return event(
      'Your light catches a patch of pigment and a small hollow. In the ' +
        'shadowed cranny, something metallic flakes free — a corroded key rests ' +
        'in the rock.',
    )
  }

  /** The description, ending with the curse's mark once the clue is found. */
  protected override descriptionFor(gameState: GameState): string {
    return gameState.getStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ)
      ? `${this.description} ${CURSE_LINE}`
      : this.description
  }
}
