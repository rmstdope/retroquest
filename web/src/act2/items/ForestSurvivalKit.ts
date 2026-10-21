import { Item, type GameState, characterName, event, speech } from '@/engine'
import {
  FLAG_HERMITS_WARNING_ACCEPTED,
  FLAG_HERMITS_WARNING_COMPLETED,
} from '../Act2StoryFlags'
import { ForestTransition } from '../rooms/ForestTransition'

/** Comprehensive kit providing supplies and guidance for safe forest travel. */
export class ForestSurvivalKit extends Item {
  constructor() {
    super({
      name: 'forest survival kit',
      shortName: 'kit',
      description:
        'A comprehensive kit containing everything needed for safe forest exploration: ' +
        'dried food, water purification tablets, protective gear, a compass, and magical ' +
        'wards against forest spirits.',
      canBeCarried: true,
    })
  }

  /** Use the kit; in the Forest Transition it plays the camp scene that completes the hermit's warning. */
  override use(gameState: GameState): string {
    // Check if we're in Forest Transition for special handling
    const currentRoom = gameState.currentRoom
    if (currentRoom instanceof ForestTransition) {
      if (!gameState.getStoryFlag(FLAG_HERMITS_WARNING_ACCEPTED)) {
        return (
          '[failure]A robed figure is sitting among the stones, watching you. ' +
          "Making camp on someone's doorstep without a word seems rude.[/failure]"
        )
      }
      gameState.setStoryFlag(FLAG_HERMITS_WARNING_COMPLETED, true)
      gameState.removeItemFromInventory('forest survival kit')

      return (
        event(
          `You open the [item_name]${this.name}[/item_name] at the foot of the ` +
            'standing stones.',
        ) +
        '\n\n' +
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
      'You examine the forest survival kit. It contains high-quality gear that would ' +
      'provide essential protection and tools for navigating dangerous forest areas ' +
      'safely. Now is not the time to use it.'
    )
  }
}
