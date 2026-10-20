import { Item, type GameState } from '@/engine'

/** A hardy mountain wildflower used as a collectible or crafting ingredient. */
export class MountainFlower extends Item {
  constructor() {
    super({
      name: 'mountain flower',
      shortName: 'flower',
      description:
        'A small but hardy wildflower that grows along the mountain paths. ' +
        'Its purple petals seem to shimmer slightly in the sunlight, though ' +
        'it appears to have no special properties.',
      canBeCarried: true,
    })
  }

  override use(_gameState: GameState): string {
    return (
      "You examine the mountain flower closely. It's quite pretty, but seems " +
      "to be just an ordinary wildflower that's adapted to the harsh mountain " +
      'climate.'
    )
  }
}
