import { Item, type GameState, characterName, writing } from '@/engine'

/** Faded piece of parchment pinned to the notice board, may contain a clue or warning. */
export class OldNotice extends Item {
  constructor() {
    super({
      name: 'old notice',
      description:
        'A faded piece of parchment pinned to the notice board. ' +
        'The writing is barely legible, but it might contain a clue or warning.',
      shortName: 'notice',
    })
  }

  /** Read the notice and return its message. */
  read(_gameState: GameState): string {
    return (
      'The notice is weathered and old, but you can make out some of the words:\n\n' +
      writing(
        `[bold]MISSING[/bold] - Our dear cat, ${characterName('Patches')}, has vanished. ` +
          'Last seen near the old well. ' +
          'She is very friendly but easily spooked. Responds to her name. ' +
          `If found, please return to the ${characterName('Hemlock')} family ` +
          'at the General Store. ' +
          'A small reward is offered.',
      )
    )
  }
}
