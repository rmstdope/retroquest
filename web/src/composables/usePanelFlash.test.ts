import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { usePanelFlash } from './usePanelFlash'
import { useGameStore } from '@/stores/useGameStore'

describe('usePanelFlash', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('lights when one of its groups switches in the narration, and again for the next', async () => {
    const game = useGameStore()
    const { flashing, endFlash } = usePanelFlash(['quests', 'stock'])
    expect(flashing.value).toBe(false)
    game.panelFlash.stock++
    await nextTick()
    await nextTick()
    expect(flashing.value).toBe(true)
    endFlash()
    expect(flashing.value).toBe(false)
    game.panelFlash.place++
    await nextTick()
    await nextTick()
    expect(flashing.value).toBe(false)
    game.panelFlash.quests++
    await nextTick()
    await nextTick()
    expect(flashing.value).toBe(true)
  })
})
