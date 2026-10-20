import { Item, type GameState } from '@/engine'
import { GameMap } from './GameMap'

/** Small locked container introducing multi-step acquisition and object state transitions. */
export class MysteriousBox extends Item {
  locked = true
  containsMap = true

  constructor() {
    super({
      name: 'mysterious box',
      description:
        'A small, ornate wooden box covered in strange runes. The lid is ' +
        'tightly shut, and it feels oddly heavy for its size. You sense ' +
        'something important is hidden inside.',
      shortName: 'box',
    })
  }

  /** Unlock the box if locked, otherwise report already unlocked (called by UnlockSpell). */
  unlock(_gameState: GameState): string {
    const nameHtml = `[item_name]${this.name}[/item_name]`
    if (this.locked) {
      this.locked = false
      this.description =
        `A small, ornate wooden ${nameHtml} covered in ` +
        'strange runes. The lock has clicked open.'
      const eventMsg = `[event]You try to unlock the ${nameHtml}.[/event]\n`
      return (
        eventMsg +
        `A soft click is heard from the ${nameHtml} as the lock springs open!`
      )
    }
    return `[failure]The ${nameHtml} is already unlocked.[/failure]`
  }

  /** Open the box if unlocked and dispense the map, otherwise report locked or empty. */
  override open(gameState: GameState): string {
    const nameHtml = `[item_name]${this.name}[/item_name]`
    if (this.locked) {
      return (
        `[failure]The ${nameHtml} is locked. You need to find a way to open it.` +
        '[/failure]'
      )
    }
    if (this.containsMap) {
      gameState.addItemToInventory(new GameMap())
      this.containsMap = false
      this.description = 'An open, ornate wooden box. It is now empty.'
      return (
        `[event]You open the ${nameHtml}.[/event]\n` +
        'Inside, you find a [item_name]map[/item_name]! You take the ' +
        '[item_name]map[/item_name] and place it in your inventory.'
      )
    }
    return `[event]The ${nameHtml} is now empty.[/event]`
  }
}
