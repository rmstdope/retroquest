// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ActionComposer from './ActionComposer.vue'
import { useGameStore } from '@/stores/useGameStore'
import { useSettingsStore } from '@/stores/useSettingsStore'

describe('ActionComposer', () => {
  let wrapper: VueWrapper | undefined
  let submit: ReturnType<typeof vi.fn<(command: string) => void>>

  beforeEach(() => {
    setActivePinia(createPinia())
    const game = useGameStore()
    game.acceptInput = true
    game.items = ['bucket', 'old notice']
    game.characters = ['mira']
    game.exits = { north: "Mira's Hut", east: 'General Store' }
    game.bagEntries = ['[item_name]lantern[/item_name]']
    game.spellEntries = ['[spell_name]revive[/spell_name]']
    game.roomWares = []
    submit = vi.fn<(command: string) => void>()
    vi.spyOn(game, 'submitCommand').mockImplementation(submit)
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  function mountComposer() {
    wrapper = mount(ActionComposer, { attachTo: document.body })
    return wrapper
  }

  function button(w: VueWrapper, name: string) {
    const found = w
      .findAll('button')
      .find(
        (b) => b.attributes('aria-label') === name || b.text().trim() === name,
      )
    if (!found) throw new Error(`No button "${name}"`)
    return found
  }

  it('starts in actions mode by default', () => {
    const w = mountComposer()

    expect(button(w, 'Actions').attributes('aria-pressed')).toBe('true')
    expect(button(w, 'Type').attributes('aria-pressed')).toBe('false')
    expect(w.find('input[aria-label="Command"]').exists()).toBe(false)
  })

  it("starts in type mode when that is the player's choice", () => {
    useSettingsStore().startMode = 'type'
    const w = mountComposer()

    expect(button(w, 'Type').attributes('aria-pressed')).toBe('true')
    expect(w.find('input[aria-label="Command"]').exists()).toBe(true)
  })

  it('moves at once with a go button', async () => {
    const w = mountComposer()

    await button(w, "Go north to Mira's Hut").trigger('click')

    expect(submit).toHaveBeenCalledWith('go north')
  })

  it('runs a verb without targets at once', async () => {
    const w = mountComposer()

    await button(w, 'Look').trigger('click')

    expect(submit).toHaveBeenCalledWith('look')
  })

  it('builds a command from a verb and a target chip', async () => {
    const w = mountComposer()

    await button(w, 'Take').trigger('click')
    expect(w.get('[data-testid="preview"]').text()).toContain('take')
    expect(button(w, 'Do it').attributes()).toHaveProperty('disabled')

    await button(w, 'Bucket').trigger('click')
    expect(w.get('[data-testid="preview"]').text()).toBe('take bucket')

    await button(w, 'Do it').trigger('click')
    expect(submit).toHaveBeenCalledWith('take bucket')
    expect(w.find('[data-testid="preview"]').exists()).toBe(false)
  })

  it('allows an optional second target', async () => {
    const w = mountComposer()
    await button(w, 'Use').trigger('click')
    await button(w, 'Lantern').trigger('click')

    expect(w.get('[data-testid="preview"]').text()).toBe('use lantern')
    expect(button(w, 'Do it').attributes()).not.toHaveProperty('disabled')

    await button(w, 'Bucket').trigger('click')
    expect(w.get('[data-testid="preview"]').text()).toBe(
      'use lantern with bucket',
    )
  })

  it('takes free text for what to say', async () => {
    const w = mountComposer()
    await button(w, 'Say').trigger('click')

    await w.get('input[aria-label="Words to say"]').setValue('hello there')
    await button(w, 'Mira').trigger('click')

    expect(w.get('[data-testid="preview"]').text()).toBe(
      'say hello there to mira',
    )
  })

  it('explains when there is nothing to choose', async () => {
    useGameStore().items = []
    const w = mountComposer()

    await button(w, 'Take').trigger('click')

    expect(w.text()).toContain('Nothing to take here')
  })

  it('cancels a half-built command', async () => {
    const w = mountComposer()
    await button(w, 'Take').trigger('click')

    await button(w, 'Cancel').trigger('click')

    expect(w.find('[data-testid="preview"]').exists()).toBe(false)
  })

  it('shows the reference commands under More', async () => {
    const w = mountComposer()
    expect(w.findAll('button').some((b) => b.text() === 'Map')).toBe(false)

    await button(w, 'More…').trigger('click')
    await button(w, 'Map').trigger('click')

    expect(submit).toHaveBeenCalledWith('map')
  })

  it('sends a typed command in type mode and clears the box', async () => {
    const w = mountComposer()
    await button(w, 'Type').trigger('click')

    const input = w.get('input[aria-label="Command"]')
    await input.setValue('look at notice')
    await w.get('form').trigger('submit')

    expect(submit).toHaveBeenCalledWith('look at notice')
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('disables everything while the game is not accepting input', () => {
    useGameStore().acceptInput = false
    const w = mountComposer()

    expect(button(w, 'Look').attributes()).toHaveProperty('disabled')
    expect(button(w, "Go north to Mira's Hut").attributes()).toHaveProperty(
      'disabled',
    )
  })

  it('marks the chosen verb as pressed', async () => {
    const w = mountComposer()

    await button(w, 'Take').trigger('click')

    expect(button(w, 'Take').attributes('aria-pressed')).toBe('true')
    expect(button(w, 'Drop').attributes('aria-pressed')).toBe('false')
  })

  it('names the part of the sentence each slot pill fills', async () => {
    const w = mountComposer()
    await button(w, 'Use').trigger('click')

    expect(button(w, 'Use: choose…').exists()).toBe(true)
    expect(button(w, 'with: optional').exists()).toBe(true)

    await button(w, 'Lantern').trigger('click')
    expect(button(w, 'Use: Lantern').exists()).toBe(true)
  })

  it('lets the player clear the optional target again', async () => {
    const w = mountComposer()
    await button(w, 'Use').trigger('click')
    await button(w, 'Lantern').trigger('click')
    await button(w, 'Bucket').trigger('click')

    await button(w, 'with: Bucket').trigger('click')
    await button(w, 'None').trigger('click')

    expect(w.get('[data-testid="preview"]').text()).toBe('use lantern')
  })

  it('drops a chosen target that is no longer here', async () => {
    const game = useGameStore()
    const w = mountComposer()
    await button(w, 'Use').trigger('click')
    await button(w, 'Bucket').trigger('click')
    expect(w.get('[data-testid="preview"]').text()).toBe('use bucket')

    game.items = ['old notice']
    await w.vm.$nextTick()

    expect(w.get('[data-testid="preview"]').text()).toBe('use …')
    expect(button(w, 'Do it').attributes()).toHaveProperty('disabled')
  })

  it('moves focus to the choices, then to Do it, then back to the verb', async () => {
    const w = mountComposer()

    await button(w, 'Take').trigger('click')
    await w.vm.$nextTick()
    expect(document.activeElement).toBe(button(w, 'Bucket').element)

    await button(w, 'Bucket').trigger('click')
    await w.vm.$nextTick()
    expect(document.activeElement).toBe(button(w, 'Do it').element)

    await button(w, 'Do it').trigger('click')
    await w.vm.$nextTick()
    expect(document.activeElement).toBe(button(w, 'Take').element)
  })

  it('returns focus to the verb after Cancel', async () => {
    const w = mountComposer()
    await button(w, 'Say').trigger('click')
    await w.vm.$nextTick()
    expect(document.activeElement).toBe(
      w.get('input[aria-label="Words to say"]').element,
    )

    await button(w, 'Cancel').trigger('click')
    await w.vm.$nextTick()

    expect(document.activeElement).toBe(button(w, 'Say').element)
  })
})
