import { Item, type GameState, event } from '@/engine'
import { MirrorLabyrinth } from '../rooms/MirrorLabyrinth'
import { ServantsPendant } from './ServantsPendant'

/** What the stone says anywhere but in the maze. */
const STONE_OUTSIDE_MAZE =
  "You hold the Echo Stone to your ear. The hall's voices murmur inside it, " +
  'waiting for somewhere that needs them.'

/** What the stone is called, and how it looks, after the knight is redeemed. */
const ENHANCED_NAME = 'Enhanced Echo Stone'
const ENHANCED_DESCRIPTION =
  "The Echo Stone hums more strongly now. Among the hall's voices one speaks " +
  "clearly and without fear: the knight's, telling the truth."

/** What the enhanced stone does for now, anywhere. */
const ENHANCED_USE =
  'You hold the stone to your ear. The voices inside it are clearer now, ' +
  'waiting for a place where memories sleep.'

/**
 * Carry the hall's echoes into the Mirror Labyrinth: used there together with
 * the Servant's Pendant (in any of the agreed forms) it solves the maze.
 */
export class EchoStone extends Item {
  /** Set once the knight's voice has joined the stone. */
  private enhanced = false

  constructor() {
    super({
      name: 'Echo Stone',
      description:
        'A smooth grey stone that hums with the voices of the Hall of Echoes. ' +
        'Held close, it repeats what the echoes know.',
      canBeCarried: true,
    })
  }

  /** The line shown after the stone is taken. */
  override pickedUp(_gameState: GameState): string {
    return (
      'You lift a smooth grey stone from a niche beneath the banners. It is ' +
      "warm, and when you hold it to your ear you hear the hall's echoes still " +
      'speaking inside it.'
    )
  }

  /** The knight's voice joins the stone: it is renamed and changes its look. */
  enhance(): void {
    this.enhanced = true
    this.name = ENHANCED_NAME
    this.description = ENHANCED_DESCRIPTION
  }

  /** The enhanced stone's look. */
  override examine(_gameState: GameState): string {
    return event(this.description)
  }

  /** Use the stone alone: in the maze it solves it when the pendant is carried. */
  override use(gameState: GameState): string {
    if (this.enhanced) return event(ENHANCED_USE)
    return EchoStone.useInRoom(gameState)
  }

  /** Use the stone with the pendant: the same as using it alone. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof ServantsPendant) return this.use(gameState)
    return super.useWith(gameState, other)
  }

  /**
   * The one place stone and pendant meet: solve the maze when in it, else
   * the neutral line. Also used by the pendant.
   */
  static useInRoom(gameState: GameState): string {
    const room = gameState.currentRoom
    if (!(room instanceof MirrorLabyrinth)) return event(STONE_OUTSIDE_MAZE)
    return room.solve(gameState)
  }
}
