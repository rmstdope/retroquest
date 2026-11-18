// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { useGameStore } from '@/stores/useGameStore'
import { startedHoldStore } from '@/testing/holdGame'

/**
 * The journal, the quests and the map over the real engine, opened from the
 * game by J, Q and M: one drawer at a time, a press outside closes it, and the
 * map is the bigger map's window.
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
    useGameStore().showTitle = false
    w = mount(LanternLayout, { attachTo: document.body })
    await w.vm.$nextTick()
  })
  afterEach(() => {
    w.unmount()
    vi.unstubAllGlobals()
  })

  /** A key pressed where focus is (the page when nothing has it). */
  const key = async (name: string): Promise<void> => {
    const target =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : document.body
    target.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: name,
        bubbles: true,
        cancelable: true,
      }),
    )
    await flushPromises()
  }
  const mapOpen = (): boolean =>
    document.querySelector('[role="dialog"] h2')?.textContent?.trim() === 'Map'

  it('opens the bigger map on M and closes it on M again', async () => {
    await key('m')
    expect(mapOpen()).toBe(true)
    await key('m')
    expect(mapOpen()).toBe(false)
  })

  it('keeps one drawer at a time, and M puts the drawer away for the map', async () => {
    await key('q')
    expect(w.find('.lq-drawer').exists()).toBe(true)
    await key('j')
    expect(w.find('.lq-drawer').exists()).toBe(false)
    expect(w.find('.lq-story-drawer').exists()).toBe(true)
    await key('q')
    expect(w.find('.lq-story-drawer').exists()).toBe(false)
    expect(w.find('.lq-drawer').exists()).toBe(true)
    await key('m')
    expect(w.find('.lq-drawer').exists()).toBe(false)
    expect(mapOpen()).toBe(true)
  })

  it('keeps what must cover the whole stage beside it, never inside it (layers.css, page group)', async () => {
    const outsideStage = (selector: string): void => {
      const found = w.get(selector).element
      expect(found.closest('.lq-stage')).toBeNull()
    }
    await key('q')
    outsideStage('.lq-drawer')
    await key('j')
    outsideStage('.lq-story-drawer')
  })

  it('shows the Quests alone in the drawer, and a second Q closes it', async () => {
    await key('q')
    expect(w.find('.lq-drawer [role="tab"]').exists()).toBe(false)
    expect(w.get('.lq-drawer').text()).toContain('Quests')
    await key('q')
    expect(w.find('.lq-drawer').exists()).toBe(false)
    await key('q')
    await w.get('.lq-drawer').trigger('keydown', { key: 'Escape' })
    expect(w.find('.lq-drawer').exists()).toBe(false)
  })

  it('hands focus back to what had it when the drawer opened', async () => {
    const hint = w.get<HTMLElement>('[data-button="menu"]').element
    hint.focus()
    await key('q')
    await w.get('.lq-drawer-close').trigger('click')
    await flushPromises()
    expect(w.find('.lq-drawer').exists()).toBe(false)
    expect(document.activeElement).toBe(hint)

    hint.focus()
    await key('j')
    await w.get('.lq-story-drawer .lq-drawer-close').trigger('click')
    await flushPromises()
    expect(document.activeElement).toBe(hint)
  })

  it('closes a drawer on a press outside, but not on a press inside', async () => {
    await key('q')
    w.get('.lq-drawer').element.dispatchEvent(
      new Event('pointerdown', { bubbles: true }),
    )
    await w.vm.$nextTick()
    expect(w.find('.lq-drawer').exists()).toBe(true)
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await w.vm.$nextTick()
    expect(w.find('.lq-drawer').exists()).toBe(false)

    await key('j')
    w.get('.lq-story-drawer h2').element.dispatchEvent(
      new Event('pointerdown', { bubbles: true }),
    )
    await w.vm.$nextTick()
    expect(w.find('.lq-story-drawer').exists()).toBe(true)
    await w.get('.lq-stage-picture').trigger('pointerdown')
    expect(w.find('.lq-story-drawer').exists()).toBe(false)
  })

  it('closes the map on Escape and gives focus back to what had it', async () => {
    const hint = w.get<HTMLElement>('[data-button="menu"]').element
    hint.focus()
    await key('m')
    expect(mapOpen()).toBe(true)
    await key('Escape')
    expect(mapOpen()).toBe(false)
    expect(document.activeElement).toBe(hint)
  })
})
