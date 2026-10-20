import { Item, type GameState, event } from '@/engine'
import { FLAG_ACT4_BARRIERS_DISABLED } from '../Act4StoryFlags'

/** A fragment of a ward stone that can disable magical barriers. */
export class WardStoneFragment extends Item {
  constructor() {
    super({
      name: 'Ward Stone Fragment',
      description:
        'A jagged piece of dark stone that pulses with residual magical energy. ' +
        'Ancient runes are carved into its surface, glowing faintly with purple light. ' +
        "This fragment appears to be a key component of the fortress's defensive wards.",
      canBeCarried: true,
    })
  }

  /** Use the ward stone fragment to disable barriers. */
  override use(gameState: GameState): string {
    if (gameState.currentRoom.name === 'Fortress Gates') {
      // Check if barriers are still active
      if (!gameState.getStoryFlag(FLAG_ACT4_BARRIERS_DISABLED)) {
        gameState.setStoryFlag(FLAG_ACT4_BARRIERS_DISABLED, true)
        return event(
          'You press the ward stone fragment against the magical barriers. ' +
            'The purple energy flickers and fades as the defensive wards are disrupted. ' +
            'The barriers collapse with a resonant hum, clearing the way forward.',
        )
      }
      return (
        '[failure]The barriers have already been disabled. The ward stone ' +
        'fragment has served its purpose.[/failure]'
      )
    }
    return (
      '[failure]The ward stone fragment only responds to the specific magical ' +
      'barriers of the fortress gates.[/failure]'
    )
  }

  /** Use ward stone fragment with barriers specifically. */
  override useWith(gameState: GameState, otherItem: Item): string {
    if (
      otherItem.name.toLowerCase().includes('barrier') &&
      gameState.currentRoom.name === 'Fortress Gates'
    ) {
      return this.use(gameState)
    }
    return super.useWith(gameState, otherItem)
  }
}
