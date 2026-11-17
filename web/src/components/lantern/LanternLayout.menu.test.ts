// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
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
    expect(w.text()).not.toContain('Tales of Twinmoor')
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
    await w.get('[data-button="quests"]').trigger('click')
    await flushPromises()
    await press('Escape', document.activeElement!)
    expect(w.find('[aria-label="Journal drawer"]').exists()).toBe(false)
    expect(heading()).toBeUndefined()
    await press('Escape')
    expect(heading()).toBe('Menu')
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

  it('first closes the small map: the menu needs another press', async () => {
    await w.get('[data-button="map"]').trigger('click')
    await flushPromises()
    expect(w.find('.lq-map-pop').exists()).toBe(true)
    await press('Escape')
    expect(w.find('.lq-map-pop').exists()).toBe(false)
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

    it('gives the cursor back to the box when the Quests drawer closes', async () => {
      w.get<HTMLElement>('[data-button="quests"]').element.focus()
      await click('quests')
      expect(w.find('[aria-label="Journal drawer"]').exists()).toBe(true)
      await press('Escape', document.activeElement!)
      expect(w.find('[aria-label="Journal drawer"]').exists()).toBe(false)
      expect(document.activeElement).toBe(box())
    })

    it('gives the cursor back to the box when the Story so far drawer closes', async () => {
      w.get<HTMLElement>('[data-button="story"]').element.focus()
      await click('story')
      expect(w.find('.lq-story-drawer').exists()).toBe(true)
      await press('Escape', document.activeElement!)
      expect(w.find('.lq-story-drawer').exists()).toBe(false)
      expect(document.activeElement).toBe(box())
    })

    it('gives the cursor back to the box when the Map closes', async () => {
      w.get<HTMLElement>('[data-button="map"]').element.focus()
      await click('map')
      expect(w.find('.lq-map-pop').exists()).toBe(true)
      await press('Escape')
      expect(w.find('.lq-map-pop').exists()).toBe(false)
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
