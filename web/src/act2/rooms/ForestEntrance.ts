import { Room, characterName } from '@/engine'
import type { Exits, GameState } from '@/engine'
import {
  FLAG_ENHANCED_LANTERN_USED_FOREST_ENTRANCE,
  FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE,
} from '../Act2StoryFlags'
import { EnchantedAcorn } from '../items/EnchantedAcorn'
import { ForestSprites } from '../characters/ForestSprites'

/** The Forest Entrance base text; `Act2.afterLoad` restores it in older saves. */
export const FOREST_ENTRANCE_DESCRIPTION =
  'Massive trees create a natural cathedral as you enter the Enchanted Forest. ' +
  'Dappled sunlight filters through the dense canopy, and the path ahead ' +
  'disappears into green shadows. The air is alive with birds and rustling leaves, ' +
  'but beneath it lies an expectant silence, as if the forest itself is watching.'

/**
 * Forest Entrance room: two thresholds, each opened by its own item.
 *
 * The enhanced lantern opens the east path to the Whispering Glade and the
 * protective charm opens the south path to the Ancient Grove, in either order.
 * `getExits()` lists each only once its flag is set, `blockedExit()` explains
 * the closed way, and `descriptionFor()` swaps the south and east sentences.
 */
export class ForestEntrance extends Room {
  constructor() {
    super({
      name: 'Forest Entrance',
      description: FOREST_ENTRANCE_DESCRIPTION,
      items: [new EnchantedAcorn()],
      characters: [new ForestSprites()],
      exits: {
        west: 'ForestTransition',
        south: 'AncientGrove',
        east: 'WhisperingGlade',
      },
    })
  }

  /** Whether the protective charm has been used here. */
  private charmUsed(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE)
  }

  /** Whether the enhanced lantern has been lit here. */
  private lanternUsed(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ENHANCED_LANTERN_USED_FOREST_ENTRANCE)
  }

  /** The base text plus the south sentence (charm) and east sentence (lantern). */
  override descriptionFor(gameState: GameState): string {
    const sprites = characterName('forest sprites')
    const south = this.charmUsed(gameState)
      ? 'A path leads south toward an ancient grove; the forest sprites ' +
        'have drawn aside from it and dance among the trees.'
      : 'A path leads south toward an ancient grove, but small motes of ' +
        `light dance thick across it: ${sprites}, watching your every move.`
    const east = this.lanternUsed(gameState)
      ? "To the east, your lantern's blue light picks out a narrow path " +
        'through the undergrowth, toward a tranquil glade.'
      : 'To the east the undergrowth grows thick and dark.'
    return `${this.description} ${south} ${east}`
  }

  /** Return exits: west always, south after the charm, east after the lantern. */
  override getExits(gameState: GameState): Exits {
    const exits: Exits = { west: 'ForestTransition' }
    if (this.charmUsed(gameState)) exits.south = 'AncientGrove'
    if (this.lanternUsed(gameState)) exits.east = 'WhisperingGlade'
    return exits
  }

  /** Explain the closed east (too dark) and south (led astray by the sprites) ways. */
  override blockedExit(gameState: GameState, direction: string): string | null {
    if (direction === 'east' && !this.lanternUsed(gameState)) {
      return (
        'The undergrowth to the east is too thick and dark to find a way ' +
        'through.'
      )
    }
    if (direction === 'south' && !this.charmUsed(gameState)) {
      return (
        'You set off down the grove path. The sprites swirl about you, ' +
        'chiming with laughter, and the trees seem to shift as you pass. ' +
        'After a long while of walking you come out of the green shadows ' +
        'exactly where you started.'
      )
    }
    return null
  }
}
