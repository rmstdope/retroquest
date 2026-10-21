import { Item, type GameState, event } from '@/engine'

/**
 * The wound in time that Malakar tore, bleeding the king's light. It can only
 * be examined here; the elixir may be used on it (which heals Malakar) and the
 * amulet is refused on it until the endings piece takes that over.
 */
export class Wound extends Item {
  constructor() {
    super({
      name: 'Wound',
      description:
        'A tear in the air, no wider than a door, its edges flickering ' +
        'with days that never happened. It drinks the light from the king, ' +
        'and from Malakar too.',
      canBeCarried: false,
    })
  }

  /** Also answers to "wound in time". */
  override answersTo(name: string): boolean {
    return super.answersTo(name) || name.toLowerCase() === 'wound in time'
  }

  /** The wound's look. */
  override examine(_gameState: GameState): string {
    return event(this.description)
  }
}
