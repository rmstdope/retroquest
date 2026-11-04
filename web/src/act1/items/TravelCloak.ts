import { Item, type GameState } from '@/engine'

/** Heavy, hooded cloak made for travel, offering warmth and protection from the elements. */
export class TravelCloak extends Item {
  constructor() {
    super({
      name: 'travel cloak',
      description:
        'A heavy, hooded cloak made for travel. It offers warmth and protection from ' +
        'the elements.',
      shortName: 'cloak',
      canBeCarried: true,
    })
  }

  /** The line the story tells when Elior takes it, wherever it is lying. */
  override pickedUp(_gameState: GameState): string {
    return (
      'It is heavy, and it smells of cedar. ' +
      'She must have kept it a long time.'
    )
  }
}
