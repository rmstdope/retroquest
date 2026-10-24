/**
 * A small real-engine game for tests of the held panels: two rooms, a gem
 * whose pick-up changes the bag and starts a second quest.
 */
import { Act, Item, Quest, Room, type GameState } from '@/engine'
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

/** Two rooms, a gem and two quests. */
class HoldAct extends Act {
  constructor() {
    super({
      name: 'Hold Act',
      rooms: {
        Hall: new Room({
          name: 'Hall',
          description: 'A quiet hall.',
          exits: { north: 'Garden' },
          items: [
            new Item({ name: GEM, description: 'Shiny.', canBeCarried: true }),
          ],
        }),
        Garden: new Room({ name: 'Garden', description: 'A green garden.' }),
      },
      quests: [new FirstQuest(), new GemQuest()],
      classes: { FirstQuest, GemQuest },
      musicFile: '',
      musicInfo: '',
    })
  }

  /** Never complete. */
  override isCompleted(): boolean {
    return false
  }
}

/** A started store over the real engine, with holding on as the layout turns it. */
export async function startedHoldStore(): Promise<
  ReturnType<typeof useGameStore>
> {
  const bridge = useBridge(async (): Promise<ActClass[]> => [HoldAct])
  const store = useGameStore()
  store.setBridge(bridge)
  await store.initGame()
  store.dismissModal()
  store.setPanelHold(true)
  return store
}
