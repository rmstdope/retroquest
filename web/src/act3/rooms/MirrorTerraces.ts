import { Room } from '@/engine'
import type { Exits, GameState } from '@/engine'
import { MirrorMount } from '../items/MirrorMount'
import { CharredInscription } from '../items/CharredInscription'
import {
  FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_STARTED,
  FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED,
} from '../Act3StoryFlags'

/** The Mirror Terraces: stepped platforms with sockets for polished mirrors. */
export class MirrorTerraces extends Room {
  constructor() {
    super({
      name: 'Mirror Terraces',
      description:
        'Stepped platforms rise in concentric benches, each ring studded with ' +
        'sockets for polished mirrors and brass mounts. Channels are neatly ' +
        'etched into the stone to carry and focus light up the slope; stray ' +
        'rays catch on alignment wedges and glint like cold flame. The air ' +
        'humms faintly with residual heat, and dusted ash settles on ' +
        'worktables where scholars and attendants file, polish, and fit ' +
        'mirror segments. A Terrace Warden watches the assembly points, ' +
        'checking the angles and murmuring measurements — the place smells ' +
        'of warm metal, singed cloth, and the mineral tang of cooling slag.',
      // A prepared mount is present at the terraces for the player to use
      items: [new MirrorMount(), new CharredInscription()],
      characters: [],
      exits: {
        south: 'EmberGallery',
        east: 'FumarolePassages',
        west: 'ObsidianOutcrops',
      },
    })
  }

  /** Room hook called when the player arrives; mark mirrors quest started. */
  override onEnter(gameState: GameState): void {
    gameState.setStoryFlag(FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_STARTED, true)
  }

  /** Return exits; hide east exit until mirrors quest is completed. */
  override getExits(gameState: GameState): Exits {
    const exits = { ...this.exits }
    if (!gameState.getStoryFlag(FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED)) {
      delete exits.east
    }
    return exits
  }
}
