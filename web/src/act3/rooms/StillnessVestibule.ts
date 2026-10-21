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
        'A deep hush lies over dark pools of water so still they look ' +
        'frozen. The stone swallows every sound. Three echo stones stand in a ' +
        'triangle at the centre, their surfaces carved with winding channels ' +
        'meant to catch spoken words.',
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
