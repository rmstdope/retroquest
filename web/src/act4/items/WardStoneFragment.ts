import { Item, type GameState, event } from '@/engine'
import { FLAG_ACT4_BARRIERS_DISABLED } from '../Act4StoryFlags'
import { FortressGates } from '../rooms/FortressGates'
import { Barriers } from './Barriers'

/** A fragment of a ward stone that can disable magical barriers. */
export class WardStoneFragment extends Item {
  constructor() {
    super({
      name: 'Ward Stone Fragment',
      description:
        'A corner of black stone, broken from one of the ward stones. Its runes ' +
        'still glow, weakly and out of time, as if it is still trying to keep ' +
        'the count.',
      canBeCarried: true,
    })
  }

  /** Use the ward stone fragment to disable barriers. */
  override use(gameState: GameState): string {
    if (gameState.currentRoom instanceof FortressGates) {
      // Check if barriers are still active
      if (!gameState.getStoryFlag(FLAG_ACT4_BARRIERS_DISABLED)) {
        gameState.setStoryFlag(FLAG_ACT4_BARRIERS_DISABLED, true)
        return event(
          'You press the broken corner against the violet wall. For a moment ' +
            'the two lights try to agree, and cannot. The wall shivers, thins ' +
            'and goes out. Behind it, the ward stones hum on alone.',
        )
      }
      return '[failure]There is no wall left to press it against.[/failure]'
    }
    return (
      "[failure]The fragment's light stutters, looking for the stones it " +
      'came from. It does nothing here.[/failure]'
    )
  }

  /** Use ward stone fragment with barriers specifically. */
  override useWith(gameState: GameState, otherItem: Item): string {
    if (
      otherItem instanceof Barriers &&
      gameState.currentRoom instanceof FortressGates
    ) {
      return this.use(gameState)
    }
    return super.useWith(gameState, otherItem)
  }
}
