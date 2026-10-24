import { Item, type GameState } from '@/engine'
import { WildBerries } from './WildBerries'

/** Environment vegetation that can be magically stimulated to generate wild berries. */
export class Bush extends Item {
  constructor() {
    super({
      name: 'bush',
      description:
        'A dense, leafy bush. It looks like it might be hiding something,' +
        ' or just be a bush.',
      shortName: 'bush',
      canBeCarried: false,
    })
  }

  /**
   * Revive greens the bush and nothing more: a rewarded second use of the
   * spell, and a nudge that fruit wants a different spell.
   */
  revive(_gameState: GameState): string {
    return (
      'The bush greens under your hand, every leaf at once. Life it has. ' +
      'It bears nothing; fruit wants something else of you.'
    )
  }

  /** Cast grow spell to generate wild berries if not present. */
  override grow(gameState: GameState): string {
    const currentRoom = gameState.currentRoom
    if (!currentRoom.getItemByName('wild berries')) {
      currentRoom.addItem(new WildBerries())
      return (
        'The [item_name]bush[/item_name] flourishes, and clusters of ' +
        '[item_name]wild berries[/item_name] appear among its leaves!'
      )
    }
    return (
      '[failure]The [item_name]bush[/item_name] is already full of ' +
      '[item_name]wild berries[/item_name].[/failure]'
    )
  }
}
