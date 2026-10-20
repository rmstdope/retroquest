import { Item, type GameState } from '@/engine'

/**
 * A fixed mounting point for prism lanterns in ritual spaces. Cannot be carried;
 * tracks whether a lantern is currently mounted and examines accordingly.
 */
export class LanternBracket extends Item {
  hasLantern = false

  constructor() {
    super({
      name: 'Lantern Bracket',
      description:
        'A carved niche fitted with a brass bracket, sized for a prism lantern.',
      shortName: 'bracket',
      canBeCarried: false,
    })
  }

  /** Report current lantern status. */
  override examine(_gameState: GameState): string {
    if (this.hasLantern) {
      return 'A prism lantern rests here, ready to be lit.'
    }
    return 'An empty bracket waits for a lantern.'
  }

  /** Mark that a lantern has been placed in the bracket. */
  putLantern(): void {
    this.hasLantern = true
    this.name = 'Mounted Lantern'
    this.shortName = 'mounted lantern'
  }
}
