import { Item, type GameState } from '@/engine'
import { LanternBracket } from './LanternBracket'

/** A prismatic lantern used to illuminate underwater passages. */
export class PrismLantern extends Item {
  constructor() {
    super({
      name: 'Prism Lantern',
      description:
        'A faceted lantern of glass ribs and brass, made to scatter light ' +
        'into clear paths.',
      shortName: 'lantern',
      canBeCarried: true,
    })
  }

  /** Mount the lantern through the current room when used with the bracket. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof LanternBracket) {
      const room = gameState.currentRoom
      const hook = (room as { mountLantern?: (gs: GameState) => string })
        .mountLantern
      if (typeof hook === 'function') return hook.call(room, gameState)
    }
    return super.useWith(gameState, other)
  }
}
