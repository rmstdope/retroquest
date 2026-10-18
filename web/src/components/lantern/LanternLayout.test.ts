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
      },
      {
        id: 2,
        command: 'take bucket',
        text: '[item_name]Bucket[/item_name] taken.',
        room: 'Square',
        roomChanged: false,
        gained: [],
        lost: [],
      },
    ]
    await w.vm.$nextTick()

    const turns = w.findAll('[data-testid="turn"]')
    expect(turns).toHaveLength(2)
    expect(turns[1].text()).toContain('take bucket')
    expect(turns[1].find('.theme-item_name').text()).toBe('Bucket')
  })

  it('sends a typed command to the game and clears the box', async () => {
    const w = mountLayout()
    const game = useGameStore()
    game.acceptInput = true
    const submit = vi.spyOn(game, 'submitCommand').mockImplementation(() => {})
    await w.vm.$nextTick()

    const input = w.get('input[aria-label="Command"]')
    await input.setValue('look')
    await w.get('form').trigger('submit')

    expect(submit).toHaveBeenCalledWith('look')
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('disables the command box while the game is not accepting input', () => {
    const w = mountLayout()

    expect(w.get('input[aria-label="Command"]').attributes()).toHaveProperty(
      'disabled',
    )
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

  it('shows no pop-up when none is pending', () => {
    expect(mountLayout().find('[role="dialog"]').exists()).toBe(false)
  })
})
