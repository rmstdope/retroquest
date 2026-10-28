import { Spell, type GameState, type Item } from '@/engine'

/** Spell read off the glade stone; delegates growth to items. */
export class GrowSpell extends Spell {
  constructor() {
    super({
      id: 'grow',
      name: 'grow',
      description:
        'Read word by word off the mossy stone in the glade. It feels like ' +
        'your own.',
    })
  }

  override castSpell(_gameState: GameState): string {
    return (
      'The grass at your feet stands a little taller. ' +
      'Nothing here was waiting for it.'
    )
  }

  override castOnItem(gameState: GameState, item: Item): string {
    return item.grow(gameState)
  }
}
