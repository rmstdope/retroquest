import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useAreaNamesStore } from './useAreaNamesStore'
import { useGameStore } from './useGameStore'
import { useSettingsStore } from './useSettingsStore'

describe('useAreaNamesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts off, and toggles', () => {
    const names = useAreaNamesStore()
    expect(names.showing).toBe(false)
    names.toggle()
    expect(names.showing).toBe(true)
    names.turnOff()
    expect(names.showing).toBe(false)
  })

  it('starts afresh in the next room: off, or on with the Always setting', async () => {
    const game = useGameStore()
    const settings = useSettingsStore()
    const names = useAreaNamesStore()
    names.toggle()
    game.roomName = 'Somewhere else'
    await nextTick()
    expect(names.showing).toBe(false)
    settings.alwaysShowNames = true
    await nextTick()
    expect(names.showing).toBe(true)
    names.turnOff()
    game.roomName = 'Another place'
    await nextTick()
    expect(names.showing).toBe(true)
  })

  it('starts afresh after a load or a new act', async () => {
    const game = useGameStore()
    const names = useAreaNamesStore()
    names.toggle()
    game.gameNumber++
    await nextTick()
    expect(names.showing).toBe(false)
  })

  it('forgets the pointer in the next room', async () => {
    const game = useGameStore()
    const names = useAreaNamesStore()
    names.pointer = { x: 4, y: 5 }
    game.roomName = 'Elsewhere'
    await nextTick()
    expect(names.pointer).toBeNull()
  })
})
