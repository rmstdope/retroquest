// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import LanternLayout from './LanternLayout.vue'
import { startedHoldStore } from '@/testing/holdGame'
import { useGameStore, type Turn } from '@/stores/useGameStore'
import { useStageSpeechStore } from '@/stores/useStageSpeechStore'
import { useNarrationStore } from '@/stores/useNarrationStore'

/**
 * Which screen the test pretends to be: `upright` is a tablet (or a narrow mouse
 * window), which keeps the tall stage; `turn` a phone held upright; `sideways` a
 * phone on its side.
 */
function screen(kind: 'upright' | 'turn' | 'sideways'): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches:
        kind !== 'upright' &&
        (query.includes('hover: none') ||
          (kind === 'turn' && query.includes('orientation: portrait'))),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

/** The stage on a phone (under 1024 wide, not short), over the real engine. */
describe('LanternLayout: the stage on a phone', () => {
  let w: VueWrapper

  async function mountOn(kind: 'upright' | 'turn' | 'sideways'): Promise<void> {
    setActivePinia(createPinia())
    screen(kind)
    await startedHoldStore()
    useGameStore().showTitle = false
    w = mount(LanternLayout, { attachTo: document.body })
    await w.vm.$nextTick()
  }
  afterEach(() => {
    w.unmount()
    vi.unstubAllGlobals()
  })

  describe('upright', () => {
    beforeEach(() => mountOn('upright'))

    it('plays the room on its picture, with the plate and a folded bar', () => {
      expect(w.find('.lq-stage-picture').exists()).toBe(true)
      expect(w.get('.lq-plate h2').text()).toContain(useGameStore().roomName)
      expect(w.get('.lq-plate').text()).not.toContain('You are in')
      expect(w.find('.lq-dock, .lq-composer, .lq-sheet').exists()).toBe(false)
    })

    it('keeps the five section tabs and no buttons on the picture, but the round ☰ in the corner', () => {
      expect(w.findAll('.lq-nav-bottom .lq-nav-btn')).toHaveLength(5)
      expect(w.find('.lq-buttons').exists()).toBe(false)
      expect(w.get('.lq-float-menu').attributes('aria-label')).toBe('Menu')
      expect(w.get('.lq-float-feedback').attributes('aria-label')).toBe(
        'Send feedback',
      )
    })

    it('leaves the room name to the plate', () => {
      expect(w.find('.lq-compact-room').exists()).toBe(false)
    })

    it('opens the story so far over the stage and closes it with ✕', async () => {
      await w.get('.lq-story-so-far').trigger('click')
      expect(w.find('.lq-story-drawer').exists()).toBe(true)
      expect(w.get('.lq-story-drawer').classes()).toContain('lq-phone-drawer')
      await w.get('.lq-story-drawer .lq-drawer-close').trigger('click')
      expect(w.find('.lq-story-drawer').exists()).toBe(false)
    })

    it('closes the story so far with the Story tab, and when another tab is visited', async () => {
      await w.get('.lq-story-so-far').trigger('click')
      await w.findAll('.lq-nav-bottom .lq-nav-btn')[0]!.trigger('click')
      expect(w.find('.lq-story-drawer').exists()).toBe(false)
      await w.get('.lq-story-so-far').trigger('click')
      await w.findAll('.lq-nav-bottom .lq-nav-btn')[1]!.trigger('click')
      await w.findAll('.lq-nav-bottom .lq-nav-btn')[0]!.trigger('click')
      expect(w.find('.lq-story-drawer').exists()).toBe(false)
    })

    it('moves focus into the story so far and back to its button on ✕', async () => {
      await w.get('.lq-story-so-far').trigger('click')
      await flushPromises()
      expect(
        w.get('.lq-story-drawer').element.contains(document.activeElement),
      ).toBe(true)
      await w.get('.lq-story-drawer .lq-drawer-close').trigger('click')
      await flushPromises()
      expect(document.activeElement).toBe(w.get('.lq-story-so-far').element)
    })

    it('puts the story so far away when a quest is opened in the journal', async () => {
      await w.get('.lq-story-so-far').trigger('click')
      useGameStore().questToOpen = 'First'
      await flushPromises()
      expect(w.find('.lq-story-drawer').exists()).toBe(false)
    })

    it('has the room name and "⟲ Journal" on the plate (Hint is in the room menu): no one and nothing is listed', () => {
      const buttons = w.get('.lq-plate').findAll('button')
      expect(buttons.map((b) => b.text())).toEqual([
        expect.stringContaining(useGameStore().roomName),
        '⟲ Journal',
      ])
    })

    it('keeps the stage as it was left when another tab is visited', async () => {
      await w.findAll('.lq-nav-bottom .lq-nav-btn')[1]!.trigger('click')
      expect(w.get('.lq-stage').isVisible()).toBe(false)
      await w.findAll('.lq-nav-bottom .lq-nav-btn')[0]!.trigger('click')
      expect(w.get('.lq-stage').isVisible()).toBe(true)
    })
  })

  describe('a phone held upright', () => {
    beforeEach(() => mountOn('turn'))

    it('shows the turn page and nothing of the game can be reached behind it', () => {
      expect(w.find('.lq-turn-page').exists()).toBe(true)
      expect(w.get('.lq-game').attributes('inert')).toBeDefined()
    })

    it('has no tablet layout: a tablet held upright gets no turn page', async () => {
      w.unmount()
      await mountOn('upright')
      expect(w.find('.lq-turn-page').exists()).toBe(false)
      expect(w.get('.lq-game').attributes('inert')).toBeUndefined()
    })
  })

  describe('a phone on its side', () => {
    beforeEach(() => mountOn('sideways'))

    it('fills the screen with the picture, with no header, tabs or room box', () => {
      expect(w.find('.lq-turn-page').exists()).toBe(false)
      expect(w.find('.lq-stage-picture').exists()).toBe(true)
      expect(w.find('.lq-header').exists()).toBe(false)
      expect(w.find('.lq-nav-bottom').exists()).toBe(false)
      expect(w.find('.lq-phone-plate').exists()).toBe(false)
    })

    it('has one plate top left, and ✎ and ☰ alone top right', () => {
      expect(w.find('.lq-float-menu').exists()).toBe(false)
      expect(w.get('.lq-stage-plate').classes()).toContain('lq-plate-compact')
      const labels = w
        .findAll('.lq-stage-buttons .lq-stage-btn')
        .map((b) => b.text().replace(/\s+/g, ' '))
      expect(labels).toEqual(['✎', '☰'])
    })

    it('has no action bar and no typing box: a phone plays by pointing only', async () => {
      expect(w.find('.lq-dock, .lq-composer, .lq-sheet').exists()).toBe(false)
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F1' }))
      await flushPromises()
      expect(w.find('.lq-type-input').exists()).toBe(false)
    })

    it('opens Look, Search, Rest and Hint in a row under the name', async () => {
      await w.get('.lq-stage-plate .lq-name-btn').trigger('click')
      expect(
        w.findAll('.lq-stage-plate .lq-pill').map((b) => b.text()),
      ).toEqual(['👁 Look', '🔍 Search', '💤 Rest', '💡 Hint'])
    })

    it('opens the same centred menu from ☰', async () => {
      vi.spyOn(useGameStore(), 'getQuickSave').mockReturnValue(null)
      await w.get('.lq-stage-buttons [data-button="menu"]').trigger('click')
      await flushPromises()
      expect(document.body.querySelector('.lq-dialog-centered')).not.toBeNull()
      expect(document.body.querySelector('.lq-side-list')).toBeNull()
    })
  })

  it('keeps the game as it was when a phone is turned upright and back', async () => {
    setActivePinia(createPinia())
    const state = { portrait: false }
    const listeners: ((event: { matches: boolean }) => void)[] = []
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        get matches() {
          return (
            query.includes('hover: none') ||
            (state.portrait && query.includes('orientation: portrait'))
          )
        },
        addEventListener: vi.fn((_type: string, listener: never) => {
          if (query.includes('orientation')) listeners.push(listener)
        }),
        removeEventListener: vi.fn(),
      })),
    )
    await startedHoldStore()
    useGameStore().showTitle = false
    w = mount(LanternLayout, { attachTo: document.body })
    await flushPromises()
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'j',
        bubbles: true,
        cancelable: true,
      }),
    )
    await flushPromises()
    expect(w.find('.lq-story-drawer').exists()).toBe(true)

    state.portrait = true
    listeners.forEach((change) => change({ matches: true }))
    await flushPromises()
    expect(w.find('.lq-turn-page').exists()).toBe(true)
    expect(w.find('.lq-story-drawer').exists()).toBe(true)

    state.portrait = false
    listeners.forEach((change) => change({ matches: false }))
    await flushPromises()
    expect(w.find('.lq-turn-page').exists()).toBe(false)
    expect(w.find('.lq-dock, .lq-sheet').exists()).toBe(false)
    expect(w.find('.lq-story-drawer').exists()).toBe(true)
    expect(w.find('.lq-header').exists()).toBe(false)
    expect(w.find('.lq-stage-picture').exists()).toBe(true)
  })
})

