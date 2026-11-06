import { Quest, type GameState, characterName } from '@/engine'
import {
  FLAG_MET_HEMLOCK,
  FLAG_PATCHES_FOUND,
  FLAG_PATCHES_RETURNED,
  FLAG_PATCHES_STAYED_WITH_GRANDMOTHER,
  FLAG_READ_HEMLOCK_NOTICE,
} from '../Act1StoryFlags'
import { AbandonedShed } from '../rooms/AbandonedShed'

/** The opening once Elior has heard from Hemlock why the store is shut. */
const HEARD_FROM_HEMLOCK =
  `Old Man ${characterName('Hemlock')} has shut the ` +
  '[room_name]General Store[/room_name] until his cat, ' +
  `${characterName('Patches')}, comes home. ` +
  'She was last seen near the old well, where a locked shed keeps its ' +
  'secrets. What will you discover if you find a way inside?'

/** The opening once Elior has read the notice, before meeting Hemlock. */
const READ_THE_NOTICE =
  'The notice on the village board says ' +
  `${characterName('Patches')}, the ${characterName('Hemlock')} family's cat, ` +
  'has vanished, last seen near the old well, and a small reward is ' +
  'offered. By the well, a locked shed keeps its secrets. ' +
  'What will you discover if you find a way inside?'

/** The opening when the frightened mew in the shed is the first Elior hears of her. */
const HEARD_IN_THE_SHED =
  'From the shadows of the [room_name]Abandoned Shed[/room_name] came a ' +
  'frightened mew, and a small patchwork shape bolted behind the broken ' +
  `crates. It looked a lot like ${characterName('Patches')}, the cat who ` +
  'sleeps on the counter of the [room_name]General Store[/room_name].'

/**
 * Side quest: find Patches, the Hemlock family's missing cat, hiding in the
 * locked Abandoned Shed, and carry her home to the General Store, or let
 * her stay with Elior's grandmother, who sends word to Hemlock.
 */
export class CuriosityKilledTheCatQuest extends Quest {
  constructor() {
    super({
      name: 'Curiosity killed the cat',
      description: HEARD_FROM_HEMLOCK,
      completion:
        `You carried ${characterName('Patches')} home to Old Man ` +
        `${characterName('Hemlock')}, and the [room_name]General Store[/room_name] ` +
        'is open again. Curiosity did not kill this cat after all.',
    })
  }

  /**
   * Starts when Elior first hears of Patches: from Hemlock, from the notice,
   * or from her mew as the shed door opens (or when she is found). The
   * opening tells it the way he heard it.
   */
  override checkTrigger(gameState: GameState): boolean {
    if (gameState.getStoryFlag(FLAG_MET_HEMLOCK)) {
      this.description = HEARD_FROM_HEMLOCK
    } else if (gameState.getStoryFlag(FLAG_READ_HEMLOCK_NOTICE)) {
      this.description = READ_THE_NOTICE
    } else if (
      CuriosityKilledTheCatQuest.shedOpen(gameState) ||
      gameState.getStoryFlag(FLAG_PATCHES_FOUND)
    ) {
      this.description = HEARD_IN_THE_SHED
    } else {
      return false
    }
    return true
  }

  /** Whether the shed door has been opened, and Patches heard inside. */
  private static shedOpen(gameState: GameState): boolean {
    const shed = gameState.allRooms.AbandonedShed
    return shed instanceof AbandonedShed && !shed.locked
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
