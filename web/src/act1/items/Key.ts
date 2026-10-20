import { Item, type GameState } from '@/engine'
import { ShedDoor } from './ShedDoor'

/** Small, rusty key for unlocking objects in the environment. */
export class Key extends Item {
  constructor() {
    super({
      name: 'key',
      description:
        'A small, rusty key. It looks like it might unlock something.',
      canBeCarried: true,
    })
  }

  /** Use the key with a ShedDoor, otherwise fallback to base behavior. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof ShedDoor) {
      return other.useWith(gameState, this)
    }
    return super.useWith(gameState, other)
  }
}
