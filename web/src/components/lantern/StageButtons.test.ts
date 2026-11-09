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
  const mountButtons = (drawer: 'quests' | 'story' | 'map' | null = null) =>
    (w = mount(StageButtons, {
      props: { drawer },
      attachTo: document.body,
    }))

  beforeEach(() => {
    setActivePinia(createPinia())
    const game = useGameStore()
    game.exits = { north: 'Forest Path', up: 'Hayloft' }
    game.acceptInput = true
  })
  afterEach(() => {
    w?.unmount()
  })

  it('has the three buttons in order, the Bag and Spells being the belt of pictures', () => {
    const labels = mountButtons()
      .findAll('button.lq-stage-btn')
      .map((b) => b.text())
    expect(labels).toEqual(['Quests · 0', '⟲ Story so far', '🧭 Map'])
  })

  it('has no Bag or Spells button, and nothing to fly to', () => {
    const w = mountButtons()
    expect(w.find('[data-button="bag"]').exists()).toBe(false)
    expect(w.find('[data-button="spells"]').exists()).toBe(false)
    expect(w.find('[data-flight-target]').exists()).toBe(false)
  })

  it('shows the amber dot on a button with something new', () => {
    useGameStore().questsHaveNew = true
    const w = mountButtons()
    expect(w.find('[data-button="quests"] .lq-dot').exists()).toBe(true)
    expect(w.find('[data-button="story"] .lq-dot').exists()).toBe(false)
  })

  it('asks for the journal and keeps its button lit', async () => {
    const w = mountButtons('quests')
    await w.get('[data-button="story"]').trigger('click')
    expect(w.emitted('story')).toHaveLength(1)
    expect(w.get('[data-button="quests"]').classes()).toContain('lq-lit')
    expect(w.get('[data-button="quests"]').attributes('aria-pressed')).toBe(
      'true',
    )
    await w.get('[data-button="quests"]').trigger('click')
    expect(w.emitted('journal')).toEqual([['quests']])
  })

  it('asks for the story from its start', async () => {
    const w = mountButtons()
    await w.get('[data-button="story"]').trigger('click')
    expect(w.emitted('story')).toHaveLength(1)
  })

  it('has no map until it is asked for', () => {
    expect(mountButtons().find('.lq-compass').exists()).toBe(false)
  })

  it('opens nothing on pointing', async () => {
    const w = mountButtons()
    w.get('.lq-map-wrap').element.dispatchEvent(pointer('pointerenter'))
    await nextTick()
    expect(w.find('.lq-compass').exists()).toBe(false)
    expect(w.emitted('map')).toBeUndefined()
  })

  it('asks for the map when Map is pressed', async () => {
    const w = mountButtons()
    await w.get('[data-button="map"]').trigger('click')
    expect(w.emitted('map')).toHaveLength(1)
  })

  it('shows the map, lit, while it is the open one', () => {
    const w = mountButtons('map')
    expect(w.find('.lq-compass').exists()).toBe(true)
    expect(w.get('.lq-grid .lq-here').text()).toBe('Here')
    const map = w.get('[data-button="map"]')
    expect(map.classes()).toContain('lq-lit')
    expect(map.attributes('aria-expanded')).toBe('true')
  })

  it('shows no map while a drawer is the open one', () => {
    const w = mountButtons('quests')
    expect(w.find('.lq-compass').exists()).toBe(false)
    expect(w.get('[data-button="map"]').classes()).not.toContain('lq-lit')
  })

  it('keeps the map showing the new exits after walking', async () => {
    const game = useGameStore()
    const submit = vi.fn()
    game.submitCommand = submit
    const w = mountButtons('map')
    await w.get('.lq-exit[data-dir="north"]').trigger('click')
    expect(submit).toHaveBeenCalledWith('go north')
    game.exits = { south: 'Village Square' }
    await nextTick()
    expect(w.find('.lq-exit[data-dir="south"]').exists()).toBe(true)
  })

  it('asks to close on Escape, only while the map is open', async () => {
    const w = mountButtons('map')
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    expect(w.emitted('close')).toHaveLength(1)
    await w.setProps({ drawer: null })
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('leaves Escape to a dialog that is open over the map', () => {
    const w = mountButtons('map')
    const layer = document.createElement('div')
    layer.className = 'lq-dialog-layer'
    document.body.append(layer)
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    layer.remove()
    expect(w.emitted('close')).toBeUndefined()
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

  it('lights Story so far while its drawer is open', () => {
    const buttons = mountButtons('story')
    const story = buttons.get('[data-button="story"]')
    expect(story.classes()).toContain('lq-lit')
    expect(story.attributes('aria-pressed')).toBe('true')
    expect(buttons.get('[data-button="quests"]').classes()).not.toContain(
      'lq-lit',
    )
  })

  it('asks for the story drawer when Story so far is pressed', async () => {
    const buttons = mountButtons()
    await buttons.get('[data-button="story"]').trigger('click')
    expect(buttons.emitted('story')).toHaveLength(1)
  })
})
