// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import StoryDrawer from './StoryDrawer.vue'
import { useGameStore } from '@/stores/useGameStore'

const TURN = {
  command: 'look',
  text: 'Hi',
  room: 'Square',
  description: null,
  gained: [],
  lost: [],
  arrival: null,
}

/** Give the scrolling story a size jsdom does not compute. */
function size(w: VueWrapper, scrollTop: number): HTMLElement {
  const body = w.get('.lq-story-drawer-body').element as HTMLElement
  Object.defineProperty(body, 'clientHeight', {
    value: 300,
    configurable: true,
  })
  Object.defineProperty(body, 'scrollHeight', {
    value: 1000,
    configurable: true,
  })
  body.scrollTop = scrollTop
  return body
}

describe('StoryDrawer', () => {
  let w: VueWrapper | undefined
  beforeEach(() => {
    setActivePinia(createPinia())
    useGameStore().turns = [
      { ...TURN, id: 1, command: 'look' },
      { ...TURN, id: 2, command: 'take bread' },
    ]
  })
  afterEach(() => w?.unmount())

  const open = () => (w = mount(StoryDrawer, { attachTo: document.body }))

  it('is headed "Story so far" and holds every turn, oldest first', () => {
    const drawer = open()
    expect(drawer.get('h2').text()).toBe('Story so far')
    expect(
      drawer.findAll('[data-testid="command"]').map((c) => c.text()),
    ).toEqual(['› look', '› take bread'])
  })

  it('opens at the newest and moves focus into the story', async () => {
    const drawer = open()
    await nextTick()
    await nextTick()
    const body = drawer.get('.lq-story-drawer-body').element
    expect(document.activeElement).toBe(body)
  })

  it('asks to close on ✕ and on Escape, and keeps Escape to itself', async () => {
    const drawer = open()
    expect(drawer.get('.lq-drawer-close').text()).toBe('✕')
    await drawer.get('.lq-drawer-close').trigger('click')
    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    })
    drawer.element.dispatchEvent(escape)
    expect(drawer.emitted('close')).toHaveLength(2)
    expect(escape.defaultPrevented).toBe(true)
  })

  it('shows "Newest ↓" only while scrolled up, and pressing it goes to the newest', async () => {
    const drawer = open()
    const body = size(drawer, 0)
    await drawer.get('.lq-story-drawer-body').trigger('scroll')
    const pill = drawer.get('.lq-newest')
    expect(pill.text()).toBe('Newest ↓')

    await pill.trigger('click')
    expect(body.scrollTop).toBe(1000)
    await drawer.get('.lq-story-drawer-body').trigger('scroll')
    expect(drawer.find('.lq-newest').exists()).toBe(false)
  })

  it('has no pill at the end of the story', async () => {
    const drawer = open()
    size(drawer, 700)
    await drawer.get('.lq-story-drawer-body').trigger('scroll')
    expect(drawer.find('.lq-newest').exists()).toBe(false)
  })
})
