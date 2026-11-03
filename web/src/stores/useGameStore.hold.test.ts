import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { GEM, startedHoldStore as startedStore } from '@/testing/holdGame'
import { useBridge, type ActClass } from '@/composables/useBridge'
import { Act1 } from '@/act1/Act1'
import { useGameStore } from './useGameStore'

describe('useGameStore: panels held while a turn is narrated', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const stored: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem: (key: string): string | null => stored[key] ?? null,
      setItem: (key: string, value: string): void => {
        stored[key] = value
      },
      removeItem: (key: string): void => {
        delete stored[key]
      },
    })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('keeps the place and its exits until the place is released', async () => {
    const store = await startedStore()
    store.submitCommand('go north')
    const turn = store.turns.at(-1)!
    expect(store.heldTurn).toBe(turn.id)
    expect(store.roomName).toBe('Hall')
    expect(store.exits).toEqual({ north: 'Garden' })
    store.releasePanels(turn.id, ['place'], true)
    expect(store.roomName).toBe('Garden')
    expect(store.exits).toEqual({})
    expect(store.panelFlash.place).toBe(1)
  })

  it('holds the music room for the narrator, but not on a picture stage', async () => {
    const held = await startedStore()
    held.submitCommand('go north')
    expect(held.musicRoomKey).not.toBe('Garden')

    setActivePinia(createPinia())
    const staged = await startedStore()
    staged.setScenePicture(true)
    staged.submitCommand('go north')
    expect(staged.heldTurn).not.toBeNull()
    expect(staged.musicRoomKey).toBe('Garden')
  })

  it('on a picture stage holds the music for a talk that moves Elior, until its scene', async () => {
    const store = useGameStore()
    store.setBridge(useBridge(async (): Promise<ActClass[]> => [Act1]))
    await store.initGame()
    store.dismissModal()
    store.setPanelHold(true)
    store.setScenePicture(true)
    expect(store.musicRoomKey).toBe('TheDream')
    store.submitCommand('talk to voice')
    const turn = store.turns.at(-1)!
    expect(store.musicRoomKey).toBe('TheDream')
    store.releaseMusic(turn.id)
    expect(store.musicRoomKey).toBe('EliorsCottage')
  })

  it('says whether a group of panels is still held for the narrator', async () => {
    const store = await startedStore()
    expect(store.groupHeld('stock')).toBe(false)
    store.submitCommand(`take ${GEM.toLowerCase()}`)
    const turn = store.turns.at(-1)!
    expect(store.groupHeld('stock')).toBe(true)
    store.releasePanels(turn.id, ['stock'], true)
    expect(store.groupHeld('stock')).toBe(false)
  })

  it('shows the room a debug script ends in as soon as it ends', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('go north\n')),
    )
    const store = await startedStore()
    await store.runDebugScript('walk')
    expect(store.panelsHeld).toBe(false)
    expect(store.roomName).toBe('Garden')
  })

  it('shows the room a debug script reached when a later line fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('go north\ntake nothing\n')),
    )
    const store = await startedStore()
    await store.runDebugScript('walk')
    expect(store.panelsHeld).toBe(false)
    expect(store.roomName).toBe('Garden')
  })

  it('keeps the bag, its dot, the quest count and its dot until each is released', async () => {
    const store = await startedStore()
    expect(store.activeQuests).toHaveLength(1)
    store.markSeen('quests')
    store.submitCommand(`take ${GEM}`)
    const id = store.turns.at(-1)!.id
    expect(store.rawInventory).toHaveLength(0)
    expect(store.bagHasNew).toBe(false)
    expect(store.activeQuests).toHaveLength(1)
    expect(store.questsHaveNew).toBe(false)
    store.releasePanels(id, ['quests'], true)
    expect(store.activeQuests).toHaveLength(2)
    expect(store.questsHaveNew).toBe(true)
    expect(store.rawInventory).toHaveLength(0)
    store.releasePanels(id, ['stock'], true)
    expect(store.rawInventory).toHaveLength(1)
    expect(store.bagHasNew).toBe(true)
    expect(store.panelsHeld).toBe(true)
    store.releasePanels(id, ['place'], true)
    expect(store.heldTurn).toBe(null)
    expect(store.panelsHeld).toBe(false)
  })

  it('releases without a flash when asked, and ignores another turn', async () => {
    const store = await startedStore()
    store.submitCommand('go north')
    const id = store.turns.at(-1)!.id
    store.releasePanels(id + 1, ['place'], true)
    expect(store.roomName).toBe('Hall')
    store.releasePanels(id, ['place', 'quests', 'stock'], false)
    expect(store.roomName).toBe('Garden')
    expect(store.panelFlash.place).toBe(0)
  })

  it('flashes only the groups whose values changed (the gem leaves the room, so Here changes)', async () => {
    const store = await startedStore()
    store.submitCommand('look')
    store.releasePanels(
      store.turns.at(-1)!.id,
      ['place', 'quests', 'stock'],
      true,
    )
    expect(store.panelFlash).toEqual({ place: 0, quests: 0, stock: 0 })
    store.submitCommand(`take ${GEM}`)
    store.releasePanels(
      store.turns.at(-1)!.id,
      ['place', 'quests', 'stock'],
      true,
    )
    expect(store.panelFlash).toEqual({ place: 1, quests: 1, stock: 1 })
  })

  it('shows a command at once when holding is off', async () => {
    const store = await startedStore()
    store.setPanelHold(false)
    store.submitCommand('go north')
    expect(store.roomName).toBe('Garden')
    expect(store.heldTurn).toBe(null)
  })

  it('applies the older turn when a new one cuts in on it', async () => {
    const store = await startedStore()
    store.submitCommand('go north')
    store.submitCommand('go south')
    expect(store.roomName).toBe('Garden')
    expect(store.heldTurn).toBe(store.turns.at(-1)!.id)
  })

  it('drops the hold on a load', async () => {
    const store = await startedStore()
    store.saveGame()
    store.submitCommand('go north')
    store.loadGame()
    expect(store.heldTurn).toBe(null)
    expect(store.roomName).toBe('Hall')
  })
})
