import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { ROOM_TITLE_MS, useRoomTitleStore } from './useRoomTitleStore'
import { useGameStore, type Turn } from './useGameStore'
import { useSceneStore } from './useSceneStore'

/** A turn that moved the player; `firstVisit` and `narrate` make it an arrival told on the picture. */
function moveTurn(id: number, firstVisit: boolean): Turn {
  return {
    id,
    narrate: true,
    arrival: firstVisit ? {} : null,
    description: { moved: true, firstVisit },
  } as unknown as Turn
}

describe('useRoomTitleStore', () => {
  let game: ReturnType<typeof useGameStore>
  let scene: ReturnType<typeof useSceneStore>
  let title: ReturnType<typeof useRoomTitleStore>

  /** The player is in `name`, after `turn`, with the picture up. */
  async function enter(name: string, turn: Turn): Promise<void> {
    game.turns = [...game.turns, turn]
    game.roomName = name
    await nextTick()
  }

  beforeEach(async () => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
    game = useGameStore()
    scene = useSceneStore()
    game.showModal = false
    scene.settled('cottage.png')
    title = useRoomTitleStore()
    title.staged = true
    await enter("Elior's Cottage", moveTurn(1, true))
  })

  afterEach(() => vi.useRealTimers())

  it('greets a room walked into again with its name', async () => {
    await enter('Village Square', moveTurn(2, false))
    expect(title.name).toBe('Village Square')
  })

  it('leaves a first visit to the arrival, which carries the name', async () => {
    title.settle()
    await enter('Village Square', moveTurn(2, true))
    expect(title.name).toBeNull()
  })

  it('settles after its time', async () => {
    await enter('Village Square', moveTurn(2, false))
    vi.advanceTimersByTime(ROOM_TITLE_MS - 1)
    expect(title.name).toBe('Village Square')
    vi.advanceTimersByTime(1)
    expect(title.name).toBeNull()
  })

  it('settles at once when asked', async () => {
    await enter('Village Square', moveTurn(2, false))
    title.settle()
    expect(title.name).toBeNull()
    vi.advanceTimersByTime(ROOM_TITLE_MS)
    expect(title.name).toBeNull()
  })

  it('greets a room once, not again for a look in it', async () => {
    await enter('Village Square', moveTurn(2, false))
    title.settle()
    game.turns = [...game.turns, moveTurn(3, false)]
    await nextTick()
    expect(title.name).toBeNull()
  })

  it('greets the room again when a game is loaded in it', async () => {
    await enter('Village Square', moveTurn(2, false))
    title.settle()
    game.loadNumber++
    await nextTick()
    expect(title.name).toBe('Village Square')
  })

  it('greets a room walked back into before the change of scene to another was up', async () => {
    await enter('Village Square', moveTurn(2, false))
    title.settle()
    scene.phase = 'in'
    await enter('Village Well', moveTurn(3, false))
    await enter('Village Square', moveTurn(4, false))
    scene.phase = 'idle'
    await nextTick()
    expect(title.name).toBe('Village Square')
  })

  it('greets the room again once a fresh stage is up (a load), not over the old picture', async () => {
    await enter('Village Square', moveTurn(2, false))
    title.settle()
    title.reset()
    scene.reset()
    await nextTick()
    expect(title.name).toBeNull()
    scene.settled('square.png')
    await nextTick()
    expect(title.name).toBe('Village Square')
  })

  it('after a load into another room, waits out the old picture and greets over the new one, or the backdrop when it has none', async () => {
    await enter('Village Square', moveTurn(2, false))
    title.settle()
    game.musicRoomKey = 'VillageWell'
    title.reset()
    scene.reset()
    scene.settled('cottage.png')
    await enter('Village Well', moveTurn(3, false))
    expect(title.name).toBeNull()
    scene.reset()
    scene.settled('')
    await nextTick()
    expect(title.name).toBe('Village Well')
  })

  it('greets a load in a room with no painted picture, the backdrop up before and after', async () => {
    // The room has a picture's address, but nothing is painted there.
    game.musicActName = 'Act1'
    game.musicRoomKey = 'VillageSquare'
    scene.reset()
    scene.settled('')
    await enter('Village Square', moveTurn(2, false))
    title.settle()
    title.reset()
    scene.reset()
    scene.settled('')
    await nextTick()
    expect(title.name).toBe('Village Square')
  })

  it('greets a load from one unpainted room into another', async () => {
    game.musicActName = 'Act1'
    game.musicRoomKey = 'VillageSquare'
    scene.reset()
    scene.settled('')
    await enter('Village Square', moveTurn(2, false))
    title.settle()
    game.musicRoomKey = 'VillageWell'
    title.reset()
    scene.reset()
    scene.settled('')
    await enter('Village Well', moveTurn(3, false))
    expect(title.name).toBe('Village Well')
  })

  it('waits for a change of scene to bring the picture up', async () => {
    scene.phase = 'in'
    await enter('Village Square', moveTurn(2, false))
    expect(title.name).toBeNull()
    scene.phase = 'idle'
    await nextTick()
    expect(title.name).toBe('Village Square')
  })

  it('waits while a chapter page covers the stage', async () => {
    game.showModal = true
    await enter('Village Square', moveTurn(2, false))
    expect(title.name).toBeNull()
    game.showModal = false
    await nextTick()
    expect(title.name).toBe('Village Square')
  })

  it('shows nothing where there is no stage (the text page), nor later for that room', async () => {
    title.staged = false
    await enter('Village Square', moveTurn(2, false))
    expect(title.name).toBeNull()
    title.staged = true
    await nextTick()
    expect(title.name).toBeNull()
  })
})
