import { Item, type GameState, writing } from '@/engine'

/** The ring as Elior sees it, built on demand so older saves show the initials. */
function ringDescription(): string {
  return (
    'A silver ring with a small, sparkling gemstone. ' +
    'Inside the band, worn almost smooth, two initials are engraved:' +
    writing('A & L') +
    "\nYour father's and your mother's. This was your mother's wedding ring."
  )
}

/**
 * Elior's mother's silver wedding ring, fished out of the purified well.
 * Elior may trade it to the merchant for boots or keep it.
 */
export class ShinyRing extends Item {
  constructor() {
    super({
      name: 'shiny ring',
      shortName: 'ring',
      description: ringDescription(),
      canBeCarried: true,
    })
  }

  /**
   * Shows the engraved initials. The text is rebuilt first, so a ring
   * restored from an older save shows them too.
   */
  override examine(gameState: GameState): string {
    this.description = ringDescription()
    return super.examine(gameState)
  }
}
