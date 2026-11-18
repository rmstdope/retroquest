// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { GAME_NAME } from '@/engine'
import { startedHoldStore } from '@/testing/holdGame'
import { useGameStore } from '@/stores/useGameStore'
import { useNarrationStore } from '@/stores/useNarrationStore'

/** A laptop: a wide window with a mouse and keyboard. */
function laptop(): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query.includes('min-width') || query.includes('pointer: fine'),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

/** The Escape menu: ☰ and Escape open it, what it opens comes back to it, and Quit lands on the title page. */
describe('LanternLayout: the Escape menu', () => {
  let w: VueWrapper

  beforeEach(async () => {
    setActivePinia(createPinia())
    laptop()
    await startedHoldStore()
    useGameStore().showTitle = false
    w = mount(LanternLayout, { attachTo: document.body })
    await flushPromises()
  })
  afterEach(() => {
    w.unmount()
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const press = async (key: string, target: Element = document.body) => {
    target.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
    )
    await flushPromises()
  }
  const heading = (): string | undefined =>
    document.querySelector('[role="dialog"] h2')?.textContent?.trim()
  const entry = (label: string): HTMLElement =>
    [...document.querySelectorAll<HTMLElement>('[role="dialog"] button')].find(
      (b) => b.textContent?.trim() === label,
    )!
  const focused = (): string | undefined =>
    document.activeElement?.textContent?.trim()

  it('has no top bar at all', () => {
    expect(w.find('header').exists()).toBe(false)
    expect(w.text()).not.toContain(GAME_NAME)
    expect(w.find('[data-button="menu"]').exists()).toBe(true)
  })

  it('opens on Escape with nothing else to close, focus on Save, and closes on Escape', async () => {
    await press('Escape')
    expect(heading()).toBe('Menu')
    expect(document.querySelector('.lq-dialog-eyebrow')?.textContent).toBe(
      'Paused',
    )
    expect(focused()).toBe('Save')
    await press('Escape', document.activeElement!)
    expect(heading()).toBeUndefined()
  })

  it('opens from the ☰ button on the picture', async () => {
    w.get('[data-button="menu"]').element.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    )
    await flushPromises()
    expect(heading()).toBe('Menu')
  })

  it('opens with a held Escape once only', async () => {
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        repeat: true,
        bubbles: true,
        cancelable: true,
      }),
    )
    await flushPromises()
    expect(heading()).toBeUndefined()
  })

  it('first closes an open drawer: the menu needs another press', async () => {
    await press('q')
    expect(w.find('[aria-label="Quests drawer"]').exists()).toBe(true)
    await press('Escape', document.activeElement!)
    expect(w.find('[aria-label="Quests drawer"]').exists()).toBe(false)
    expect(heading()).toBeUndefined()
    await press('Escape')
    expect(heading()).toBe('Menu')
  })

  describe('the journey: Journal, Quests and Map', () => {
    const tile = (label: string): HTMLElement =>
      document.querySelector<HTMLElement>(
        `[role="dialog"] .lq-menu-journey[aria-label="${label}"]`,
      )!
    const label = (): string | null | undefined =>
      document.activeElement?.getAttribute('aria-label')

    it('has no Hint, Quests, Story so far or Map button on the picture, only ☰', () => {
      const buttons = w
        .findAll('.lq-stage-buttons [data-button]')
        .map((b) => b.attributes('data-button'))
      expect(buttons).toEqual(['menu'])
      expect(w.find('.lq-map-pop').exists()).toBe(false)
    })

    it('marks ☰ while a quest has news', async () => {
      useGameStore().questsHaveNew = false
      await flushPromises()
      expect(w.find('[data-button="menu"] .lq-dot').exists()).toBe(false)
      useGameStore().questsHaveNew = true
      await flushPromises()
      expect(w.find('[data-button="menu"] .lq-dot').exists()).toBe(true)
    })

    it.each([
      ['Journal', '[aria-label="Journal drawer"]'],
      ['Quests', '[aria-label="Quests drawer"]'],
    ])(
      'opens the %s from the menu, and closing it comes back to the menu, focus on its tile',
      async (name, drawer) => {
        await press('Escape')
        tile(name).click()
        await flushPromises()
        expect(heading()).toBeUndefined()
        expect(w.find(drawer).exists()).toBe(true)
        await press('Escape', document.activeElement!)
        expect(w.find(drawer).exists()).toBe(false)
        expect(heading()).toBe('Menu')
        expect(label()).toBe(name)
      },
    )

    it('comes back to the menu when the drawer opened from it closes with its ✕', async () => {
      await press('Escape')
      tile('Journal').click()
      await flushPromises()
      w.get(
        '[aria-label="Journal drawer"] [aria-label="Close"]',
      ).element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await flushPromises()
      expect(heading()).toBe('Menu')
      expect(label()).toBe('Journal')
    })

    it('opens the bigger map from the menu, and closing it comes back to the menu', async () => {
      await press('Escape')
      tile('Map').click()
      await flushPromises()
      expect(heading()).toBe('Map')
      await press('Escape', document.activeElement!)
      expect(heading()).toBe('Menu')
      expect(label()).toBe('Map')
    })

    it.each([
      ['j', '[aria-label="Journal drawer"]'],
      ['q', '[aria-label="Quests drawer"]'],
    ])(
      '%s opens its drawer from the game, again closes it, and Escape leaves no menu',
      async (key, drawer) => {
        await press(key)
        expect(w.find(drawer).exists()).toBe(true)
        await press(key)
        expect(w.find(drawer).exists()).toBe(false)
        await press(key)
        await press('Escape', document.activeElement!)
        expect(w.find(drawer).exists()).toBe(false)
        expect(heading()).toBeUndefined()
      },
    )

    it('M opens the bigger map from the game, and Escape or M closes it, leaving no menu', async () => {
      await press('m')
      expect(heading()).toBe('Map')
      await press('Escape', document.activeElement!)
      expect(heading()).toBeUndefined()
      await press('M')
      expect(heading()).toBe('Map')
      await press('m', document.activeElement!)
      expect(heading()).toBeUndefined()
    })

    it('J, Q and M in the menu open as its tiles do, and come back to it', async () => {
      await press('Escape')
      await press('q', document.activeElement!)
      expect(heading()).toBeUndefined()
      expect(w.find('[aria-label="Quests drawer"]').exists()).toBe(true)
      await press('Escape', document.activeElement!)
      expect(heading()).toBe('Menu')
      expect(label()).toBe('Quests')
      await press('m', document.activeElement!)
      expect(heading()).toBe('Map')
    })

    it('leaves J, Q and M alone while the quit question is up', async () => {
      await press('Escape')
      entry('Quit').click()
      await flushPromises()
      for (const key of ['j', 'q', 'm'])
        await press(key, document.activeElement!)
      expect(heading()).toBe('Quit to the main menu?')
      expect(w.find('[aria-label="Quests drawer"]').exists()).toBe(false)
      expect(w.find('[aria-label="Journal drawer"]').exists()).toBe(false)
      entry('Cancel').click()
      await flushPromises()
      expect(heading()).toBe('Menu')
    })

    it.each([
      [
        'a quest window',
        () => (useGameStore().shownQuest = 'Hint of magic'),
        () => (useGameStore().shownQuest = null),
      ],
      [
        'a chapter page',
        () => {
          const game = useGameStore()
          game.modalChapter = {
            kind: 'intro',
            act: 'Act I',
            title: 'T',
            body: 'B',
          }
          game.showModal = true
        },
        () => {
          const game = useGameStore()
          game.showModal = false
          game.modalChapter = null
        },
      ],
      [
        'the title page',
        () => (useGameStore().showTitle = true),
        () => (useGameStore().showTitle = false),
      ],
      [
        'the end',
        () => (useGameStore().ending = { text: 'The end.', saved: true }),
        () => (useGameStore().ending = null),
      ],
    ])(
      'leaves J, Q and M alone under %s, with nothing waiting under it',
      async (_name, raise, lower) => {
        raise()
        await flushPromises()
        for (const key of ['j', 'q', 'm']) await press(key)
        // Nothing opened behind it shows once it is gone.
        lower()
        await flushPromises()
        expect(w.find('[aria-label="Quests drawer"]').exists()).toBe(false)
        expect(w.find('[aria-label="Journal drawer"]').exists()).toBe(false)
        expect(heading()).toBeUndefined()
      },
    )

    it('forgets what had focus before a drawer that went some other way', async () => {
      const before = w.get<HTMLElement>('[data-button="menu"]').element
      before.focus()
      await press('q', before)
      // The drawer goes with a press outside it, not by its own closing.
      document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
      await flushPromises()
      expect(w.find('[aria-label="Quests drawer"]').exists()).toBe(false)
      ;(document.activeElement as HTMLElement | null)?.blur()
      await press('Escape')
      tile('Journal').click()
      await flushPromises()
      await press('m', document.activeElement!)
      expect(heading()).toBe('Map')
      await press('Escape', document.activeElement!)
      expect(document.activeElement).not.toBe(before)
    })

    it('gives focus back to what opened the menu when M follows a drawer the menu opened', async () => {
      const opener = w.get<HTMLElement>('[data-button="menu"]').element
      opener.focus()
      opener.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await flushPromises()
      tile('Journal').click()
      await flushPromises()
      await press('m', document.activeElement!)
      expect(heading()).toBe('Map')
      // M is a key in the game: the map closes back to the game, focus where the menu was opened from.
      await press('Escape', document.activeElement!)
      expect(heading()).toBeUndefined()
      expect(document.activeElement).toBe(opener)
    })

    it('keeps the voice paused while what the menu opened is up, the map and the drawers alike', async () => {
      const narration = useNarrationStore()
      const resume = vi.spyOn(narration, 'resume')
      await press('Escape')
      tile('Map').click()
      await flushPromises()
      await press('Escape', document.activeElement!)
      tile('Journal').click()
      await flushPromises()
      expect(w.find('[aria-label="Journal drawer"]').exists()).toBe(true)
      expect(resume).not.toHaveBeenCalled()
      await press('Escape', document.activeElement!)
      expect(heading()).toBe('Menu')
      expect(resume).not.toHaveBeenCalled()
    })

    it('does not bring the menu back when a drawer it opened goes some other way', async () => {
      await press('Escape')
      tile('Journal').click()
      await flushPromises()
      useGameStore().submitCommand('look')
      await flushPromises()
      expect(w.find('[aria-label="Journal drawer"]').exists()).toBe(false)
      expect(heading()).toBeUndefined()
      await press('j')
      await press('Escape', document.activeElement!)
      expect(heading()).toBeUndefined()
    })

    it('gives focus back to the Quests tile when Q switched the journal opened from the menu', async () => {
      await press('Escape')
      tile('Journal').click()
      await flushPromises()
      await press('q', document.activeElement!)
      expect(w.find('[aria-label="Quests drawer"]').exists()).toBe(true)
      await press('Escape', document.activeElement!)
      expect(heading()).toBe('Menu')
      expect(label()).toBe('Quests')
    })

    it('forgets the menu when ☰ opens it again over a drawer it opened', async () => {
      await press('Escape')
      tile('Journal').click()
      await flushPromises()
      w.get('[data-button="menu"]').element.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      )
      await flushPromises()
      expect(heading()).toBe('Menu')
      await press('Escape', document.activeElement!)
      expect(heading()).toBeUndefined()
      expect(w.find('[aria-label="Journal drawer"]').exists()).toBe(false)
    })

    it('puts a drawer away when the menu opens the map', async () => {
      await press('q')
      expect(w.find('[aria-label="Quests drawer"]').exists()).toBe(true)
      w.get('[data-button="menu"]').element.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      )
      await flushPromises()
      tile('Map').click()
      await flushPromises()
      expect(heading()).toBe('Map')
      expect(w.find('[aria-label="Quests drawer"]').exists()).toBe(false)
    })

    it('gives focus back to what had it before the drawer when M follows Q', async () => {
      const typing = w.get<HTMLElement>('[data-button="menu"]').element
      typing.focus()
      await press('q', typing)
      await press('m', document.activeElement!)
      expect(heading()).toBe('Map')
      await press('Escape', document.activeElement!)
      expect(heading()).toBeUndefined()
      expect(document.activeElement).toBe(typing)
    })

    it('J switches from the quests to the journal', async () => {
      await press('q')
      await press('j')
      expect(w.find('[aria-label="Quests drawer"]').exists()).toBe(false)
      expect(w.find('[aria-label="Journal drawer"]').exists()).toBe(true)
    })

    it('leaves J, Q and M to a text field, and to Ctrl and ⌘', async () => {
      const field = document.createElement('input')
      document.body.appendChild(field)
      for (const key of ['j', 'q', 'm']) await press(key, field)
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'q',
          metaKey: true,
          bubbles: true,
          cancelable: true,
        }),
      )
      await flushPromises()
      expect(w.find('[aria-label="Quests drawer"]').exists()).toBe(false)
      expect(w.find('[aria-label="Journal drawer"]').exists()).toBe(false)
      expect(heading()).toBeUndefined()
    })
  })

  it('first closes the word list, then hides the typing box: the menu needs another press', async () => {
    useGameStore().acceptInput = true
    await flushPromises()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F1' }))
    await flushPromises()
    const box = document.querySelector<HTMLInputElement>(
      'input[aria-label="Command"]',
    )!
    box.focus()
    box.value = 'xyz'
    box.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()
    await press('Escape', box)
    await press('Escape', box)
    expect(document.querySelector('input[aria-label="Command"]')).toBeNull()
    expect(heading()).toBeUndefined()
  })

  it('does not open on the title page, a chapter page, a game pop-up or the end screen', async () => {
    const game = useGameStore()
    game.showTitle = true
    await flushPromises()
    await press('Escape')
    expect(document.querySelector('.lq-dialog-centered')).toBeNull()
    game.showTitle = false
    game.modalChapter = { kind: 'intro', act: 'Act I', title: 'T', body: 'B' }
    game.showModal = true
    await flushPromises()
    await press('Escape')
    expect(document.querySelector('.lq-dialog-centered')).toBeNull()
    game.showModal = false
    game.modalChapter = null
    game.ending = { text: 'The end.', saved: true }
    await flushPromises()
    await press('Escape')
    expect(document.querySelector('.lq-dialog-centered')).toBeNull()
  })

  it('returns to the menu, focus on the entry, when a window opened from it closes', async () => {
    await press('Escape')
    entry('Settings').click()
    await flushPromises()
    expect(heading()).toBe('Settings')
    await press('Escape', document.activeElement!)
    expect(heading()).toBe('Menu')
    expect(focused()).toBe('Settings')
    // Escape closes everything from the menu.
    await press('Escape', document.activeElement!)
    expect(heading()).toBeUndefined()
  })

  it('closes everything, back to the game, when a slot is loaded', async () => {
    const game = useGameStore()
    vi.spyOn(game, 'getSaveSlots').mockReturnValue([])
    vi.spyOn(game, 'getNamedSaves').mockReturnValue([])
    await press('Escape')
    entry('Quick load').click()
    await flushPromises()
    expect(heading()).toBeUndefined()
  })

  it('asks before quitting, focus on Cancel, and Cancel goes back to the menu', async () => {
    await press('Escape')
    entry('Quit').click()
    await flushPromises()
    expect(heading()).toBe('Quit to the main menu?')
    expect(focused()).toBe('Cancel')
    entry('Cancel').click()
    await flushPromises()
    expect(heading()).toBe('Menu')
    expect(focused()).toBe('Quit')
  })

  it('quits to the title page, nothing of the menu left behind', async () => {
    const game = useGameStore()
    await press('Escape')
    entry('Quit').click()
    await flushPromises()
    entry('Quit without saving').click()
    await flushPromises()
    expect(game.showTitle).toBe(true)
    expect(game.quitAsked).toBe(false)
    expect(document.querySelector('.lq-dialog-centered')).toBeNull()
    // The title page keeps Escape for nothing: no menu over it.
    await press('Escape')
    expect(document.querySelector('.lq-dialog-centered')).toBeNull()
  })

  it('asks the same question for a typed quit, and Cancel leaves no menu', async () => {
    const game = useGameStore()
    game.submitCommand('quit')
    await flushPromises()
    expect(heading()).toBe('Quit to the main menu?')
    entry('Cancel').click()
    await flushPromises()
    expect(heading()).toBeUndefined()
  })

  it('pauses the narration while the menu or what it opens is up, and resumes it after', async () => {
    const narration = useNarrationStore()
    const pause = vi.spyOn(narration, 'pause')
    const resume = vi.spyOn(narration, 'resume')
    await press('Escape')
    expect(pause).toHaveBeenCalledOnce()
    entry('Quit').click()
    await flushPromises()
    entry('Cancel').click()
    await flushPromises()
    expect(resume).not.toHaveBeenCalled()
    await press('Escape', document.activeElement!)
    expect(resume).toHaveBeenCalledOnce()
  })

  describe('with the typing box up (rq-9let)', () => {
    const box = (): HTMLInputElement | null =>
      document.querySelector<HTMLInputElement>('input[aria-label="Command"]')
    const click = async (button: string): Promise<void> => {
      w.get(`[data-button="${button}"]`).element.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      )
      await flushPromises()
    }

    beforeEach(async () => {
      useGameStore().acceptInput = true
      await flushPromises()
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F1' }))
      await flushPromises()
      expect(document.activeElement).toBe(box())
    })

    it('gives the cursor back to the box when the menu closes', async () => {
      w.get<HTMLElement>('[data-button="menu"]').element.focus()
      await click('menu')
      expect(heading()).toBe('Menu')
      await press('Escape', document.activeElement!)
      expect(heading()).toBeUndefined()
      expect(document.activeElement).toBe(box())
    })

    it.each([
      ['q', '[aria-label="Quests drawer"]'],
      ['j', '[aria-label="Journal drawer"]'],
    ])(
      'gives the cursor back to the box when the drawer %s opened closes',
      async (key, drawer) => {
        box()?.blur()
        await press(key)
        expect(w.find(drawer).exists()).toBe(true)
        await press('Escape', document.activeElement!)
        expect(w.find(drawer).exists()).toBe(false)
        expect(document.activeElement).toBe(box())
      },
    )

    it('gives the cursor back to the box when the Map closes', async () => {
      box()?.blur()
      await press('m')
      expect(heading()).toBe('Map')
      await press('Escape', document.activeElement!)
      expect(heading()).toBeUndefined()
      expect(document.activeElement).toBe(box())
    })
  })

  describe('F, full screen', () => {
    let request: ReturnType<typeof vi.fn>

    beforeEach(() => {
      request = vi.fn(() => Promise.resolve())
      document.documentElement.requestFullscreen =
        request as unknown as typeof document.documentElement.requestFullscreen
    })
    afterEach(() => {
      Reflect.deleteProperty(document, 'fullscreenEnabled')
    })

    async function mountSupported(supported: boolean): Promise<void> {
      w.unmount()
      Object.defineProperty(document, 'fullscreenEnabled', {
        value: supported,
        configurable: true,
      })
      w = mount(LanternLayout, { attachTo: document.body })
      await flushPromises()
    }

    it('switches full screen on with F anywhere in the game', async () => {
      await mountSupported(true)
      await press('f')
      expect(request).toHaveBeenCalledOnce()
    })

    it('leaves F to a text field', async () => {
      await mountSupported(true)
      const field = document.createElement('input')
      document.body.appendChild(field)
      await press('f', field)
      expect(request).not.toHaveBeenCalled()
    })

    it('does nothing where full screen cannot work', async () => {
      await mountSupported(false)
      await press('F')
      expect(request).not.toHaveBeenCalled()
    })
  })
})
