import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { Act, Item, Quest, Room, type GameState } from '@/engine'
import { useBridge, type ActClass } from '@/composables/useBridge'
import { useGameStore } from './useGameStore'

/** The name of the item whose pick-up finishes the one-act test game. */
const CROWN = 'Crown'

/** The one quest of the crown act: done when the crown is carried. */
class CrownQuest extends Quest {
  constructor() {
    super({ name: 'Wear the Crown', description: 'Take the crown.' })
  }

  /** Active from the start. */
  override checkTrigger(): boolean {
    return true
  }

  /** Done when the crown is carried. */
  override checkCompletion(gameState: GameState): boolean {
    return gameState.inventory.some((item) => item.name === CROWN)
  }
}

/** A one-act game that ends the moment the player holds the crown. */
class CrownAct extends Act {
  constructor() {
    super({
      name: 'Crown Act',
      rooms: {
        Hall: new Room({
          name: 'Hall',
          description: 'A quiet hall.',
          items: [
            new Item({
              name: CROWN,
              description: 'A heavy crown.',
              canBeCarried: true,
            }),
          ],
        }),
      },
      quests: [new CrownQuest()],
      musicFile: 'finale.mp3',
      musicInfo: 'Finale',
    })
  }

  /** Complete when the crown is carried. */
  override isCompleted(gameState: GameState): boolean {
    return gameState.inventory.some((item) => item.name === CROWN)
  }
}

/** The store over the real engine, playing the crown act (or `acts`). */
async function startedStore(
  acts: ActClass[] = [CrownAct],
): Promise<ReturnType<typeof useGameStore>> {
  const bridge = useBridge(async (): Promise<ActClass[]> => acts)
  const store = useGameStore()
  store.setBridge(bridge)
  await store.initGame()
  store.dismissModal()
  return store
}

describe('useGameStore over the real engine: game over', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('does not end the game before the last act is complete', async () => {
    const store = await startedStore()
    store.submitCommand('look')
    expect(store.showModal).toBe(false)
    expect(store.modalChapter).toBe(null)
  })

  it('closes the final act with the engine’s own closing text and stats', async () => {
    const store = await startedStore()
    store.submitCommand(`take ${CROWN}`)
    store.dismissModal() // the quest pop-up
    expect(store.showModal).toBe(true)
    expect(store.modalChapter).toMatchObject({
      kind: 'complete',
      final: true,
      body: expect.stringContaining(
        'Congratulations — you have completed Act 1, the final act of RetroQuest!',
      ),
      stats: { questsCompleted: 1, questsTotal: 1, spells: 0, places: 1 },
    })
  })

  it('asks to save on the final page, then ends with the engine’s last answer', async () => {
    const store = await startedStore()
    store.submitCommand(`take ${CROWN}`)
    store.dismissModal() // the quest pop-up
    store.continueChapter()
    expect(store.finishAsked).toBe(true)
    store.cancelFinish()
    expect(store.finishAsked).toBe(false)
    store.continueChapter()
    expect(store.finishGame(false)).toBe(true)
    expect(store.ending).toEqual({
      text: expect.stringContaining(CROWN),
      saved: false,
    })
  })

  it('records the last quest in the story and shows the final page', async () => {
    const store = await startedStore()
    store.submitCommand(`take ${CROWN}`)
    expect(store.turns.at(-1)?.quests?.at(-1)?.kind).toBe('completed')
    expect(store.modalChapter).toMatchObject({ kind: 'complete', final: true })
  })

  it('leads on from a non-last act, never to the save dialog or the end', async () => {
    const store = await startedStore([CrownAct, CrownAct])
    store.submitCommand(`take ${CROWN}`)
    expect(store.modalChapter?.final).toBeFalsy()
    store.continueChapter()
    expect(store.finishAsked).toBe(false)
    expect(store.ending).toBe(null)
  })
})
