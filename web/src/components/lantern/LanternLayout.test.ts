// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { useGameStore } from '@/stores/useGameStore'

describe('LanternLayout', () => {
  let wrapper: VueWrapper | undefined

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    document.documentElement.removeAttribute('data-ui')
  })

  function mountLayout() {
    wrapper = mount(LanternLayout)
    return wrapper
  }

  it('switches the page to the Lantern look while it is shown', () => {
    const w = mountLayout()
    expect(document.documentElement.getAttribute('data-ui')).toBe('lantern')

    w.unmount()
    wrapper = undefined
    expect(document.documentElement.hasAttribute('data-ui')).toBe(false)
  })

  it('shows the header', () => {
    expect(mountLayout().text()).toContain('RetroQuest')
  })

  it('lists the turns with their command and rendered answer', async () => {
    const w = mountLayout()
    useGameStore().turns = [
      {
        id: 1,
        command: null,
        text: 'You look around.',
        room: 'Square',
        roomChanged: true,
        gained: [],
        lost: [],
        arrival: null,
      },
      {
        id: 2,
        command: 'take bucket',
        text: '[item_name]Bucket[/item_name] taken.',
        room: 'Square',
        roomChanged: false,
        gained: [],
        lost: [],
        arrival: null,
      },
    ]
    await w.vm.$nextTick()

    const turns = w.findAll('[data-testid="turn"]')
    expect(turns).toHaveLength(2)
    expect(turns[1].text()).toContain('take bucket')
    expect(turns[1].find('.theme-item_name').text()).toBe('Bucket')
  })

  it('plays through the action composer', async () => {
    const w = mountLayout()
    const game = useGameStore()
    game.acceptInput = true
    const submit = vi.spyOn(game, 'submitCommand').mockImplementation(() => {})
    await w.vm.$nextTick()

    expect(w.find('[aria-label="Actions"]').exists()).toBe(true)
    const look = w.findAll('button').find((b) => b.text() === 'Look')
    await look!.trigger('click')

    expect(submit).toHaveBeenCalledWith('look')
  })

  it('disables the actions while the game is not accepting input', () => {
    const w = mountLayout()

    const look = w.findAll('button').find((b) => b.text() === 'Look')
    expect(look!.attributes()).toHaveProperty('disabled')
  })

  it('shows pending pop-ups (act intro, quests) and continues on request', async () => {
    const w = mountLayout()
    const game = useGameStore()
    const dismiss = vi.spyOn(game, 'dismissModal').mockImplementation(() => {})
    game.modalTitle = 'Act Intro'
    game.modalBody = '<span class="theme-bold">ACT 1</span>'
    game.showModal = true
    await w.vm.$nextTick()

    const dialog = w.get('[role="dialog"]')
    expect(dialog.text()).toContain('Act Intro')
    expect(dialog.find('.theme-bold').text()).toBe('ACT 1')

    await dialog.get('button').trigger('click')
    expect(dismiss).toHaveBeenCalledTimes(1)
  })

  it('moves focus to Continue when a pop-up opens', async () => {
    wrapper = mount(LanternLayout, { attachTo: document.body })
    const game = useGameStore()
    game.modalTitle = 'Act Intro'
    game.showModal = true
    await wrapper.vm.$nextTick()

    expect(document.activeElement?.textContent?.trim()).toBe('Continue')
  })

  it('returns focus to the actions when the last pop-up closes', async () => {
    wrapper = mount(LanternLayout, { attachTo: document.body })
    const game = useGameStore()
    game.showModal = true
    await wrapper.vm.$nextTick()

    game.showModal = false
    game.acceptInput = true
    await wrapper.vm.$nextTick()

    expect(document.activeElement?.textContent?.trim()).toBe('Look')
  })

  it('continues the pop-up with Escape', async () => {
    const w = mountLayout()
    const game = useGameStore()
    const dismiss = vi.spyOn(game, 'dismissModal').mockImplementation(() => {})
    game.showModal = true
    await w.vm.$nextTick()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(dismiss).toHaveBeenCalledTimes(1)
  })

  it('brings the start of the newest turn into view', async () => {
    const scrolled: Element[] = []
    Element.prototype.scrollIntoView = function (this: Element) {
      scrolled.push(this)
    }
    const w = mountLayout()
    const turn = {
      command: 'look',
      text: 'Hi',
      room: 'Square',
      roomChanged: false,
      gained: [],
      lost: [],
      arrival: null,
    }
    useGameStore().turns = [
      { id: 1, ...turn },
      { id: 2, ...turn },
    ]
    await w.vm.$nextTick()
    await w.vm.$nextTick()

    const turns = w.findAll('[data-testid="turn"]')
    expect(scrolled.at(-1)).toBe(turns[1].element)
  })

  it('shows no pop-up when none is pending', () => {
    expect(mountLayout().find('[role="dialog"]').exists()).toBe(false)
  })

  it('heads the story with a level-two heading for screen readers', () => {
    expect(mountLayout().get('section[aria-label="Story"] h2').text()).toBe(
      'Story',
    )
  })
})