/** The one column on a narrow stage, laid out by hand (jsdom has no layout). */
describe('LanternLayout: a new line said in the one column', () => {
  let w: VueWrapper
  /** The story pane's height, and where the newest line starts in its content. */
  const PANE = 300
  const LINE_TOP = 250
  /** Room the content gains after the line is shown (a name stepping down above it). */
  let grown = 0
  /** The layout's resize observers, called by hand. */
  let resized: (() => void)[] = []
  /** Whether a story turn is being read aloud. */
  const reading = ref(false)

  beforeEach(async () => {
    setActivePinia(createPinia())
    screen('upright')
    grown = 0
    resized = []
    reading.value = false
    Object.defineProperty(useNarrationStore(), 'storyReading', {
      configurable: true,
      get: () => reading.value,
    })
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resized.push(callback)
        }
        observe(): void {}
        disconnect(): void {}
      },
    )
    await startedHoldStore()
    w = mount(LanternLayout, { attachTo: document.body })
    await w.vm.$nextTick()
  })
  afterEach(() => {
    w.unmount()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const pane = (): HTMLElement =>
    document.querySelector('section[aria-label="Story"]') as HTMLElement

  /** Lay the pane out, `PANE` tall, with the newest spoken line at `LINE_TOP` in its content, `height` tall. */
  function layOut(height: number, below = 0): void {
    const el = pane()
    let top = 0
    Object.defineProperty(el, 'clientHeight', {
      configurable: true,
      value: PANE,
    })
    Object.defineProperty(el, 'scrollHeight', {
      configurable: true,
      get: () => LINE_TOP + height + below + grown,
    })
    Object.defineProperty(el, 'scrollTop', {
      configurable: true,
      get: () => top,
      set: (value: number) => {
        top = value
      },
    })
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: Element): DOMRect {
        if (this === el) return { top: 0, bottom: PANE } as DOMRect
        // Only the newest line is laid out: the one to bring into view.
        const said = useStageSpeechStore().visible.at(-1)
        if (
          said &&
          this.matches(`[data-key="line-${said.unit}-${said.firstWord}"]`)
        )
          return {
            top: LINE_TOP - top,
            bottom: LINE_TOP + height - top,
          } as DOMRect
        return { top: 0, bottom: 0, height: 0 } as DOMRect
      },
    )
  }

  /** Grandmother says a line `height` tall in a new turn, shown at once unless `reveal` is false. */
  async function sayLine(
    height: number,
    reveal = true,
    below = 0,
  ): Promise<void> {
    const game = useGameStore()
    const said: Turn = {
      id: 9_999,
      command: 'talk to grandmother',
      text: '[character_name]Grandmother[/character_name]\n[dialogue]There you are.\n\nSit down.[/dialogue]',
      room: game.roomName,
      description: null,
      gained: [],
      lost: [],
      arrival: null,
      addressed: 'Grandmother',
    }
    layOut(height, below)
    game.turns = [...game.turns, said]
    await flushPromises()
    if (reveal) useStageSpeechStore().revealAll()
    await flushPromises()
  }

  it('pushes the story up so the whole line shows', async () => {
    expect(w.find('.lq-one-column').exists()).toBe(true)
    await sayLine(200)
    expect(w.findAll('[data-testid="speech-line"]').length).toBeGreaterThan(0)
    expect(pane().scrollTop).toBe(LINE_TOP + 200 - PANE)
  })

  it('shows the room kept below the newest line too, so the column rests at its foot', async () => {
    await sayLine(200, true, 20)
    expect(pane().scrollTop).toBe(LINE_TOP + 200 + 20 - PANE)
  })

  it('keeps the column at its foot when the content above the newest line grows', async () => {
    await sayLine(200)
    grown = 20
    for (const callback of resized) callback()
    await flushPromises()
    expect(pane().scrollTop).toBe(LINE_TOP + 200 + 20 - PANE)
  })

  it('keeps the column at its foot as soon as a line leaves sight, before the next frame', async () => {
    await sayLine(200)
    grown = 20
    // The line's fade runs out: it leaves sight, which the layout hears from the fade's ledger.
    const row = document.querySelector<HTMLElement>(
      '[data-testid="speech-line"]',
    )!
    row.dataset.fade = 'away'
    const ended = new Event('animationend', { bubbles: true })
    Object.defineProperty(ended, 'animationName', { value: 'lq-fade-away' })
    row.dispatchEvent(ended)
    await flushPromises()
    expect(pane().scrollTop).toBe(LINE_TOP + 200 + 20 - PANE)
  })

  it('keeps the column at its foot while a turn is read aloud too', async () => {
    await sayLine(200)
    reading.value = true
    await flushPromises()
    grown = 20
    for (const callback of resized) callback()
    await flushPromises()
    expect(pane().scrollTop).toBe(LINE_TOP + 200 + 20 - PANE)
  })

  it("keeps the newest line's top in view when the column grows past it", async () => {
    await sayLine(250)
    // The newest line, 250 tall, ends at the foot; 100 more below it would push its top out.
    grown = 100
    for (const callback of resized) callback()
    await flushPromises()
    expect(pane().scrollTop).toBe(LINE_TOP)
  })

  it('leaves the column alone while another section is open', async () => {
    await sayLine(200)
    await w.findAll('.lq-nav-bottom .lq-nav-btn')[1]!.trigger('click')
    await flushPromises()
    grown = 20
    for (const callback of resized) callback()
    await flushPromises()
    expect(pane().scrollTop).toBe(LINE_TOP + 200 - PANE)
  })

  it('leaves a player who scrolled back where they are when the content grows', async () => {
    await sayLine(200)
    pane().scrollTop = 0
    pane().dispatchEvent(new Event('scroll'))
    grown = 20
    for (const callback of resized) callback()
    await flushPromises()
    expect(pane().scrollTop).toBe(0)
  })

  it('stops a line taller than the pane at its top, so it is read from its start', async () => {
    await sayLine(500)
    expect(pane().scrollTop).toBe(LINE_TOP)
  })

  it('brings a line said while another section was open into view when the story is shown again', async () => {
    await sayLine(200, false)
    pane().scrollTop = 0
    await w.findAll('.lq-nav-bottom .lq-nav-btn')[1]!.trigger('click')
    useStageSpeechStore().revealAll()
    await flushPromises()
    expect(pane().scrollTop).toBe(0)
    await w.findAll('.lq-nav-bottom .lq-nav-btn')[0]!.trigger('click')
    await flushPromises()
    expect(pane().scrollTop).toBe(LINE_TOP + 200 - PANE)
  })

  it('keeps the place of a player who scrolled back to read, when the story is shown again', async () => {
    await sayLine(200)
    pane().scrollTop = 0
    await w.findAll('.lq-nav-bottom .lq-nav-btn')[1]!.trigger('click')
    await flushPromises()
    await w.findAll('.lq-nav-bottom .lq-nav-btn')[0]!.trigger('click')
    await flushPromises()
    expect(pane().scrollTop).toBe(0)
  })

  it('leaves the story where it is when the conversation is cleared', async () => {
    await sayLine(200)
    pane().scrollTop = 0
    useStageSpeechStore().clear()
    await flushPromises()
    expect(pane().scrollTop).toBe(0)
  })
})
