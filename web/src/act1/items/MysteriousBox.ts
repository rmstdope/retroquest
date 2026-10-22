import { Item, type GameState, event, writing } from '@/engine'
import { GameMap } from './GameMap'

/** The words Elior's father left in the box for him. */
const FATHERS_NOTE = 'For when the light comes back to you.'

/**
 * Small locked container introducing multi-step acquisition and object state
 * transitions. Elior's father sealed it in his workshop so that only Elior's
 * magic could open it; inside are the map and a note in the father's hand.
 */
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
      const eventMsg = event(`You try to unlock the ${nameHtml}.`) + '\n'
      return (
        eventMsg +
        `A soft click is heard from the ${nameHtml} as the lock springs open!`
      )
    }
    return `[failure]The ${nameHtml} is already unlocked.[/failure]`
  }

  /**
   * Open the box if unlocked, dispense the map and show the father's note,
   * which stays in the box; otherwise report it locked or empty.
   */
  override open(gameState: GameState): string {
    const nameHtml = `[item_name]${this.name}[/item_name]`
    if (this.locked) {
      return (
        `[failure]The ${nameHtml} is locked, and there is no keyhole. The ` +
        'runes around the lid are the only way in, and they do not answer ' +
        'to hands.[/failure]'
      )
    }
    if (this.containsMap) {
      gameState.addItemToInventory(new GameMap())
      this.containsMap = false
      const note = writing(FATHERS_NOTE)
      this.description =
        'An open, ornate wooden box. Only a folded note remains inside, in ' +
        `your father's careful, slanting hand:\n${note}`
      return (
        event(`You open the ${nameHtml}.`) +
        '\n' +
        'Inside, you find a [item_name]map[/item_name]! You take the ' +
        '[item_name]map[/item_name] and place it in your inventory.\n' +
        'Beneath it lies a folded note. Something in you knows the careful, ' +
        "slanting hand before you have read a word: it is your father's.\n" +
        note +
        '\nThe runes on the lid fade as you read, their work done. The box was ' +
        'sealed so that only your magic could ever open it.'
      )
    }
    return event(`The ${nameHtml} is now empty.`)
  }
}
