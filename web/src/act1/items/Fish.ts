import { Item, type GameState } from '@/engine'

/** A plump river fish item that can be carried. */
export class Fish extends Item {
  constructor() {
    super({
      name: 'fish',
      description:
        'A plump river fish. It looks fresh and would make a good' +
        ' meal or perhaps a gift.',
      canBeCarried: true,
    })
  }

  /** The line the story tells when Elior takes it, wherever it is lying. */
  override pickedUp(_gameState: GameState): string {
    return 'It is slippery and cold. ' + 'It will not keep for long.'
  }
}
