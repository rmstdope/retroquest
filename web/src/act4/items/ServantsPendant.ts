import { Item, type GameState, event } from '@/engine'
import { EchoStone } from './EchoStone'
import { MirrorLabyrinth } from '../rooms/MirrorLabyrinth'

/** A pendant that allows communication with freed servants for guidance. */
export class ServantsPendant extends Item {
  private guidanceReceived = false

  constructor() {
    super({
      name: "Servant's Pendant",
      description:
        'A small blue crystal on a fine chain, from the freed servants. When ' +
        'you hold it, it feels as if someone is standing just behind you, ' +
        'ready to point the way.',
      canBeCarried: true,
    })
  }

  /** Use the pendant with the Echo Stone: the same as using the stone. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof EchoStone) return other.use(gameState)
    return super.useWith(gameState, other)
  }

  /** Use the pendant to receive guidance from freed servants. */
  override use(gameState: GameState): string {
    if (gameState.currentRoom instanceof MirrorLabyrinth) {
      if (!this.guidanceReceived) {
        this.guidanceReceived = true
        return event(
          "You hold up the pendant, and the servants' voices come faint " +
            "through the crystal: 'We polished these mirrors for years, and " +
            'they lied to us every day. Only the dead in the old hall have ' +
            "nothing left to lie about. Bring us their voices.'",
        )
      }
      return (
        "[dim]The pendant's voices have said what they know. They are " +
        'waiting for the echoes.[/dim]'
      )
    }
    return event(
      'The pendant glows faintly. Whoever is behind you has nothing to ' +
        'say here.',
    )
  }
}
