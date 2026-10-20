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

  /** Cast grow spell to generate wild berries if not present. */
  override grow(gameState: GameState): string {
    const currentRoom = gameState.currentRoom
    if (!currentRoom.getItemByName('wild berries')) {
      currentRoom.addItem(new WildBerries())
      return (
        '[event]You cast the [spell_name]grow[/spell_name] spell on the ' +
        '[item_name]bush[/item_name]. It flourishes, and clusters of ' +
        '[item_name]wild berries[/item_name] appear among its leaves![/event]'
      )
    }
    return (
      '[failure]The [item_name]bush[/item_name] is already full of ' +
      '[item_name]wild berries[/item_name].[/failure]'
    )
  }
}
