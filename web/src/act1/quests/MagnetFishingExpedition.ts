import { Quest, type GameState } from '@/engine'
import { FLAG_WELL_EXAMINED } from '../Act1StoryFlags'
import { Well } from '../items/Well'

/** The first log entry: the glint, seen from the well's edge. */
const GLINT = 'Something glints far down in the well, much too deep for hands.'

/** The entry added once the magnet is on the rod. */
const MAGNET_ON_ROD = 'The magnet might reach it, on a long enough rod.'

/**
 * Side quest: fish the shiny ring out of the well with the magnetic rod.
 * It starts at the glint, or at the rod if that comes first, and its log is a
 * journal of two entries.
 */
export class MagnetFishingExpeditionQuest extends Quest {
  constructor() {
    super({
      name: 'Magnet fishing expedition',
      description: GLINT,
      completion: 'The well gave up a silver ring, and something else besides.',
    })
  }

  /** Whether the ring still lies in the well Elior has looked into. */
  private static glintSeen(gameState: GameState): boolean {
    if (!gameState.getStoryFlag(FLAG_WELL_EXAMINED)) return false
    const well = gameState.allRooms.VillageWell?.items.find(
      (item) => item instanceof Well,
    )
    return well instanceof Well && well.containsRing
  }

  /** Starts at the glint, or at the magnetic rod, whichever comes first. */
  override checkTrigger(gameState: GameState): boolean {
    if (gameState.getItem('magnetic fishing rod') !== null) {
      this.setJournal([GLINT], MAGNET_ON_ROD)
      return true
    }
    if (!MagnetFishingExpeditionQuest.glintSeen(gameState)) return false
    this.setJournal([], GLINT)
    return true
  }

  /** Adds the second entry once the magnet is on the rod. */
  override checkUpdate(gameState: GameState): boolean {
    if (
      gameState.getItem('magnetic fishing rod') === null ||
      this.latestStage === MAGNET_ON_ROD
    ) {
      return false
    }
    this.setJournal([GLINT], MAGNET_ON_ROD)
    return true
  }

  override checkCompletion(gameState: GameState): boolean {
    return gameState.getItem('shiny ring') !== null
  }
}
