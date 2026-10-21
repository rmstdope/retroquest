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
        'A profound hush descends like a shroud over obsidian water pools that ' +
        'mirror the darkness above, their surfaces so still they seem frozen in ' +
        'time. Sound itself appears to be devoured by the ancient stone, as if ' +
        'the very walls hunger for silence. Three echo stones stand sentinel in ' +
        "a perfect triangle at the chamber's heart, their surfaces carved with " +
        'mystical channels that seem to writhe in the dim light. These weathered ' +
        'monoliths pulse with an otherworldly energy, their carved conduits ' +
        'waiting to amplify sacred whispers and bind them to the fabric of ' +
        'reality itself. The air thrums with dormant power, heavy with the ' +
        'weight of forgotten rituals.',
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
