import { Item, type Character, type GameState } from '@/engine'
import { ShadowOfThePast } from '../characters/ShadowOfThePast'
import { MemoryVault } from '../rooms/MemoryVault'
import { MemoryOrbs } from './MemoryOrbs'
import { MirrorLabyrinth } from '../rooms/MirrorLabyrinth'
import { ServantsPendant } from './ServantsPendant'

/** What the stone says anywhere but in the maze. */
const STONE_OUTSIDE_MAZE =
  "The hall's voices murmur inside the Echo Stone, " +
  'waiting for somewhere that needs them. Under the rest, one voice says a ' +
  'single word over and over, the way a man says a word he has stopped ' +
  'believing in: redemption.'

/** What the stone says when taken again, wherever it was dropped. */
const PICKED_UP_AGAIN =
  "It is warm, and the hall's echoes still speak inside it."

/** What the stone is called, and how it looks, after the knight is redeemed. */
const ENHANCED_NAME = 'Enhanced Echo Stone'
const ENHANCED_DESCRIPTION =
  "The Echo Stone hums more strongly now. Among the hall's voices one speaks " +
  "clearly and without fear: the knight's, telling the truth."

/** What the enhanced stone does for now, anywhere. */
const ENHANCED_USE =
  'The voices inside the stone are clearer now, ' +
  'waiting for a place where memories sleep.'

/**
 * Carry the hall's echoes into the Mirror Labyrinth: the maze can only be
 * walked with the stone in the pack, and used there (alone or with the
 * pendant) it repeats the route. Once enhanced, it mends the orbs of the
 * Memory Vault.
 */
export class EchoStone extends Item {
  /** Set once the knight's voice has joined the stone. */
  private enhanced = false

  /** Set once the stone has been taken from its niche in the hall. */
  private liftedFromNiche = false

  constructor() {
    super({
      name: 'Echo Stone',
      description:
        'A smooth grey stone that hums with the voices of the Hall of Echoes. ' +
        'Held close, it repeats what the echoes know.',
      canBeCarried: true,
    })
  }

  /**
   * The line shown after the stone is taken: the niche beneath the hall's
   * banners only the first time, a plain line wherever it lies after that.
   */
  override pickedUp(_gameState: GameState): string {
    if (this.liftedFromNiche) return PICKED_UP_AGAIN
    this.liftedFromNiche = true
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
    return this.description
  }

  /** Use the stone alone: in the maze it repeats the route. */
  override use(gameState: GameState): string {
    if (this.enhanced) {
      const room = gameState.currentRoom
      if (room instanceof MirrorLabyrinth) return room.useStone(gameState)
      if (room instanceof MemoryVault) return room.mendOrbs(gameState)
      return ENHANCED_USE
    }
    return EchoStone.useInRoom(gameState)
  }

  /** The enhanced stone used on the Shadow does what it does in the vault. */
  override useOnCharacter(gameState: GameState, target: Character): string {
    if (target instanceof ShadowOfThePast) return this.use(gameState)
    return super.useOnCharacter(gameState, target)
  }

  /** Use the stone with the pendant: the same as using it alone. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof ServantsPendant) return this.use(gameState)
    if (other instanceof MemoryOrbs && this.enhanced) return this.use(gameState)
    return super.useWith(gameState, other)
  }

  /**
   * The one place stone and pendant meet: repeat the route when in the maze,
   * else the neutral line. Also used by the pendant.
   */
  static useInRoom(gameState: GameState): string {
    const room = gameState.currentRoom
    if (!(room instanceof MirrorLabyrinth)) return STONE_OUTSIDE_MAZE
    return room.useStone(gameState)
  }
}
