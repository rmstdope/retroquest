// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import StageButtons from './StageButtons.vue'
import { useGameStore } from '@/stores/useGameStore'

function pointer(type: string, pointerType = 'mouse'): Event {
  const event = new Event(type, { bubbles: true })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  return event
}

describe('StageButtons', () => {
  let w: VueWrapper | undefined
  const mountButtons = (drawer: 'bag' | 'spells' | 'quests' | null = null) =>
    (w = mount(StageButtons, {
      props: { drawer },
      attachTo: document.body,
    }))

  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
    const game = useGameStore()
    game.exits = { north: 'Forest Path', up: 'Hayloft' }
    game.acceptInput = true
  })
  afterEach(() => {
    w?.unmount()
    vi.useRealTimers()
  })

  it('has the five buttons in order, with the counts', () => {
    const labels = mountButtons()
      .findAll('button.lq-stage-btn')
      .map((b) => b.text())
    expect(labels).toEqual([
      'Bag · 0',
      'Spells · 0',
      'Quests · 0',
      '⟲ Story so far',
      '🧭 Map',
    ])
  })

  it('shows the amber dot on a button with something new', () => {
    useGameStore().bagHasNew = true
    const w = mountButtons()
    expect(w.find('[data-button="bag"] .lq-dot').exists()).toBe(true)
    expect(w.find('[data-button="spells"] .lq-dot').exists()).toBe(false)
  })

  it('asks for the journal on the pressed tab and keeps its button lit', async () => {
    const w = mountButtons('spells')
    await w.get('[data-button="quests"]').trigger('click')
    expect(w.emitted('journal')).toEqual([['quests']])
    expect(w.get('[data-button="spells"]').classes()).toContain('lq-lit')
    expect(w.get('[data-button="spells"]').attributes('aria-pressed')).toBe(
      'true',
    )
    expect(w.get('[data-button="bag"]').classes()).not.toContain('lq-lit')
  })

  it('asks for the story from its start', async () => {
    const w = mountButtons()
    await w.get('[data-button="story"]').trigger('click')
    expect(w.emitted('story')).toHaveLength(1)
  })

  it('has no map until it is asked for', () => {
    expect(mountButtons().find('.lq-compass').exists()).toBe(false)
  })

  it('opens the map on pointing, and closes it a moment after leaving', async () => {
    const w = mountButtons()
    w.get('.lq-map-wrap').element.dispatchEvent(pointer('pointerenter'))
    await nextTick()
    expect(w.find('.lq-compass').exists()).toBe(true)
    expect(w.get('.lq-grid .lq-here').text()).toBe('Here')
    w.get('.lq-map-wrap').element.dispatchEvent(pointer('pointerleave'))
    vi.advanceTimersByTime(100)
    await nextTick()
    expect(w.find('.lq-compass').exists()).toBe(true)
    w.get('.lq-map-wrap').element.dispatchEvent(pointer('pointerenter'))
    vi.advanceTimersByTime(400)
    await nextTick()
    expect(w.find('.lq-compass').exists()).toBe(true)
    w.get('.lq-map-wrap').element.dispatchEvent(pointer('pointerleave'))
    vi.advanceTimersByTime(300)
    await nextTick()
    expect(w.find('.lq-compass').exists()).toBe(false)
  })

  it('opens on a press, and a second press closes it', async () => {
    const w = mountButtons()
    await w.get('[data-button="map"]').trigger('click')
    expect(w.find('.lq-compass').exists()).toBe(true)
    expect(w.get('[data-button="map"]').attributes('aria-expanded')).toBe(
      'true',
    )
    await w.get('[data-button="map"]').trigger('click')
    expect(w.find('.lq-compass').exists()).toBe(false)
  })

  it('a press after pointing keeps the map open', async () => {
    const w = mountButtons()
    w.get('.lq-map-wrap').element.dispatchEvent(pointer('pointerenter'))
    await nextTick()
    await w.get('[data-button="map"]').trigger('click')
    expect(w.find('.lq-compass').exists()).toBe(true)
  })

  it('does not open on a touch pointer entering', async () => {
    const w = mountButtons()
    w.get('.lq-map-wrap').element.dispatchEvent(
      pointer('pointerenter', 'touch'),
    )
    await nextTick()
    expect(w.find('.lq-compass').exists()).toBe(false)
  })

  it('stays open after walking, showing the new exits', async () => {
    const game = useGameStore()
    const submit = vi.fn()
    game.submitCommand = submit
    const w = mountButtons()
    await w.get('[data-button="map"]').trigger('click')
    await w.get('.lq-exit[data-dir="north"]').trigger('click')
    expect(submit).toHaveBeenCalledWith('go north')
    game.exits = { south: 'Village Square' }
    await nextTick()
    expect(w.find('.lq-compass').exists()).toBe(true)
    expect(w.find('.lq-exit[data-dir="south"]').exists()).toBe(true)
  })

  it('closes on Escape and puts focus back on the Map button', async () => {
    const w = mountButtons()
    await w.get('[data-button="map"]').trigger('click')
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    await nextTick()
    await nextTick()
    expect(w.find('.lq-compass').exists()).toBe(false)
    expect(document.activeElement).toBe(w.get('[data-button="map"]').element)
  })

  it('closes on a press outside', async () => {
    const w = mountButtons()
    await w.get('[data-button="map"]').trigger('click')
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()
    expect(w.find('.lq-compass').exists()).toBe(false)
  })

  it('puts focus on a named button on request', async () => {
    const w = mountButtons()
    ;(w.vm as unknown as { focusButton(t: string): Promise<void> }).focusButton(
      'quests',
    )
    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(w.get('[data-button="quests"]').element)
  })
})
