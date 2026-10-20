import { Item, type GameState } from '@/engine'

/** A sturdy walking stick that aids travel and provides minor protection. */
export class WalkingStick extends Item {
  constructor() {
    super({
      name: 'walking stick',
      shortName: 'stick',
      description:
        'A sturdy wooden walking stick worn smooth by many travelers. ' +
        'It provides reliable support on mountain paths and could serve ' +
        'as a makeshift weapon if needed.',
      canBeCarried: true,
    })
  }

  override use(_gameState: GameState): string {
    return (
      'You lean on the walking stick, feeling more steady on the rocky path. ' +
      "It's a small comfort and a reliable companion for any journey."
    )
  }
}
