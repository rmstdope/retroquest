import { Item, type GameState } from '@/engine'

/** Simple agricultural product reinforcing life in the village. */
export class Egg extends Item {
  constructor() {
    super({
      name: 'egg',
      description:
        'A freshly laid egg, still warm. It could be cooked or used in a recipe.',
      canBeCarried: true,
    })
  }

  /** The line the story tells when Elior takes it, wherever it is lying. */
  override pickedUp(_gameState: GameState): string {
    return (
      'It is still warm, and you hold it carefully. ' +
      'One wrong step and it is gone.'
    )
  }
}
