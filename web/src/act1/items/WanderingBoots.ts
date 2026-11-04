import { Item, type GameState } from '@/engine'

/** Wandering boots item that aids in travel. */
export class WanderingBoots extends Item {
  constructor() {
    super({
      name: 'wandering boots',
      description:
        'Sturdy leather boots, well-worn and comfortable. They seem to ' +
        'hum with a faint energy, eager for the road.',
      shortName: 'boots',
      canBeCarried: true,
    })
  }

  /** The line the story tells when Elior takes it, wherever it is lying. */
  override pickedUp(_gameState: GameState): string {
    return (
      "The leather is soft from other people's roads. " +
      'They feel ready to go, even if you are not.'
    )
  }
}
