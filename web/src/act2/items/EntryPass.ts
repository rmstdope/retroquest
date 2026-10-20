import { Item, type GameState } from '@/engine'

/** Credential document that grants passage through Greendale's gates. */
export class EntryPass extends Item {
  constructor() {
    super({
      name: 'entry pass',
      shortName: 'pass',
      description:
        'An official-looking document with the seal of Greendale. It appears to ' +
        'grant passage through the city gates to those who present it to the guards.',
      canBeCarried: true,
    })
  }

  /** Inspect the seal on the pass. */
  override use(_gameState: GameState): string {
    return (
      'You examine the entry pass. The seal looks authentic, and it should allow ' +
      'you passage into Greendale without question.'
    )
  }
}
