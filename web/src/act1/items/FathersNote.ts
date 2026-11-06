import { Item, type GameState, type NameOptions, clue, writing } from '@/engine'

/** The words Elior's father left in the box for him. */
export const FATHERS_NOTE = 'For when the light comes back to you.'

/** The words a player may use for the note once the box is open. */
export const NOTE_NAMES = ['note', 'folded note', "father's note"]

/**
 * The folded note Elior's father left in the mysterious box. It never lies
 * in a room of its own: the opened box hands it back for the note's words
 * (`MysteriousBox.partNamed`), so whatever the player tries on the note is
 * answered by the note. It stays in the box.
 */
export class FathersNote extends Item {
  constructor() {
    super({
      name: "father's note",
      shortName: 'note',
      description:
        "A folded note in your father's careful, slanting hand:\n" +
        writing(FATHERS_NOTE),
    })
  }

  /** Answers to every word the box accepts for the note. */
  override answersTo(name: string): boolean {
    return NOTE_NAMES.includes(name.toLowerCase())
  }

  /** The note is Elior's father's, so it reads "your father's note". */
  override nameInSentence(options?: NameOptions): string {
    const your = options?.atStart ? 'Your' : 'your'
    return `${your} [item_name]${this.name}[/item_name]`
  }

  /** The note stays where Elior's father left it. */
  override preventPickup(_gameState: GameState): string {
    return clue('The note stays in the box, where your father left it for you.')
  }

  /** The note was unfolded when the box was opened; there is nothing more to open. */
  override open(_gameState: GameState): string {
    return "The box holds only your father's note, already unfolded."
  }
}
