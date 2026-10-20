import { Quest, type GameState, characterName } from '@/engine'
import {
  FLAG_MET_HEMLOCK,
  FLAG_PATCHES_FOUND,
  FLAG_PATCHES_RETURNED,
  FLAG_PATCHES_STAYED_WITH_GRANDMOTHER,
} from '../Act1StoryFlags'

/**
 * Side quest: find Patches, the Hemlock family's missing cat, hiding in the
 * locked Abandoned Shed, and carry her home to the General Store, or let
 * her stay with Elior's grandmother, who sends word to Hemlock.
 */
export class CuriosityKilledTheCatQuest extends Quest {
  constructor() {
    super({
      name: 'Curiosity killed the cat',
      description:
        `Old Man ${characterName('Hemlock')} has shut the ` +
        '[room_name]General Store[/room_name] until his cat, ' +
        `${characterName('Patches')}, comes home. ` +
        'She was last seen near the old well, where a locked shed keeps its ' +
        'secrets. What will you discover if you find a way inside?',
      completion:
        `You carried ${characterName('Patches')} home to Old Man ` +
        `${characterName('Hemlock')}, and the [room_name]General Store[/room_name] ` +
        'is open again. Curiosity did not kill this cat after all.',
    })
  }

  /** Starts when Elior meets Hemlock, visits the shed or finds Patches. */
  override checkTrigger(gameState: GameState): boolean {
    return (
      gameState.visitedRooms.includes('Abandoned Shed') ||
      gameState.getStoryFlag(FLAG_MET_HEMLOCK) ||
      gameState.getStoryFlag(FLAG_PATCHES_FOUND)
    )
  }

  /** Once Patches is in Elior's arms, the log points him to the store. */
  override checkUpdate(gameState: GameState): boolean {
    if (!gameState.getStoryFlag(FLAG_PATCHES_FOUND) || this.latestStage) {
      return false
    }
    this.setJournal(
      [this.description],
      `\n${characterName('Patches')} was hiding in the ` +
        '[room_name]Abandoned Shed[/room_name]. Carry her home to Old Man ' +
        `${characterName('Hemlock')} at the [room_name]General Store[/room_name].`,
    )
    return true
  }

  /**
   * Completed once Patches is back with Hemlock or stays with grandmother;
   * in the second case the completion text tells of her new home.
   */
  override checkCompletion(gameState: GameState): boolean {
    if (gameState.getStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER)) {
      this.completion =
        `You let ${characterName('Patches')} stay by your ` +
        `${characterName('grandmother')}'s hearth, and she sent word to Old Man ` +
        `${characterName('Hemlock')}. The [room_name]General Store[/room_name] ` +
        'is open again. Curiosity did not kill this cat after all.'
      return true
    }
    return gameState.getStoryFlag(FLAG_PATCHES_RETURNED)
  }
}
