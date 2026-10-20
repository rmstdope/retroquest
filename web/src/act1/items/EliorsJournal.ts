import { Item, type GameState, characterName, event, writing } from '@/engine'

/** Elior's personal journal containing lore and story hints. */
export class EliorsJournal extends Item {
  constructor() {
    super({
      name: "elior's journal",
      description:
        `A leather-bound journal filled with ${characterName('Elior')}'s careful ` +
        'handwriting. The pages ' +
        'are full of notes, sketches, and secrets.',
      shortName: 'journal',
    })
  }

  /** Read the latest journal entry and set a story flag. */
  override use(gameState: GameState): string {
    const entry =
      'The ink is slightly smudged on this page, as if written in haste or with a ' +
      'trembling hand...\n\n' +
      writing(
        'What a night. The wind howled like a hungry wolf, and rain lashed ' +
          'against the shutters. I swear the whole cottage shook with each thunderclap. ' +
          'Sleep was impossible for hours. Then, through a gap in the curtains, I saw it ' +
          "– a searing, unnatural light that split the sky. It wasn't lightning; it was... " +
          'different. Pulsating, almost.\n\nWhen I finally drifted off, the dreams came. ' +
          'Not the usual ones of fields and harvests. This was dark, filled with swirling ' +
          'shadows. And a figure, tall and indistinct, its voice a whisper on the edge of ' +
          'hearing, yet it felt like it was calling my name. ' +
          `${characterName('Elior')}... I woke with a start, ` +
          'my heart pounding. Even now, the memory sends a shiver down my spine. ' +
          'And the strangest thing — I knew that voice. ' +
          "I just can't remember from where. What did it mean?",
      ) +
      '\n'
    const eventMsg =
      event(
        'You open your [item_name]journal[/item_name] and begin to read the latest entry.',
      ) + '\n'
    gameState.setStoryFlag('journal_read_prologue_entry', true)
    return eventMsg + entry
  }
}
