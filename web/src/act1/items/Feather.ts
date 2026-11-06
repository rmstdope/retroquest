import { Item, type GameState } from '@/engine'

/** Lightweight byproduct item used for flavor and simple crafting. */
export class Feather extends Item {
  constructor() {
    super({
      name: 'feather',
      description: 'A white feather from one of the hens, still soft.',
      canBeCarried: true,
    })
  }

  /** The line the story tells when Elior takes it, wherever it is lying. */
  override pickedUp(_gameState: GameState): string {
    return (
      'It weighs nothing at all. ' +
      'You tuck it away before the wind can take it.'
    )
  }
}
