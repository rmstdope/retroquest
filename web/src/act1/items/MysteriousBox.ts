import { Item, type GameState, writing, clue } from '@/engine'
import { DullKnife } from './DullKnife'
import { FATHERS_NOTE, FathersNote, NOTE_NAMES } from './FathersNote'
import { GameMap } from './GameMap'
import { SharpKnife } from './SharpKnife'

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

  /** Once opened, the box also answers to the note left inside it. */
  override answersTo(name: string): boolean {
    if (super.answersTo(name)) return true
    return !this.containsMap && NOTE_NAMES.includes(name.toLowerCase())
  }

  /**
   * Named by the note's words, the opened box hands back the note, so every
   * verb tried on the note is answered by the note and never by the box.
   */
  override partNamed(name: string): Item {
    return super.answersTo(name) ? this : new FathersNote()
  }

  /**
   * A knife at the lid finds no seam and no keyhole, which points back at the
   * runes; once unlocked there is nothing for a blade to do.
   */
  override answerUseFrom(_gameState: GameState, item: Item): string {
    if (!(item instanceof DullKnife || item instanceof SharpKnife)) return ''
    if (!this.locked) {
      return (
        `[failure]The [item_name]${this.name}[/item_name] is already ` +
        'unlocked; there is nothing for a blade to do.[/failure]'
      )
    }
    return clue(
      'The blade finds no seam to work and no keyhole to pick. ' +
        'The runes around the lid are the only way in, and they do not answer ' +
        'to steel.',
    )
  }

  /** Unlock the box if locked, otherwise report already unlocked (called by UnlockSpell). */
  unlock(_gameState: GameState): string {
    const nameHtml = `[item_name]${this.name}[/item_name]`
    if (this.locked) {
      this.locked = false
      this.description =
        `A small, ornate wooden ${nameHtml} covered in ` +
        'strange runes. The lock has clicked open.'
      return `A soft click is heard from the ${nameHtml} as the lock springs open!`
    }
    return `[failure]The ${nameHtml} is already unlocked.[/failure]`
  }

  /**
   * Open the box if unlocked, dispense the map and show the father's note,
   * which stays in the box; otherwise say it is locked, or that it lies open
   * with only the note inside.
   */
  override open(gameState: GameState): string {
    const nameHtml = `[item_name]${this.name}[/item_name]`
    if (this.locked) {
      return clue(
        `The ${nameHtml} is locked, and there is no keyhole. The ` +
          'runes around the lid are the only way in, and they do not answer ' +
          'to hands.',
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
        'Inside, you find a [item_name]map[/item_name]! You take the ' +
        '[item_name]map[/item_name] and place it in your inventory.\n' +
        'Beneath it lies a folded note. Something in you knows the careful, ' +
        "slanting hand before you have read a word: it is your father's.\n" +
        note +
        '\nThe runes on the lid fade as you read, their work done. The box was ' +
        'sealed so that only your magic could ever open it.'
      )
    }
    return (
      `The ${nameHtml} lies open. Only your father's note remains ` + 'inside.'
    )
  }
}
