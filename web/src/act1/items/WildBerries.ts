import { Item, type GameState } from '@/engine'

/** Foraged berries that may be edible but carry risk; currently flavor-only. */
export class WildBerries extends Item {
  constructor() {
    super({
      name: 'wild berries',
      description:
        "A handful of small, juicy berries. They look edible, but you can't be " +
        "sure they're safe.",
      shortName: 'berries',
      canBeCarried: true,
    })
  }

  /** The line the story tells when Elior takes it, wherever it is lying. */
  override pickedUp(_gameState: GameState): string {
    return (
      'They stain your fingers dark. ' + 'You do not know yet if they are safe.'
    )
  }
}
