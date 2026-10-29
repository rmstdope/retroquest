import { Item, type GameState, characterName, clue, speech } from '@/engine'
import {
  FLAG_HERMITS_WARNING_ACCEPTED,
  QUEST_HERMITS_WARNING,
} from '../Act2StoryFlags'
import { ForestTransition } from '../rooms/ForestTransition'

/** The item's description; `Act2.afterLoad` restores it in older saves. */
export const FOREST_SURVIVAL_KIT_DESCRIPTION =
  'A canvas roll with everything for a night in the open: dried food, ' +
  'flint and steel, a water skin, a blanket, and a ring of small warding ' +
  'stones to set round where you sleep.'

/** Canvas roll of camp supplies and warding stones for a night at the standing stones. */
export class ForestSurvivalKit extends Item {
  constructor() {
    super({
      name: 'forest survival kit',
      shortName: 'kit',
      description: FOREST_SURVIVAL_KIT_DESCRIPTION,
      canBeCarried: true,
    })
  }

  /** Use the kit; in the Forest Transition it plays the camp scene that completes the hermit's warning. */
  override use(gameState: GameState): string {
    // Check if we're in Forest Transition for special handling
    const currentRoom = gameState.currentRoom
    if (currentRoom instanceof ForestTransition) {
      if (!gameState.getStoryFlag(FLAG_HERMITS_WARNING_ACCEPTED)) {
        return clue(
          'A robed figure is sitting among the stones, watching you. ' +
            "Making camp on someone's doorstep without a word seems rude.",
        )
      }
      gameState.getQuest(QUEST_HERMITS_WARNING)?.complete(gameState)
      gameState.removeItemFromInventory('forest survival kit')

      return (
        'Dusk comes early under the trees. You make a small fire in the lee of ' +
        "the stones, eat from the rations, set the kit's wards around your " +
        'blanket and sleep with your back to the oldest stone.' +
        '\n\n' +
        'You dream of a field of grey stalks and of someone at its far edge, ' +
        'too far away to see. Nobody speaks.' +
        '\n\n' +
        `You wake to grey light and woodsmoke. The ${characterName('forest hermit')} ` +
        'is sitting by the embers, feeding them twigs.' +
        '\n\n' +
        speech(
          "You slept on her doorstep and she let you. That's a start. Go on, then.",
        )
      )
    }
    // Default behavior for other rooms
    return (
      'The forest survival kit contains high-quality gear that would ' +
      'provide essential protection and tools for navigating dangerous forest areas ' +
      'safely. Now is not the time to use it.'
    )
  }
}
