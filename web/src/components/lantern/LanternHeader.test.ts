// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanternHeader from './LanternHeader.vue'
import { useGameStore } from '@/stores/useGameStore'
import { useSettingsStore } from '@/stores/useSettingsStore'

describe('LanternHeader', () => {
  let wrapper: VueWrapper | undefined

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  function mountHeader() {
    wrapper = mount(LanternHeader)
    return wrapper
  }

  function setProgress(completed: number, total: number, actNumber: number) {
    useGameStore().questProgress = {
      completed,
      total,
      actNumber,
      mainQuest: null,
    }
  }

  it('shows the game title', () => {
    expect(mountHeader().text()).toContain('RetroQuest')
  })

  it('shows the act and quest progress', async () => {
    const w = mountHeader()
    setProgress(4, 11, 2)
    await w.vm.$nextTick()

    expect(w.get('[data-testid="act"]').text()).toBe('Act II')
    expect(w.get('[data-testid="quest-progress"]').text()).toContain('4/11')
    const bar = w.get('[role="progressbar"]')
    expect(bar.attributes('aria-valuenow')).toBe('4')
    expect(bar.attributes('aria-valuemax')).toBe('11')
  })

  it('hides act and progress until the game has started', () => {
    const w = mountHeader()

    expect(w.find('[data-testid="act"]').exists()).toBe(false)
    expect(w.find('[data-testid="quest-progress"]').exists()).toBe(false)
  })

  it('opens the text size popover and changes the text size', async () => {
    const w = mountHeader()
    const aa = w.get('button[aria-label="Text size"]')
    expect(aa.attributes('aria-expanded')).toBe('false')

    await aa.trigger('click')
    expect(aa.attributes('aria-expanded')).toBe('true')
    await w.get('button[aria-label="Large text"]').trigger('click')

    expect(useSettingsStore().textSize).toBe('large')
    expect(
      w.get('button[aria-label="Large text"]').attributes('aria-pressed'),
    ).toBe('true')
  })

  it('closes the text size popover with Escape and refocuses Aa', async () => {
    wrapper = mount(LanternHeader, { attachTo: document.body })
    const aa = wrapper.get('button[aria-label="Text size"]')
    await aa.trigger('click')

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()

    expect(aa.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(aa.element)
  })

  it('closes the text size popover on a click outside it', async () => {
    wrapper = mount(LanternHeader, { attachTo: document.body })
    const aa = wrapper.get('button[aria-label="Text size"]')
    await aa.trigger('click')

    await wrapper.get('button[aria-label="Small text"]').trigger('click')
    expect(aa.attributes('aria-expanded')).toBe('true')

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(aa.attributes('aria-expanded')).toBe('false')
  })

  it('switches from the device theme to an explicit opposite theme', async () => {
    // jsdom has no matchMedia, so the device theme counts as dark.
    const w = mountHeader()
    const toggle = w.get('button[aria-label="Switch to light theme"]')

    await toggle.trigger('click')

    expect(useSettingsStore().theme).toBe('light')
    expect(w.find('button[aria-label="Switch to dark theme"]').exists()).toBe(
      true,
    )
  })

  it('names the page with a top-level heading', () => {
    expect(mountHeader().get('h1').text()).toBe('RetroQuest')
  })
})
