import { Item, type GameState, event } from '@/engine'
import { FLAG_ACT4_SERVANTS_PENDANT_ACQUIRED } from '../Act4StoryFlags'

/** A pendant that allows communication with freed servants for guidance. */
export class ServantsPendant extends Item {
  private guidanceReceived = false

  constructor() {
    super({
      name: "Servant's Pendant",
      description:
        'A delicate crystal pendant suspended on a fine chain. The crystal ' +
        'pulses with a gentle blue light and contains the grateful essence ' +
        'of the freed servants. Through this pendant, their knowledge and ' +
        'guidance can assist you in navigating treacherous paths.',
      canBeCarried: true,
    })
  }

  /** Set flag when the pendant is picked up. */
  override pickedUp(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT4_SERVANTS_PENDANT_ACQUIRED, true)
    return ''
  }

  /** Use the pendant to receive guidance from freed servants. */
  override use(gameState: GameState): string {
    if (gameState.currentRoom.name === 'Mirror Labyrinth') {
      if (!this.guidanceReceived) {
        this.guidanceReceived = true
        return event(
          "You hold the Servant's Pendant and feel a warm connection " +
            'to the freed servants. Their voices whisper guidance through the ' +
            "crystal: 'The mirrors show many paths, but only echoes from the " +
            "ancient halls reveal the true way forward.'",
        )
      }
      return (
        '[dim]The servants have already shared their guidance about the ' +
        'mirror labyrinth.[/dim]'
      )
    }
    return event(
      "The Servant's Pendant glows softly, ready to provide guidance " +
        'when you need their knowledge.',
    )
  }
}
