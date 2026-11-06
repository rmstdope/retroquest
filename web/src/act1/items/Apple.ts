import { Item, nameInSentence, speech, type GameState } from '@/engine'

/**
 * Basic food item. The store's apple is never sold or taken: the shopkeeper
 * hands one over with every purchase.
 */
export class Apple extends Item {
  constructor() {
    super({
      name: 'apple',
      description: 'A red apple, firm, with an unbroken skin.',
    })
  }

  /** Answers to "apples" too, the word the store's shelves and Hemlock use. */
  override answersTo(name: string): boolean {
    return super.answersTo(name) || name.toLowerCase() === 'apples'
  }

  /**
   * Shopkeeper prevents taking the store's apple: it is neither sold nor
   * free, but comes with every purchase.
   */
  override preventPickup(): string {
    if (!this.canBeCarried) {
      return (
        nameInSentence('character', 'Hemlock', { atStart: true }) +
        ' quickly steps over. ' +
        speech(
          `Hold on there, friend! The [item_name]${this.name}s[/item_name] ` +
            "aren't for the taking. There's one with everything you buy.",
        )
      )
    }
    return ''
  }

  /** The line the story tells when Elior takes it, wherever it is lying. */
  override pickedUp(_gameState: GameState): string {
    return (
      'It is crisp and cold, and nearly too red. ' + 'You save it for later.'
    )
  }
}
