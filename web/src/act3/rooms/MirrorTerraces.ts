import { Room } from '@/engine'
import type { Exits, GameState } from '@/engine'
import { MirrorMount } from '../items/MirrorMount'
import { CharredInscription } from '../items/CharredInscription'
import {
  FLAG_ACT3_MIRRORS_MENDED,
  FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_STARTED,
  FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED,
  FLAG_ACT3_CHARRED_INSCRIPTION_READ,
} from '../Act3StoryFlags'

/** The sentence the room gains once the curse has shown itself here. */
const CURSE_LINE =
  'Ash falls over the terraces like slow grey rain, and down the slope the ' +
  'braziers have guttered to embers.'

/** The line the room gains while the mended mirrors wait on the sun. */
const WAITING_LINE =
  'The mended mirrors stand ready, their bright faces still waiting on the sun.'

/** What the rest says when the sun reaches noon and the beam fires. */
const NOON_BEAM_TEXT =
  '[success]You settle on the warm stone and let the hours pass. The sun ' +
  'climbs until it stands squarely over the terraces. ' +
  "When the sun's beams strike the great mirror they are coaxed and " +
  'folded together until they pour from the terraces as a single, ' +
  'piercing ray. The light lances into the mountainside, strikes a ' +
  'hidden trigger, and a narrow passage grinds open to the east.[/success]'

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

  /** Whether the mirrors are mended but the beam has not yet fired. */
  private isWaitingForSun(gameState: GameState): boolean {
    return (
      gameState.getStoryFlag(FLAG_ACT3_MIRRORS_MENDED) &&
      !gameState.getStoryFlag(FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED)
    )
  }

  /**
   * The description: a waiting line while the mended mirrors wait on the sun,
   * then the curse's mark once the clue is found (always last).
   */
  override descriptionFor(gameState: GameState): string {
    let description = this.description
    if (this.isWaitingForSun(gameState)) {
      description = `${description} ${WAITING_LINE}`
    }
    return gameState.getStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ)
      ? `${description} ${CURSE_LINE}`
      : description
  }

  /**
   * Resting while the mended mirrors wait on the sun brings noon: the beam
   * fires, the east exit opens and the quest completes. Otherwise an ordinary rest.
   */
  override rest(gameState: GameState): string {
    if (!this.isWaitingForSun(gameState)) return super.rest(gameState)
    gameState.setStoryFlag(FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED, true)
    return NOON_BEAM_TEXT
  }
}
