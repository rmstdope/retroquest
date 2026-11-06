import { Item, type GameState, characterName, writing } from '@/engine'

/** Faded missing-cat poster pinned to the notice board: Hemlock's plea for Patches. */
export class OldNotice extends Item {
  constructor() {
    super({
      name: 'old notice',
      description:
        'A faded piece of parchment pinned to the notice board. ' +
        'The ink has run, but you can make out the words:',
      shortName: 'notice',
    })
  }

  /** Show the description, then the poster's own words as unsigned writing. */
  override examine(_gameState: GameState): string {
    return (
      `${this.description}\n` +
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

  /** Give a save made before the poster could be read the current description. */
  override refreshSavedText(_gameState: GameState): void {
    this.description = new OldNotice().description
  }
}
