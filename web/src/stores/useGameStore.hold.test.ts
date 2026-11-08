import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import {
  GEM,
  HALL_CHIME,
  HALL_LIT,
  HALL_GEM_TAKEN,
  startedHoldStore as startedStore,
} from '@/testing/holdGame'
import { roomPictureUrl, setPictureProbe } from '@/lantern/roomPicture'
import { useBridge, type ActClass } from '@/composables/useBridge'
import { Act1 } from '@/act1/Act1'
import { Key } from '@/act1/items/Key'
import { Game } from '@/engine'
import { PANEL_GROUPS, useGameStore } from './useGameStore'

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

  it("holds the room's sound state with the music, until the place is released", async () => {
    const store = await startedStore()
    expect(store.musicSoundState).toBe('')
    store.submitCommand(`take ${GEM.toLowerCase()}`)
    const turn = store.turns.at(-1)!
    expect(store.musicSoundState).toBe('')
    store.releasePanels(turn.id, ['place'], true)
    expect(store.musicSoundState).toBe(HALL_GEM_TAKEN)
  })

  it("holds a sound trigger the turn fired with the music's room, then publishes it once", async () => {
    const store = await startedStore()
    expect(store.musicSoundFirings).toEqual([])
    store.submitCommand(`take ${GEM.toLowerCase()}`)
    const turn = store.turns.at(-1)!
    expect(store.musicSoundFirings).toEqual([])
    store.releasePanels(turn.id, ['place'], true)
    expect(store.musicSoundFirings).toEqual([
      { roomKey: 'Hall', trigger: HALL_CHIME },
    ])
    const published = store.musicSoundFirings
    store.refreshPanels()
    expect(store.musicSoundFirings).toBe(published)
  })

  it('never publishes the firings of a turn whose hold was dropped', async () => {
    const store = await startedStore()
    store.submitCommand(`take ${GEM.toLowerCase()}`)
    store.restartGame()
    expect(store.musicSoundFirings).toEqual([])
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

  it('on a picture stage does not hold the music for a talk that stays in the room', async () => {
    const store = useGameStore()
    store.setBridge(useBridge(async (): Promise<ActClass[]> => [Act1]))
    await store.initGame()
    store.dismissModal()
    store.setPanelHold(true)
    store.setScenePicture(true)
    store.submitCommand('talk to voice')
    store.submitCommand('talk to grandmother')
    // The second talk stays in the cottage: the music is not held for it.
    expect(store.musicRoomKey).toBe('EliorsCottage')
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
    expect(store.panelsHeld).toBe(false)
    // The room picture's patches are not a panel: they wait without holding a press.
    expect(store.heldTurn).toBe(id)
    store.releasePanels(id, ['picture'], true)
    expect(store.heldTurn).toBe(null)
  })

  it('releases without a flash when asked, and ignores another turn', async () => {
    const store = await startedStore()
    store.submitCommand('go north')
    const id = store.turns.at(-1)!.id
    store.releasePanels(id + 1, ['place'], true)
    expect(store.roomName).toBe('Hall')
    store.releasePanels(id, [...PANEL_GROUPS], false)
    expect(store.roomName).toBe('Garden')
    expect(store.panelFlash.place).toBe(0)
  })

  it('flashes only the groups whose values changed (the gem leaves the room, so Here changes)', async () => {
    const store = await startedStore()
    store.submitCommand('look')
    store.releasePanels(store.turns.at(-1)!.id, [...PANEL_GROUPS], true)
    expect(store.panelFlash).toEqual({
      place: 0,
      quests: 0,
      stock: 0,
      picture: 0,
    })
    store.submitCommand(`take ${GEM}`)
    store.releasePanels(
      store.turns.at(-1)!.id,
      ['place', 'quests', 'stock'],
      true,
    )
    expect(store.panelFlash).toEqual({
      place: 1,
      quests: 1,
      stock: 1,
      picture: 0,
    })
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

  describe("a room's other picture", () => {
    const hallPicture = (variant = ''): string =>
      roomPictureUrl('Hold Act', 'Hall', variant)

    afterEach(() => setPictureProbe(null))

    /** A staged store whose picture check says `painted`, with the first turn's flush done. */
    async function stagedStore(
      painted: boolean,
    ): Promise<ReturnType<typeof useGameStore>> {
      setPictureProbe(() => Promise.resolve(painted))
      const store = await startedStore()
      store.setScenePicture(true)
      return store
    }

    it('holds the old picture for a command that changes it, and marks the turn', async () => {
      const store = await stagedStore(true)
      store.submitCommand(`take ${GEM.toLowerCase()}`)
      await Promise.resolve()
      const turn = store.turns.at(-1)!
      expect(turn.pictureChanged).toBe(true)
      expect(store.musicPicture).toBe('')
      expect(store.roomPicture).toBe(hallPicture())
      store.releasePicture(turn.id)
      expect(store.musicPicture).toBe(HALL_LIT)
    })

    it('shows the other picture only once it is known to exist', async () => {
      let answer: (exists: boolean) => void = () => {}
      setPictureProbe(
        () =>
          new Promise<boolean>((resolve) => {
            answer = resolve
          }),
      )
      const store = await startedStore()
      store.setScenePicture(true)
      store.submitCommand(`take ${GEM.toLowerCase()}`)
      store.releasePicture(store.turns.at(-1)!.id)
      expect(store.roomPicture).toBe(hallPicture())
      answer(true)
      await new Promise((resolve) => setTimeout(resolve))
      expect(store.roomPicture).toBe(hallPicture(HALL_LIT))
    })

    it('knows which pictures are painted before the player gets there', async () => {
      const store = await stagedStore(true)
      store.submitCommand('look')
      await new Promise((resolve) => setTimeout(resolve))
      store.submitCommand(`take ${GEM.toLowerCase()}`)
      store.releasePicture(store.turns.at(-1)!.id)
      // The other picture is there the moment the story reaches it, not the room's own first.
      expect(store.roomPicture).toBe(hallPicture(HALL_LIT))
    })

    it('is not held when the layout does not hold panels', async () => {
      setPictureProbe(() => Promise.resolve(true))
      const store = await startedStore()
      store.setPanelHold(false)
      store.submitCommand(`take ${GEM.toLowerCase()}`)
      expect(store.turns.at(-1)?.pictureChanged).toBeUndefined()
      expect(store.musicPicture).toBe(HALL_LIT)
    })

    it('keeps the room picture when the other one is not painted', async () => {
      const store = await stagedStore(false)
      store.submitCommand(`take ${GEM.toLowerCase()}`)
      store.releasePicture(store.turns.at(-1)!.id)
      await new Promise((resolve) => setTimeout(resolve))
      expect(store.musicPicture).toBe(HALL_LIT)
      expect(store.roomPicture).toBe(hallPicture())
    })

    it('lets the picture go with the place panels, and music stays put', async () => {
      const store = await stagedStore(true)
      const key = store.musicRoomKey
      store.submitCommand(`take ${GEM.toLowerCase()}`)
      expect(store.musicRoomKey).toBe(key)
      store.releasePanels(store.turns.at(-1)!.id, ['place'], true)
      expect(store.musicPicture).toBe(HALL_LIT)
      expect(store.musicRoomKey).toBe(key)
    })

    it('brings it up when a newer command comes, and ignores another turn', async () => {
      const store = await stagedStore(true)
      store.submitCommand(`take ${GEM.toLowerCase()}`)
      const turn = store.turns.at(-1)!
      store.releasePicture(turn.id + 1)
      expect(store.musicPicture).toBe('')
      store.submitCommand('look')
      expect(store.musicPicture).toBe(HALL_LIT)
      expect(store.turns.at(-1)?.pictureChanged).toBeUndefined()
    })

    it('is dropped by a restart', async () => {
      const store = await stagedStore(true)
      store.submitCommand(`take ${GEM.toLowerCase()}`)
      store.restartGame()
      expect(store.musicPicture).toBe('')
      expect(store.turns.some((turn) => turn.pictureChanged)).toBe(false)
    })
  })

  describe('the patches of the room picture', () => {
    /** Act 1 in the cottage with every patch of the cottage "made", narration holding the panels. */
    async function cottage(): Promise<ReturnType<typeof useGameStore>> {
      const store = useGameStore()
      store.setBridge(useBridge(async (): Promise<ActClass[]> => [Act1]))
      await store.initGame()
      store.dismissModal()
      store.setPanelHold(true)
      store.setScenePicture(true)
      store.submitCommand('talk to voice')
      store.releasePanels(store.turns.at(-1)!.id, [...PANEL_GROUPS], false)
      return store
    }

    /** Pretend the studio has made these patches of the cottage. */
    function made(store: ReturnType<typeof useGameStore>, ids: string[]): void {
      const patches = Object.fromEntries(ids.map((id) => [id, { file: id }]))
      store.imageManifest = { 'act1-eliors-cottage': { patches } }
    }

    it('lists only the patches that apply and have been made', async () => {
      const store = await cottage()
      made(store, ['bread-taken', 'lantern-lit'])
      expect(store.roomPatchUrls).toEqual([])
      store.submitCommand('take bread')
      store.releasePanels(store.turns.at(-1)!.id, [...PANEL_GROUPS], false)
      expect(store.roomPatchUrls).toEqual([
        expect.stringContaining('act1-eliors-cottage.bread-taken.png'),
      ])
    })

    it('keeps the old patches until the narration reaches the picture group', async () => {
      const store = await cottage()
      made(store, ['bread-taken'])
      store.submitCommand('take bread')
      const id = store.turns.at(-1)!.id
      expect(store.roomPatchUrls).toEqual([])
      store.releasePanels(id, ['place'], true)
      expect(store.roomPatchUrls).toEqual([])
      store.releasePanels(id, ['picture'], true)
      expect(store.roomPatchUrls).toHaveLength(1)
    })

    it('lists the movement of the room with the spots the studio has marked', async () => {
      const store = await cottage()
      expect(store.roomMotion).toEqual([{ kind: 'dust' }])
      const fire = { x: 0.1, y: 0.4, width: 0.2, height: 0.3 }
      store.imageManifest = {
        'act1-eliors-cottage': {
          width: 1920,
          height: 1080,
          areas: { 'motion-fire': fire },
        },
      }
      expect(store.roomMotion).toEqual([
        { kind: 'dust' },
        { kind: 'fire', box: fire },
      ])
      expect(store.roomPictureSize).toEqual({ width: 1920, height: 1080 })
    })

    it('moves only what floats when the manifest cannot be fetched', async () => {
      const store = await cottage()
      vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')))
      await store.loadImageManifest()
      vi.unstubAllGlobals()
      expect(store.imageManifest).toBeNull()
      expect(store.roomMotion).toEqual([{ kind: 'dust' }])
    })

    it('has no picture size while the manifest does not say', async () => {
      const store = await cottage()
      expect(store.roomPictureSize).toBeUndefined()
      store.imageManifest = { 'act1-eliors-cottage': { width: 'x' } }
      expect(store.roomPictureSize).toBeUndefined()
    })

    it('shows a patch that is not made yet as nothing', async () => {
      const store = await cottage()
      made(store, [])
      store.submitCommand('take bread')
      store.releasePanels(store.turns.at(-1)!.id, [...PANEL_GROUPS], false)
      expect(store.roomPatchUrls).toEqual([])
    })
  })

  describe("the patches of a room's other picture", () => {
    /** A saved Act I game with the shed door opened, loaded into the store; the inside is `painted` or not. */
    async function openShedStore(
      painted: boolean,
    ): Promise<ReturnType<typeof useGameStore>> {
      setPictureProbe(() => Promise.resolve(painted))
      const act = new Act1()
      const game = new Game([act])
      game.state.currentRoom = game.state.allRooms.AbandonedShed
      game.state.addItemToInventory(new Key())
      game.commandParser.parse('use key with door')
      game.commandParser.parse('take broken shovel')
      localStorage.setItem('retroquest_save', game.toSaveData())
      const store = useGameStore()
      store.setBridge(useBridge(async (): Promise<ActClass[]> => [Act1]))
      await store.initGame()
      store.dismissModal()
      store.loadGame()
      await new Promise((resolve) => setTimeout(resolve))
      const patches = { 'broken-shovel-taken': { file: 'x' } }
      store.imageManifest = { 'act1-abandoned-shed-inside': { patches } }
      return store
    }

    afterEach(() => setPictureProbe(null))

    it('show over the picture they belong to', async () => {
      const store = await openShedStore(true)
      expect(store.roomPicture).toBe(
        roomPictureUrl('Act1', 'AbandonedShed', 'inside'),
      )
      expect(store.roomPatchUrls).toEqual([
        expect.stringContaining(
          'act1-abandoned-shed-inside.broken-shovel-taken',
        ),
      ])
    })

    it('stay hidden while the inside is not painted and the outside shows', async () => {
      const store = await openShedStore(false)
      expect(store.roomPicture).toBe(roomPictureUrl('Act1', 'AbandonedShed'))
      expect(store.roomPatchUrls).toEqual([])
    })
  })
})
