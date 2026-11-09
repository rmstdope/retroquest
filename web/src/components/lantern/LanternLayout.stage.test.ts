// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { useGameStore } from '@/stores/useGameStore'
import { startedHoldStore } from '@/testing/holdGame'

/**
 * The stage buttons over the real engine: Quests, Story so far and
 * Map are press-only and one at a time; a press outside closes what is open.
 */
describe('LanternLayout: one thing open on the stage', () => {
  let w: VueWrapper

  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query.includes('min-width'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    await startedHoldStore()
    w = mount(LanternLayout, { attachTo: document.body })
    await w.vm.$nextTick()
  })
  afterEach(() => {
    w.unmount()
    vi.unstubAllGlobals()
  })

  const press = async (which: string): Promise<void> => {
    await w.get(`[data-button="${which}"]`).trigger('click')
  }
  const lit = (): string[] =>
    w.findAll('.lq-stage-btn.lq-lit').map((b) => b.attributes('data-button')!)

  it('opens nothing on pointing at the map', async () => {
    const enter = new Event('pointerenter', { bubbles: true })
    Object.defineProperty(enter, 'pointerType', { value: 'mouse' })
    w.get('.lq-map-wrap').element.dispatchEvent(enter)
    await w.vm.$nextTick()
    expect(w.find('.lq-compass').exists()).toBe(false)
    expect(lit()).toEqual([])
  })

  it('opens the map on a press and closes it on the same press again', async () => {
    await press('map')
    expect(w.find('.lq-compass').exists()).toBe(true)
    expect(lit()).toEqual(['map'])
    await press('map')
    expect(w.find('.lq-compass').exists()).toBe(false)
    expect(lit()).toEqual([])
  })

  it('closes the drawer when the map opens, and the map when a drawer opens', async () => {
    await press('quests')
    expect(w.find('.lq-drawer').exists()).toBe(true)
    await press('map')
    expect(w.find('.lq-drawer').exists()).toBe(false)
    expect(w.find('.lq-compass').exists()).toBe(true)
    expect(lit()).toEqual(['map'])
    await press('quests')
    expect(w.find('.lq-compass').exists()).toBe(false)
    expect(w.find('.lq-drawer').exists()).toBe(true)
    expect(lit()).toEqual(['quests'])
    await press('story')
    expect(w.find('.lq-drawer').exists()).toBe(false)
    expect(w.find('.lq-story-drawer').exists()).toBe(true)
    expect(lit()).toEqual(['story'])
  })

  it('shows the Quests alone in the drawer, and a second press closes it', async () => {
    await press('quests')
    expect(w.find('.lq-drawer [role="tab"]').exists()).toBe(false)
    expect(w.get('.lq-drawer').text()).toContain('Quests')
    expect(lit()).toEqual(['quests'])
    await press('quests')
    expect(w.find('.lq-drawer').exists()).toBe(false)
    expect(lit()).toEqual([])
  })

  it('hands focus to the lit button when the drawer closes', async () => {
    await press('quests')
    await w.get('.lq-drawer-close').trigger('click')
    await w.vm.$nextTick()
    expect(w.find('.lq-drawer').exists()).toBe(false)
    expect(document.activeElement).toBe(w.get('[data-button="quests"]').element)
  })

  it('closes what is open on a press outside, but not on a press inside', async () => {
    await press('quests')
    w.get('.lq-drawer').element.dispatchEvent(
      new Event('pointerdown', { bubbles: true }),
    )
    await w.vm.$nextTick()
    expect(w.find('.lq-drawer').exists()).toBe(true)
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await w.vm.$nextTick()
    expect(w.find('.lq-drawer').exists()).toBe(false)

    await press('map')
    w.get('.lq-compass').element.dispatchEvent(
      new Event('pointerdown', { bubbles: true }),
    )
    await w.vm.$nextTick()
    expect(w.find('.lq-compass').exists()).toBe(true)
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await w.vm.$nextTick()
    expect(w.find('.lq-compass').exists()).toBe(false)
  })

  it('keeps the map open after walking from it', async () => {
    await press('map')
    await w.get('.lq-compass .lq-exit').trigger('click')
    await w.vm.$nextTick()
    expect(w.find('.lq-compass').exists()).toBe(true)
    expect(useGameStore().roomName).not.toBe('')
  })

  it('closes the map on Escape and focuses the Map button', async () => {
    await press('map')
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(w.find('.lq-compass').exists()).toBe(false)
    expect(document.activeElement).toBe(w.get('[data-button="map"]').element)
  })
})
