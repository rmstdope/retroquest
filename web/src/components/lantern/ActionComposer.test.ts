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
    // Settings persist in localStorage; give every test a fresh, empty one.
    const stored = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => stored.set(key, value),
      removeItem: (key: string) => stored.delete(key),
    })
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
    vi.unstubAllGlobals()
    vi.useRealTimers()
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

  it('marks its root as typing only in type mode, so the sheet lets the completion list out', async () => {
    const w = mountComposer()
    expect(w.classes()).not.toContain('lq-typing')

    await button(w, 'Type').trigger('click')
    expect(w.classes()).toContain('lq-typing')

    await button(w, 'Actions').trigger('click')
    expect(w.classes()).not.toContain('lq-typing')
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

  it('puts the builder away when the selected verb is tapped again', async () => {
    const w = mountComposer()
    await button(w, 'Use').trigger('click')
    await button(w, 'Lantern').trigger('click')

    await button(w, 'Use').trigger('click')

    expect(w.find('[data-testid="preview"]').exists()).toBe(false)
    expect(submit).not.toHaveBeenCalled()
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

  it('leaves focus in a pop-up that the command opened', async () => {
    const game = useGameStore()
    const continueButton = document.createElement('button')
    document.body.appendChild(continueButton)
    submit.mockImplementation(() => {
      game.showModal = true
      continueButton.focus()
    })
    const w = mountComposer()
    await button(w, 'Take').trigger('click')
    await button(w, 'Bucket').trigger('click')

    await button(w, 'Do it').trigger('click')
    await w.vm.$nextTick()

    expect(document.activeElement).toBe(continueButton)
    continueButton.remove()
  })

  it('keeps focus in the go row after moving to a room with other exits', async () => {
    const game = useGameStore()
    submit.mockImplementation(() => {
      game.exits = { south: 'Village Square' }
    })
    const w = mountComposer()
    ;(button(w, "Go north to Mira's Hut").element as HTMLElement).focus()

    await button(w, "Go north to Mira's Hut").trigger('click')
    await w.vm.$nextTick()

    expect(document.activeElement).toBe(
      button(w, 'Go south to Village Square').element,
    )
  })

  it('returns focus to More… after running one of its commands', async () => {
    const w = mountComposer()
    await button(w, 'More…').trigger('click')
    ;(button(w, 'Inventory').element as HTMLElement).focus()

    await button(w, 'Inventory').trigger('click')
    await w.vm.$nextTick()

    expect(submit).toHaveBeenCalledWith('inventory')
    expect(document.activeElement).toBe(button(w, 'More…').element)
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

  it('focuses the first verb, or the command box in type mode', async () => {
    wrapper = mount(ActionComposer, { attachTo: document.body })
    const composer = wrapper.vm as unknown as { focus: () => void }

    composer.focus()
    expect(document.activeElement?.textContent?.trim()).toBe('Look')

    await button(wrapper, 'Type').trigger('click')
    composer.focus()
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Command')
  })

  it('puts a half-built command away with Escape', async () => {
    const w = mountComposer()
    await button(w, 'Take').trigger('click')

    await w.get('section').trigger('keydown', { key: 'Escape' })

    expect(w.find('[data-testid="preview"]').exists()).toBe(false)
  })

  it('leaves a half-built command alone when Escape continues a pop-up', async () => {
    const w = mountComposer()
    await button(w, 'Take').trigger('click')
    useGameStore().showModal = true

    await w.get('section').trigger('keydown', { key: 'Escape' })

    expect(w.find('[data-testid="preview"]').text()).toBe('take …')
  })

  it('moves on to choosing who to talk to after Enter in Say', async () => {
    wrapper = mount(ActionComposer, { attachTo: document.body })
    await button(wrapper, 'Say').trigger('click')
    const words = wrapper.get('input[aria-label="Words to say"]')
    await words.setValue('hello')

    await words.trigger('keydown', { key: 'Enter' })
    await wrapper.vm.$nextTick()

    expect(document.activeElement?.textContent?.trim()).toBe('Mira')
  })

  it('runs Say on Enter once the command is complete', async () => {
    const w = mountComposer()
    await button(w, 'Say').trigger('click')
    await button(w, 'Mira').trigger('click')
    const words = w.get('input[aria-label="Words to say"]')
    await words.setValue('hello')

    await words.trigger('keydown', { key: 'Enter' })

    expect(submit).toHaveBeenCalledWith('say hello to mira')
  })

  it('returns focus to the verb used last', async () => {
    wrapper = mount(ActionComposer, { attachTo: document.body })
    await button(wrapper, 'Talk').trigger('click')
    await button(wrapper, 'Mira').trigger('click')
    await button(wrapper, 'Do it').trigger('click')
    ;(document.activeElement as HTMLElement | null)?.blur()
    ;(wrapper.vm as unknown as { focus: () => void }).focus()

    expect(document.activeElement?.textContent?.trim()).toBe('Talk')
  })

  it('puts a half-built command away when the player changes room', async () => {
    const w = mountComposer()
    await button(w, 'Use').trigger('click')

    useGameStore().roomName = 'Vegetable Field'
    await w.vm.$nextTick()

    expect(w.find('[data-testid="preview"]').exists()).toBe(false)
  })

  describe('type mode completion', () => {
    async function typeMode() {
      useGameStore().completionTree = {
        take: { bucket: null, bread: null },
        look: null,
      }
      const w = mountComposer()
      await button(w, 'Type').trigger('click')
      return { w, input: w.get('input[aria-label="Command"]') }
    }

    it('completes a single match with Tab', async () => {
      const { input } = await typeMode()
      await input.setValue('lo')

      await input.trigger('keydown', { key: 'Tab' })

      expect((input.element as HTMLInputElement).value).toBe('look ')
    })

    it('lists several matches and applies the chosen one with Enter', async () => {
      const { w, input } = await typeMode()
      await input.setValue('take b')

      await input.trigger('keydown', { key: 'Tab' })
      const options = w.findAll('[role="option"]').map((o) => o.text())
      expect(options).toEqual(['bucket', 'bread'])

      await input.trigger('keydown', { key: 'ArrowDown' })
      await input.trigger('keydown', { key: 'ArrowDown' })
      await input.trigger('keydown', { key: 'Enter' })

      expect((input.element as HTMLInputElement).value).toBe('take bread ')
      expect(submit).not.toHaveBeenCalled()
      expect(w.find('[role="option"]').exists()).toBe(false)
    })

    it('scrolls the highlighted match into view in a long list', async () => {
      // jsdom has no scrollIntoView; record which option asks for it.
      const scrolled: string[] = []
      HTMLElement.prototype.scrollIntoView = function (this: HTMLElement) {
        scrolled.push(this.textContent?.trim() ?? '')
      }
      const { input } = await typeMode()
      await input.setValue('take b')
      await input.trigger('keydown', { key: 'Tab' })

      await input.trigger('keydown', { key: 'ArrowDown' })
      await input.trigger('keydown', { key: 'ArrowDown' })

      expect(scrolled).toEqual(['bucket', 'bread'])
      delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView
    })

    it('closes the list with Escape and keeps the text', async () => {
      const { w, input } = await typeMode()
      await input.setValue('take b')
      await input.trigger('keydown', { key: 'Tab' })

      await input.trigger('keydown', { key: 'Escape' })

      expect(w.find('[role="option"]').exists()).toBe(false)
      expect((input.element as HTMLInputElement).value).toBe('take b')
    })

    it('sends the command with Enter when no match is chosen', async () => {
      const { input } = await typeMode()
      await input.setValue('look')

      await input.trigger('keydown', { key: 'Enter' })

      expect(submit).toHaveBeenCalledWith('look')
    })
  })

  describe('as a foldable sheet (phones)', () => {
    it('has no hide button by default', () => {
      expect(
        mountComposer().find('button[aria-label="Hide actions"]').exists(),
      ).toBe(false)
    })

    it('asks to fold with the hide button', async () => {
      const w = mount(ActionComposer, { props: { foldable: true } })
      wrapper = w

      await w.get('button[aria-label="Hide actions"]').trigger('click')

      expect(w.emitted('fold')).toHaveLength(1)
    })

    it('can be opened in a chosen mode', async () => {
      const w = mountComposer()

      ;(
        w.vm as unknown as { setMode: (m: 'actions' | 'type') => void }
      ).setMode('type')
      await w.vm.$nextTick()

      expect(w.find('input[aria-label="Command"]').exists()).toBe(true)
    })
  })

  describe('shake on failure', () => {
    // Type mode always shows Do it.
    beforeEach(() => {
      useSettingsStore().startMode = 'type'
    })

    function answer(command: string | null, text: string, id = 1) {
      useGameStore().turns = [
        {
          id,
          command,
          text,
          room: 'Hall',
          roomChanged: false,
          gained: [],
          lost: [],
          arrival: null,
        },
      ]
    }

    /**
     * Send a command from the composer (Type mode) whose answer arrives at
     * once, as the store's submitCommand adds it.
     */
    async function typeAndRun(w: VueWrapper, command: string, reply: string) {
      submit.mockImplementationOnce(() => answer(command, reply))
      await w.get('input[aria-label="Command"]').setValue(command)
      await w.get('form').trigger('submit')
    }

    it('shakes Do it when the command failed', async () => {
      const w = mountComposer()

      await typeAndRun(
        w,
        'go south',
        "[failure]You can't go that way.[/failure]",
      )
      await w.vm.$nextTick()

      expect(w.get('.lq-do').classes()).toContain('lq-shake')
    })

    it('stops shaking when the shake is over', async () => {
      vi.useFakeTimers()
      const w = mountComposer()
      await typeAndRun(
        w,
        'go south',
        "[failure]You can't go that way.[/failure]",
      )
      await w.vm.$nextTick()

      vi.advanceTimersByTime(320)
      await w.vm.$nextTick()

      expect(w.get('.lq-do').classes()).not.toContain('lq-shake')
    })

    it('does not shake later when nothing showed the failure', async () => {
      // A failed move from the compass before any verb was used: no verb
      // shakes, and opening a verb afterwards must not shake its Do it.
      vi.useFakeTimers()
      useSettingsStore().startMode = 'actions'
      const w = mountComposer()
      answer('go south', "[failure]You can't go that way.[/failure]")
      await w.vm.$nextTick()

      vi.advanceTimersByTime(320)
      await button(w, 'Take').trigger('click')

      expect(w.get('.lq-do').classes()).not.toContain('lq-shake')
    })

    it('shakes the verb used last in Actions mode', async () => {
      useSettingsStore().startMode = 'actions'
      const w = mountComposer()
      submit.mockImplementationOnce(() =>
        answer('look', '[failure]It is too dark to see.[/failure]'),
      )

      await button(w, 'Look').trigger('click')
      await w.vm.$nextTick()

      expect(button(w, 'Look').classes()).toContain('lq-shake')
      expect(button(w, 'Take').classes()).not.toContain('lq-shake')
    })

    it('does not shake for a later failure after a command with no answer', async () => {
      const w = mountComposer()
      // A save adds no turn (it shows a toast).
      submit.mockImplementationOnce(() => {})
      await w.get('input[aria-label="Command"]').setValue('save')
      await w.get('form').trigger('submit')
      await w.vm.$nextTick()

      answer('go south', "[failure]You can't go that way.[/failure]", 2)
      await w.vm.$nextTick()

      expect(w.get('.lq-do').classes()).not.toContain('lq-shake')
    })

    it('does not shake for a command sent from elsewhere (compass, journal)', async () => {
      const w = mountComposer()

      answer('go south', "[failure]You can't go that way.[/failure]")
      await w.vm.$nextTick()

      expect(w.get('.lq-do').classes()).not.toContain('lq-shake')
    })

    it('does not shake when the command worked', async () => {
      const w = mountComposer()

      answer('look', 'You look around.')
      await w.vm.$nextTick()

      expect(w.get('.lq-do').classes()).not.toContain('lq-shake')
    })

    it("does not shake for the game's own output", async () => {
      const w = mountComposer()

      answer(null, '[failure]No save file found.[/failure]')
      await w.vm.$nextTick()

      expect(w.get('.lq-do').classes()).not.toContain('lq-shake')
    })
  })
})
