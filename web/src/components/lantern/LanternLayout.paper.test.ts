// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { useGameStore, type Turn } from '@/stores/useGameStore'
import { useStageSpeechStore } from '@/stores/useStageSpeechStore'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useFlightStore } from '@/stores/useFlightStore'
import { useArrivalStore } from '@/stores/useArrivalStore'
import { useSceneStore } from '@/stores/useSceneStore'

/** A turn that tells `text` (nothing when empty). */
function turn(id: number, text: string, command: string | null = 'look'): Turn {
  return {
    id,
    command,
    text,
    room: 'Square',
    description: null,
    gained: [],
    lost: [],
    arrival: null,
  }
}

function stubScreen(wide: boolean | 'short'): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: wide === 'short' ? query.includes('max-height') : wide,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

describe('the narration paper', () => {
  let w: VueWrapper | undefined
  let game: ReturnType<typeof useGameStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    game = useGameStore()
    // The game menu reads the quick save; these tests run with no game.
    vi.spyOn(game, 'getQuickSave').mockReturnValue(null)
    stubScreen(true)
  })
  afterEach(() => {
    w?.unmount()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  async function mountWith(turns: Turn[]): Promise<VueWrapper> {
    game.turns = turns
    w = mount(LanternLayout, { attachTo: document.body })
    await nextTick()
    return w
  }
  /**
   * Vue ignores a click that is stamped before its listener was attached, which
   * jsdom can do for an element that has only just rendered: let a moment pass.
   */
  const settle = (): Promise<void> => new Promise((r) => setTimeout(r, 15))
  const paper = (): HTMLElement =>
    document.querySelector('.lq-story-wrap') as HTMLElement
  const hideButton = (): HTMLElement | null =>
    document.querySelector('.lq-words-hide')
  const speechZone = (): HTMLElement =>
    document.querySelector('[data-testid="speech-zone"]') as HTMLElement
  const tab = (): HTMLElement | null => document.querySelector('.lq-paper-tab')
  const press = (key: string, target: EventTarget = document.body): void => {
    target.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
    )
  }

  /** The narrator's bubbles on the paper, in order. */
  const bubbles = (): Element[] => [...paper().querySelectorAll('.lq-bubble')]

  it('holds a bubble for each paragraph since the last room change, the newest lit and older ones dimmed, with no command', async () => {
    await mountWith([
      turn(1, 'First.', 'look'),
      turn(2, 'Second.', 'wait'),
      turn(3, 'Third.\n\nFourth.', 'listen'),
    ])
    await nextTick()
    expect(bubbles().map((b) => b.textContent)).toEqual([
      'First.',
      'Second.',
      'Third.',
      'Fourth.',
    ])
    expect(bubbles().map((b) => b.getAttribute('data-age'))).toEqual([
      'old',
      'old',
      'prev',
      'new',
    ])
    expect(paper().querySelector('[data-testid="command"]')).toBeNull()
  })

  it('clears the cards when the player walks into another room', async () => {
    await mountWith([turn(1, 'First.', 'look'), turn(2, 'Second.', 'wait')])
    game.turns.push({
      ...turn(3, '', 'go north'),
      description: { moved: true, firstVisit: false },
    })
    await nextTick()
    // The walk itself tells nothing on the paper (its command is not echoed).
    expect(paper().querySelectorAll('[data-testid="turn"]')).toHaveLength(0)
  })

  it('tells the room on one card after a load, with no command line', async () => {
    await mountWith([
      {
        ...turn(1, '', null),
        arrival: {
          room: 'Square',
          description: 'A busy square.',
          characters: [],
          items: [],
          exits: {},
        },
        description: { moved: true, firstVisit: false },
      },
    ])
    const cards = [...paper().querySelectorAll('[data-testid="turn"]')]
    expect(cards).toHaveLength(1)
    expect(cards[0]?.textContent).toContain('A busy square.')
    expect(paper().querySelector('[data-testid="command"]')).toBeNull()
  })

  it('shows silent information as a red-edged bubble under the earlier one', async () => {
    await mountWith([
      turn(1, 'She does not sit down.', 'talk to grandmother'),
      turn(
        2,
        "[failure]There is no character named 'mira'.[/failure]",
        'talk to mira',
      ),
    ])
    await nextTick()
    expect(bubbles()[1]?.classList.contains('lq-bubble-failure')).toBe(true)
    expect(bubbles()[1]?.textContent).toContain('⊝')
    expect(bubbles()[0]?.getAttribute('data-age')).toBe('prev')
  })

  it('is a column up the left, with no inline band height', async () => {
    await mountWith([turn(1, 'First.')])
    expect(paper().classList.contains('lq-cards')).toBe(true)
    expect(paper().style.height).toBe('')
    expect(paper().style.top).not.toBe('')
  })

  it('shows no paper and no tab when there is no card', async () => {
    await mountWith([turn(1, '', null)])
    expect(paper().style.display).toBe('none')
    expect(tab()).toBeNull()
  })

  it('hides to a tab with Hide and brings the paper back with the tab, moving focus between them', async () => {
    await mountWith([turn(1, 'First.')])
    expect(hideButton()?.textContent?.trim()).toBe('▾ Hide')
    expect(hideButton()?.getAttribute('title')).toBe('Hide the words (N)')
    // One Hide, outside the cards and not above them.
    expect(paper().contains(hideButton())).toBe(false)

    expect(tab()).toBeNull()

    await settle()
    hideButton()?.click()
    await nextTick()
    await nextTick()
    expect(tab()?.textContent?.trim()).toBe('▴ Show')
    expect(tab()?.getAttribute('title')).toBe('Show the words (N)')
    expect(hideButton()).toBeNull()
    expect(paper().hasAttribute('inert')).toBe(true)
    expect(document.activeElement).toBe(tab())

    await settle()
    tab()?.click()
    await nextTick()
    await nextTick()
    expect(tab()).toBeNull()
    expect(paper().hasAttribute('inert')).toBe(false)
    expect(document.activeElement).toBe(hideButton())
  })

  it('toggles with N, but not in the command box, and moves no focus', async () => {
    await mountWith([turn(1, 'First.')])
    press('n')
    await nextTick()
    expect(tab()).not.toBeNull()
    expect(document.activeElement).toBe(document.body)
    press('N')
    await nextTick()
    expect(tab()).toBeNull()

    const box = document.createElement('input')
    document.body.appendChild(box)
    box.focus()
    press('n', box)
    await nextTick()
    expect(tab()).toBeNull()
    box.remove()
  })

  it('opens again on a new turn with a card, and stays as it is for one without', async () => {
    await mountWith([turn(1, 'First.')])
    await settle()
    hideButton()?.click()
    await nextTick()
    game.turns.push(turn(2, 'Second.'))
    await nextTick()
    expect(tab()).toBeNull()
    expect(paper().hasAttribute('inert')).toBe(false)

    await settle()
    hideButton()?.click()
    await nextTick()
    game.turns.push(turn(3, '', null))
    await nextTick()
    expect(tab()).not.toBeNull()
  })

  it('moves focus to the tab when N hides the paper while focus is inside it', async () => {
    await mountWith([turn(1, 'First.')])
    hideButton()?.focus()
    press('n', hideButton() as HTMLElement)
    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(tab())
  })

  const say = (name: string, words: string): string =>
    `[character_name]${name}[/character_name]\n[dialogue]${words}[/dialogue]`
  const talk = (id: number, words: string): Turn => ({
    ...turn(id, say('Mira', words), 'talk to mira'),
    addressed: 'Mira',
  })

  /** Mount with a narrator's line on the left and a conversation on the right. */
  async function mountTalking(): Promise<void> {
    await mountWith([turn(1, 'The square is busy.')])
    game.turns.push(talk(2, 'Hello.'))
    await nextTick()
    await settle()
  }

  describe('a gained item or spell', () => {
    const taking = (id: number): Turn => ({
      ...turn(id, 'You take them.', 'take bread'),
      gained: [
        { kind: 'item', name: 'bread', count: 2 },
        { kind: 'spell', name: 'revive', count: 1 },
      ],
    })

    it('flies to its button once the turn lets go of the bag, and not again', async () => {
      await mountWith([turn(1, 'First.')])
      const flights = useFlightStore()
      game.turns.push(taking(2))
      await nextTick()
      expect(flights.current?.name).toBe('bread')
      const first = flights.current?.key
      await nextTick()
      expect(flights.current?.key).toBe(first)
      expect(paper().querySelector('[data-testid="chip"]')).toBeNull()
    })

    it('stops flying when the next command comes', async () => {
      await mountWith([turn(1, 'First.')])
      const flights = useFlightStore()
      game.turns.push(taking(2))
      await nextTick()
      game.turns.push(turn(3, 'Then.'))
      await nextTick()
      expect(flights.current).toBeNull()
    })

    it('is still shown and told under Reduce motion (it only does not move)', async () => {
      document.documentElement.style.setProperty('--lq-motion', '0')
      await mountWith([turn(1, 'First.')])
      game.turns.push(taking(2))
      await nextTick()
      document.documentElement.style.removeProperty('--lq-motion')
      expect(useFlightStore().current?.name).toBe('bread')
    })

    it('waits for a pop-up to close, and for a change of scene to end', async () => {
      await mountWith([turn(1, 'First.')])
      const flights = useFlightStore()
      game.showModal = true
      game.turns.push(taking(2))
      await nextTick()
      expect(flights.current).toBeNull()
      const scene = useSceneStore()
      scene.settled('a.png')
      scene.begin(2, 'b.png', () => {})
      game.showModal = false
      await nextTick()
      expect(flights.current).toBeNull()
      scene.skip()
      await nextTick()
      expect(flights.current?.name).toBe('bread')
    })

    it('waits until the middle of the picture is clear of the news of the turn', async () => {
      await mountWith([turn(1, 'First.')])
      const flights = useFlightStore()
      game.turns.push({
        ...taking(2),
        quests: [{ kind: 'new', name: 'Q', main: false, text: 'Go.' }],
      })
      await nextTick()
      expect(useArrivalStore().turnId).toBe(2)
      expect(flights.current).toBeNull()
      useArrivalStore().clear()
      await nextTick()
      expect(flights.current?.name).toBe('bread')
    })
  })

  it('does not scroll back to an older turn when the newest tells nothing on the left', async () => {
    await mountWith([turn(1, 'Long look one.\n\nLong look two.')])
    const scrolled = vi.fn()
    const before = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = scrolled
    game.turns.push(talk(2, 'Hello.'))
    await nextTick()
    await nextTick()
    Element.prototype.scrollIntoView = before
    expect(scrolled).not.toHaveBeenCalled()
  })

  it('has one Hide whenever either side has something, and none when neither has', async () => {
    await mountWith([turn(1, '', null)])
    expect(hideButton()).toBeNull()
    expect(tab()).toBeNull()
    w?.unmount()
    document.body.innerHTML = ''
    await mountWith([turn(1, 'Only the narrator.')])
    expect(hideButton()).not.toBeNull()
    w?.unmount()
    document.body.innerHTML = ''
    await mountTalking()
    expect(hideButton()).not.toBeNull()
    expect(document.querySelectorAll('.lq-words-hide')).toHaveLength(1)
    expect(document.querySelector('.lq-clear')).toBeNull()
  })

  it('clears the cards and the speech together and brings both back as they were', async () => {
    await mountTalking()
    expect(speechZone().hasAttribute('inert')).toBe(false)
    hideButton()?.click()
    await nextTick()
    await nextTick()
    expect(speechZone().hasAttribute('inert')).toBe(true)
    expect(paper().hasAttribute('inert')).toBe(true)
    expect(tab()?.textContent?.trim()).toBe('▴ Show')
    expect(document.activeElement).toBe(tab())
    // Hiding loses nothing.
    expect(
      speechZone().querySelectorAll('[data-testid="speech-line"]'),
    ).toHaveLength(1)
    await settle()
    tab()?.click()
    await nextTick()
    await nextTick()
    expect(speechZone().hasAttribute('inert')).toBe(false)
    expect(paper().hasAttribute('inert')).toBe(false)
    expect(document.activeElement).toBe(hideButton())
    expect(
      speechZone().querySelectorAll('[data-testid="speech-line"]'),
    ).toHaveLength(1)
  })

  it('brings both sides back with the next answer, new turn added', async () => {
    await mountTalking()
    hideButton()?.click()
    await nextTick()
    game.turns.push(talk(3, 'Again.'))
    await nextTick()
    expect(tab()).toBeNull()
    expect(hideButton()).not.toBeNull()
    expect(speechZone().hasAttribute('inert')).toBe(false)
    expect(
      speechZone().querySelectorAll('[data-testid="speech-line"]'),
    ).toHaveLength(2)
  })

  it('loses the tab when the player walks into another room', async () => {
    await mountTalking()
    hideButton()?.click()
    await nextTick()
    game.turns.push({
      ...turn(4, '', 'go north'),
      description: { moved: true, firstVisit: false },
    })
    await nextTick()
    expect(tab()).toBeNull()
    expect(paper().hasAttribute('inert')).toBe(false)
  })

  it('hides both sides with Escape when nothing is narrated, and leaves focus alone', async () => {
    await mountTalking()
    const box = document.createElement('input')
    document.body.appendChild(box)
    box.focus()
    press('Escape', box)
    await nextTick()
    expect(tab()).not.toBeNull()
    expect(speechZone().hasAttribute('inert')).toBe(true)
    expect(document.activeElement).toBe(box)
    // Already hidden: nothing more happens.
    press('Escape', box)
    await nextTick()
    expect(tab()).not.toBeNull()
    box.remove()
  })

  it('hides narrator cards with Escape from the real command box before stepping back', async () => {
    await mountWith([turn(1, 'Only the narrator.')])
    game.acceptInput = true
    await nextTick()
    document.querySelector<HTMLButtonElement>('[data-type]')?.click()
    await nextTick()
    await nextTick()
    const box = document.querySelector<HTMLInputElement>(
      'input[aria-label="Command"]',
    )
    if (!box) throw new Error('No command box')
    box.focus()
    box.value = 'xyz'
    box.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    // The open word list closes first (text kept); then the words hide.
    expect(box.getAttribute('aria-expanded')).toBe('true')
    press('Escape', box)
    await nextTick()
    expect(tab()).toBeNull()
    press('Escape', box)
    await nextTick()
    await nextTick()
    expect(tab()).not.toBeNull()
    expect(document.activeElement).toBe(box)
    expect(box.value).toBe('xyz')
    // A held key goes no further than the Hide: a repeat takes no step.
    box.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        repeat: true,
        bubbles: true,
        cancelable: true,
      }),
    )
    await nextTick()
    expect(box.value).toBe('xyz')
    // Hidden: the box's own steps, one per press.
    press('Escape', box)
    await nextTick()
    expect(box.value).toBe('')
    expect(document.activeElement).toBe(box)
    press('Escape', box)
    await nextTick()
    await nextTick()
    expect(document.querySelector('input[aria-label="Command"]')).toBeNull()
  })

  it('only skips on Escape while the narrator speaks, hiding nothing', async () => {
    await mountTalking()
    useSettingsStore().narrationOn = true
    const narration = useNarrationStore()
    narration.setAudioFactory(() => ({
      volume: 1,
      currentTime: 0,
      onended: null,
      onerror: null,
      play: () => Promise.resolve(),
      pause: () => {},
    }))
    narration.begin(
      99,
      [
        {
          kind: 'block',
          parts: [
            {
              markup: 'a b',
              clip: {
                file: 'x.mp3',
                speaker: 'narrator',
                duration: 2,
                words: [],
              },
            },
          ],
        },
      ],
      'act1',
    )
    expect(narration.isNarrating).toBe(true)
    press('Escape')
    await nextTick()
    expect(narration.isNarrating).toBe(false)
    expect(tab()).toBeNull()
    expect(speechZone().hasAttribute('inert')).toBe(false)
    // With nothing narrated, the next Escape hides.
    press('Escape')
    await nextTick()
    expect(tab()).not.toBeNull()
  })

  it('hides both sides with N too', async () => {
    await mountTalking()
    press('n')
    await nextTick()
    expect(speechZone().hasAttribute('inert')).toBe(true)
    press('n')
    await nextTick()
    expect(speechZone().hasAttribute('inert')).toBe(false)
  })

  it('moves focus to Hide when N shows the paper while the tab has focus', async () => {
    await mountWith([turn(1, 'First.')])
    press('n')
    await nextTick()
    tab()?.focus()
    press('n', tab() as HTMLElement)
    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(hideButton())
  })

  async function helpText(): Promise<string> {
    vi.spyOn(game, 'readInfo').mockReturnValue('[bold]Commands[/bold]')
    await mountWith([turn(1, 'First.')])
    await settle()
    // The laptop header has Help in its row; the phone's is behind the menu.
    const menu = document.querySelector<HTMLElement>(
      'button[aria-label="Game menu"]',
    )
    menu?.click()
    await nextTick()
    const help = [...document.querySelectorAll<HTMLElement>('button')].find(
      (b) => b.textContent?.trim().startsWith('Help'),
    )
    help?.click()
    await nextTick()
    await settle()
    const text = document.querySelector('[role="dialog"]')?.textContent ?? ''
    expect(text).toContain('Commands')
    return text
  }

  it('has the Help line for N on a laptop, and not on a phone', async () => {
    expect(await helpText()).toContain('N — hide or show the words')
    w?.unmount()
    document.body.innerHTML = ''
    stubScreen(false)
    expect(await helpText()).not.toContain('hide or show the')
  })

  it('tells a phone everything in one column with the one Hide, which N works too', async () => {
    stubScreen(false)
    await mountWith([turn(1, 'First.'), turn(2, 'Second.')])
    expect(
      document.querySelectorAll('.lq-story [data-testid="column-turn"]'),
    ).toHaveLength(2)
    expect(paper().classList.contains('lq-one-column')).toBe(true)
    expect(document.querySelector('.lq-speech-zone')).toBeNull()
    expect(document.querySelector('.lq-paper-corner')).toBeNull()
    expect(hideButton()).not.toBeNull()
    press('n')
    await nextTick()
    expect(tab()?.textContent?.trim()).toBe('▴ Show')
    expect(hideButton()).toBeNull()
  })

  it('tells a laptop window under 1100 px wide in one column too, with the sides above it', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        // A 1060 x 800 laptop with a mouse: wide and keyboard, not short, not 1100 wide.
        matches: !query.includes('1100px') && !query.includes('max-height'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    await mountWith([turn(1, 'First.')])
    expect(paper().classList.contains('lq-one-column')).toBe(true)
    expect(document.querySelector('.lq-speech-zone')).toBeNull()
    w?.unmount()
    stubScreen(true)
    await mountWith([turn(1, 'First.')])
    expect(paper().classList.contains('lq-one-column')).toBe(false)
    expect(document.querySelector('.lq-speech-zone')).not.toBeNull()
  })

  it('keeps what was said in the one column when a phone widens to two sides', async () => {
    const listeners: Record<string, (e: { matches: boolean }) => void> = {}
    let sides = false
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches:
          query.includes('1100px') || query.includes('1024px')
            ? sides
            : !query.includes('max-height'),
        addEventListener: (
          _: string,
          fn: (e: { matches: boolean }) => void,
        ) => {
          listeners[query] = fn
        },
        removeEventListener: vi.fn(),
      })),
    )
    const said = {
      ...turn(
        1,
        '[character_name]Mira[/character_name]\n[dialogue]There you are.[/dialogue]',
        'talk to mira',
      ),
      addressed: 'Mira',
    }
    await mountWith([])
    game.turns = [said]
    await settle()
    await nextTick()
    expect(document.querySelector('.lq-speech-zone')).toBeNull()
    expect(useStageSpeechStore().visible).toHaveLength(1)
    sides = true
    for (const [query, fn] of Object.entries(listeners))
      if (!query.includes('max-height')) fn({ matches: true })
    await settle()
    await nextTick()
    expect(
      document.querySelectorAll('[data-testid="speech-line"]'),
    ).toHaveLength(1)
  })

  it('keeps every turn in the story, with no Hide, on a short screen', async () => {
    stubScreen('short')
    await mountWith([turn(1, 'First.'), turn(2, 'Second.')])
    expect(
      document.querySelectorAll('.lq-story [data-testid="turn"]'),
    ).toHaveLength(2)
    expect(hideButton()).toBeNull()
    press('n')
    await nextTick()
    expect(tab()).toBeNull()
  })
})
