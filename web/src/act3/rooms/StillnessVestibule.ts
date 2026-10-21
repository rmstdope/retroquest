import { Room } from '@/engine'
import type { Exits, GameState } from '@/engine'
import { DarkPool } from '../items/DarkPool'
import { EchoStones } from '../items/EchoStones'
import { StillwaterPhial } from '../items/StillwaterPhial'
import { QuietCharm } from '../items/QuietCharm'
import { SilenceKeeper } from '../characters/SilenceKeeper'
import { WanderingPhantoms } from '../characters/WanderingPhantoms'
import { FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED } from '../Act3StoryFlags'

/** A quiet chamber where hush falls over dark water pools. */
export class StillnessVestibule extends Room {
  constructor() {
    super({
      name: 'Stillness Vestibule',
      description:
        'A hush falls over this chamber like a shroud. Dark pools mirror the ' +
        'ceiling, so still they look frozen in time, and the stone seems to ' +
        'swallow every sound. At the centre, three weathered echo stones stand ' +
        'in a triangle. Their carved channels look made to catch whispered ' +
        'words and hold them.',
      items: [
        new EchoStones(),
        new DarkPool(),
        new StillwaterPhial(),
        new QuietCharm(),
      ],
      characters: [new SilenceKeeper(), new WanderingPhantoms()],
      exits: { north: 'CollapsedGalleries', west: 'CavernMouth' },
    })
  }

  /** Return exits, opening path to Dragon's Hall after Oath completion. */
  override getExits(gameState: GameState): Exits {
    const exits = { ...this.exits }
    if (gameState.getStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED)) {
      exits.east = 'DragonsHall'
    }
    return exits
  }
}
