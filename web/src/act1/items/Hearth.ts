import { Item, type GameState } from '@/engine'
import { Lantern } from './Lantern'

/** The cottage hearth: fixed scenery that the room description names. */
export class Hearth extends Item {
  constructor() {
    super({
      name: 'hearth',
      description:
        'A fire burns low in the stone hearth, ' +
        'and the bricks above it are black from many winters.',
      canBeCarried: false,
    })
  }

  /** The hearth also answers to "fire", as the room's description says. */
  override otherNames(): string[] {
    return ['fire']
  }

  /**
   * Holding the lantern to the hearth lights it exactly as using it does: a
   * dark lantern takes a new sentence first, then its own reveal line; a lit
   * one gives its own "already lit" answer.
   */
  override answerUseFrom(gameState: GameState, item: Item): string {
    if (!(item instanceof Lantern)) return ''
    const wasDark = !item.isLit()
    const answer = item.use(gameState)
    return wasDark
      ? `You touch the wick to a coal, and it takes. ${answer}`
      : answer
  }
}
