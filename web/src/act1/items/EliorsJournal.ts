import {
  type NameOptions,
  Item,
  type GameState,
  characterName,
  writing,
} from '@/engine'

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

  /**
   * Read the latest journal entry, in four paragraphs, and set a story flag.
   */
  override use(gameState: GameState): string {
    const entry =
      'The ink is slightly smudged on this page, as if written in haste or with a ' +
      'trembling hand...\n\n' +
      writing(
        'The storm kept me up half the night. Then a light split the sky ' +
          'over the fields, and it was not lightning.',
      ) +
      '\n\n' +
      writing(
        'When I slept, I dreamed. Dark, and rain on shutters I could not see. ' +
          "A man's hand lifted a child out of the dark. " +
          'There was a tune, three notes up and home again, ' +
          'and a tall figure that whispered my name. ' +
          'When I answered it, it said three words more, ' +
          'and I wrote them down the moment I woke so I would not lose them: ' +
          '…and let them rest…',
      ) +
      '\n\n' +
      writing(
        "I knew that voice. Not the way you know a neighbour's, " +
          'but the way you know a song someone sang to you before you had ' +
          'words for it. It made my chest ache. ' +
          "I can't think from where.",
      ) +
      '\n\n' +
      writing(
        'When I woke, the tune was still going. ' +
          'Someone out by the hearth was humming it.',
      ) +
      '\n'
    gameState.setStoryFlag('journal_read_prologue_entry', true)
    return entry
  }

  /** Named after a person, so it takes no "the" and keeps its capitals. */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, bare: true })
  }
}
