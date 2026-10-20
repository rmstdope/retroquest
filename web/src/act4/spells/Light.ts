import { Spell, type GameState, type Item, event } from '@/engine'

/** A spell that creates brilliant light to dispel darkness and shadow magic. */
export class Light extends Spell {
  constructor() {
    super({
      name: 'light',
      description:
        'Creates a brilliant burst of pure light that illuminates dark areas ' +
        'and can dispel shadow magic or reveal hidden objects.',
    })
  }

  /** Cast light spell without a specific target. */
  override castSpell(gameState: GameState): string {
    // Every room has a light hook; rooms without a special effect answer by default
    return gameState.currentRoom.light(gameState)
  }

  /** Cast light spell on a specific item. */
  override castOnItem(gameState: GameState, targetItem: Item): string {
    if (['ward stones', 'ward stone'].includes(targetItem.name.toLowerCase())) {
      // Special handling for ward stones in Fortress Gates
      return gameState.currentRoom.light(gameState)
    }
    return event(
      `You shine light on the [item_name]${targetItem.name}[/item_name], ` +
        'illuminating it clearly, but the light has no special effect.',
    )
  }
}
