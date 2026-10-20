import { Item, type GameState } from '@/engine'

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
    const eventMsg = `[event]You read the [item_name]${this.name}[/item_name].[/event]\n`
    return (
      eventMsg +
      ('The notice is weathered and old, but you can make out some of the words:\n\n' +
        '"[bold]MISSING[/bold] - Our dear cat, Patches, has vanished. ' +
        'Last seen near the old well. ' +
        'She is very friendly but easily spooked. Responds to her name. ' +
        'If found, please return to the Hemlock family at the General Store. ' +
        'A small reward is offered."')
    )
  }
}
