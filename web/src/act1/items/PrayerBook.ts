import { Item, type GameState } from '@/engine'

/** Religious artifact grounding village spirituality and hinting at mystical currents. */
export class PrayerBook extends Item {
  constructor() {
    super({
      name: 'prayer book',
      description:
        'A small, leather-bound book filled with prayers and hymns. ' +
        'The pages are worn from years of use.',
      shortName: 'book',
    })
  }

  /** Read the prayer book and return its mystical message. */
  read(_gameState: GameState): string {
    const eventMsg = `[event]You read the [item_name]${this.name}[/item_name].\n`
    return (
      eventMsg +
      ('The pages shimmer with shifting runes and cryptic sigils. As you try to focus, ' +
        "the words seem to rearrange themselves: 'By the moon's forgotten echo, let the " +
        "silent bells resound...'\nBut the rest dissolves into a swirl of arcane nonsense. " +
        'You feel a faint tingle in your fingertips.')
    )
  }
}
