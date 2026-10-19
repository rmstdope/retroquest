// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SaveToast from './SaveToast.vue'
import { useGameStore } from '@/stores/useGameStore'

describe('SaveToast', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('announces a notice politely and then lets it go', async () => {
    const w = mount(SaveToast)
    const status = w.get('[role="status"]')
    expect(status.attributes('aria-live')).toBe('polite')
    expect(w.find('.lq-toast').exists()).toBe(false)

    useGameStore().notice = { id: 1, text: 'Game saved · Slot 2' }
    await w.vm.$nextTick()
    expect(w.get('.lq-toast').text()).toBe('Game saved · Slot 2')

    vi.advanceTimersByTime(3000)
    await w.vm.$nextTick()
    expect(w.find('.lq-toast').exists()).toBe(false)
  })

  it('shows the same notice again when it comes again', async () => {
    const w = mount(SaveToast)
    const game = useGameStore()
    game.notice = { id: 1, text: 'Game saved' }
    await w.vm.$nextTick()
    vi.advanceTimersByTime(2000)

    game.notice = { id: 2, text: 'Game saved' }
    await w.vm.$nextTick()
    vi.advanceTimersByTime(2000)
    await w.vm.$nextTick()

    expect(w.find('.lq-toast').exists()).toBe(true)
  })
})
