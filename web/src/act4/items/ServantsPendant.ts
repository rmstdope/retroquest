import { Item, type GameState } from '@/engine'
import { EchoStone } from './EchoStone'
import { MirrorLabyrinth } from '../rooms/MirrorLabyrinth'

/** A pendant that allows communication with freed servants for guidance. */
export class ServantsPendant extends Item {
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

  /** Use the pendant: in the maze it shows the way at the fork, elsewhere it glows. */
  override use(gameState: GameState): string {
    const room = gameState.currentRoom
    if (room instanceof MirrorLabyrinth) return room.usePendant(gameState)
    return (
      'The pendant glows faintly. Whoever is behind you has nothing to ' +
      'say here.'
    )
  }
}
