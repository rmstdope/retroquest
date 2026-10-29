import { Item, type GameState, writing } from '@/engine'

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

  /** Read the prayer book: the hymn for the bell, set apart as the book's own words. */
  read(_gameState: GameState): string {
    return (
      'The book falls open by itself at a page worn soft with reading: ' +
      'the hymn for the bell.\n' +
      writing('Ring for the ones who go, and ring them home.')
    )
  }

  /** Using the book reads it, as using Elior's journal does: the game has no read verb. */
  override use(gameState: GameState): string {
    return this.read(gameState)
  }
}
