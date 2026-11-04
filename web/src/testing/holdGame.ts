/**
 * A small real-engine game for tests of the held panels: two rooms, a gem
 * whose pick-up changes the bag, starts a second quest and changes the
 * hall's sound state.
 */
import { Act, Item, Quest, Room, type GameState } from '@/engine'
import type { Pinia } from 'pinia'
import { useBridge, type ActClass } from '@/composables/useBridge'
import { useGameStore } from '@/stores/useGameStore'

/** The item whose pick-up changes the bag and starts the second quest. */
export const GEM = 'Gem'

/** A quest that is active from the start. */
class FirstQuest extends Quest {
  constructor() {
    super({ name: 'First', description: 'The first.' })
  }

  /** Active from the start. */
  override checkTrigger(): boolean {
    return true
  }

  /** Never done in these tests. */
  override checkCompletion(): boolean {
    return false
  }
}

/** A quest that starts once the gem is carried. */
class GemQuest extends Quest {
  constructor() {
    super({ name: 'Gem', description: 'The gem.' })
  }

  /** Active once the gem is carried. */
  override checkTrigger(gameState: GameState): boolean {
    return gameState.inventory.some((item) => item.name === GEM)
  }

  /** Never done in these tests. */
  override checkCompletion(): boolean {
    return false
  }
}

/** The hall's sound state once the gem has been taken from it. */
export const HALL_GEM_TAKEN = 'gem-taken'

/** The sound trigger the hall fires when its gem is picked up. */
export const HALL_CHIME = 'chime'

/** A gem that chimes in the hall when it is picked up. */
class ChimingGem extends Item {
  constructor() {
    super({ name: GEM, description: 'Shiny.', canBeCarried: true })
  }

  /** Fires the hall's chime. */
  override pickedUp(gameState: GameState): string {
    gameState.fireSound(HALL_CHIME)
    return ''
  }
}

/** A hall that sounds different once its gem has been taken, and can chime. */
class Hall extends Room {
  /** The hall's one sound trigger. */
  override soundTriggers(): readonly string[] {
    return [HALL_CHIME]
  }

  /** `HALL_GEM_TAKEN` once the gem is gone from the hall; '' before. */
  override soundState(_gameState: GameState): string {
    return this.getItemByName(GEM) ? '' : HALL_GEM_TAKEN
  }
}

/** Two rooms, a gem and two quests. */
class HoldAct extends Act {
  constructor() {
    super({
      name: 'Hold Act',
      rooms: {
        Hall: new Hall({
          name: 'Hall',
          description: 'A quiet hall.',
          exits: { north: 'Garden' },
          items: [new ChimingGem()],
        }),
        Garden: new Room({ name: 'Garden', description: 'A green garden.' }),
      },
      quests: [new FirstQuest(), new GemQuest()],
      classes: { FirstQuest, GemQuest, Hall, ChimingGem },
      musicFile: '',
      musicInfo: '',
    })
  }

  /** Never complete. */
  override isCompleted(): boolean {
    return false
  }
}

/**
 * A started store over the real engine, with holding on as the layout turns
 * it. A test that must not lose its stores to a late callback of an earlier
 * test passes its own `pinia`.
 */
export async function startedHoldStore(
  pinia?: Pinia,
): Promise<ReturnType<typeof useGameStore>> {
  const bridge = useBridge(async (): Promise<ActClass[]> => [HoldAct])
  const store = useGameStore(pinia)
  store.setBridge(bridge)
  await store.initGame()
  store.dismissModal()
  store.setPanelHold(true)
  return store
}
