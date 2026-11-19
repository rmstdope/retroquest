// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { useGameStore, type Turn } from '@/stores/useGameStore'
import { useStageSpeechStore } from '@/stores/useStageSpeechStore'
import { useNarrationStore } from '@/stores/useNarrationStore'
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
      matches: wide === 'short' ? query.includes('519px') : wide,
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

  it('holds a bubble for each paragraph since the last room change, each to fade once read, with no command', async () => {
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
    // Not read aloud: each waits the time to read it and the card's bubbles before it.
    expect(bubbles().map((b) => b.getAttribute('data-read-ms'))).toEqual([
      '900',
      '900',
      '900',
      '1800',
    ])
    expect(bubbles().map((b) => b.getAttribute('data-fade'))).toEqual([
      'live',
      'live',
      'live',
      'live',
    ])
    expect(paper().querySelector('[data-testid="command"]')).toBeNull()
  })

  it('lets each bubble fade once read, and drops the Hide when every line has gone', async () => {
    await mountWith([turn(1, 'First.\n\nSecond.', 'look')])
    await settle()
    expect(hideButton()).not.toBeNull()
    // Not read aloud: the first fades after its time to read, the second after both.
    await new Promise((r) => setTimeout(r, 950))
    expect(bubbles().map((b) => b.getAttribute('data-fade'))).toEqual([
      'away',
      'live',
    ])
    const fadeEnds = (el: Element): void => {
      const event = new Event('animationend', { bubbles: true })
      Object.defineProperty(event, 'animationName', { value: 'lq-fade-away' })
      el.dispatchEvent(event)
    }
    fadeEnds(bubbles()[0]!)
    await nextTick()
    expect(bubbles()[0]?.getAttribute('data-fade')).toBe('gone')
    expect(hideButton()).not.toBeNull()
    await new Promise((r) => setTimeout(r, 900))
    fadeEnds(bubbles()[1]!)
    await nextTick()
    expect(hideButton()).toBeNull()
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

  it('holds the words while they are hidden, so Show brings them back to fade anew', async () => {
    await mountWith([turn(1, 'First.')])
    await settle()
    hideButton()?.click()
    await nextTick()
    // Longer than the time to read it: shown, it would have started to fade.
    await new Promise((r) => setTimeout(r, 950))
    expect(bubbles()[0]?.getAttribute('data-fade')).toBe('live')
    // No fade runs out while they are hidden.
    const event = new Event('animationend', { bubbles: true })
    Object.defineProperty(event, 'animationName', { value: 'lq-fade-away' })
    bubbles()[0]!.dispatchEvent(event)
    await nextTick()
    expect(tab()?.textContent?.trim()).toBe('▴ Show')

    tab()?.click()
    await nextTick()
    await nextTick()
    expect(bubbles()[0]?.getAttribute('data-fade')).toBe('live')
    expect(hideButton()).not.toBeNull()
    // Shown again, it waits its time to read once more, then fades.
    await new Promise((r) => setTimeout(r, 950))
    expect(bubbles()[0]?.getAttribute('data-fade')).toBe('away')
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

  describe('a game a load brought back', () => {
    afterEach(() => vi.useRealTimers())

    /** The story as a load restores it: every turn marked `restored`, numbered afresh. */
    const restore = (turns: Turn[]): Turn[] =>
      turns.map((entry, index) => ({
        ...entry,
        id: 100 + index,
        restored: true,
      }))
    const speechLines = (): Element[] => [
      ...document.querySelectorAll('[data-testid="speech-line"]'),
    ]

    it('shows none of the lines of the saved story on the stage, neither at once nor over time', async () => {
      vi.useFakeTimers()
      await mountWith([turn(1, 'The square is busy.')])
      const several = {
        ...turn(
          2,
          `${say('Mira', 'Hello.')}\n${say('Mira', 'Welcome back.')}\n` +
            say('Mira', 'Mind the well.'),
          'talk to mira',
        ),
        addressed: 'Mira',
      }
      game.turns = restore([turn(1, 'The square is busy.'), several])
      await nextTick()
      await nextTick()
      expect(speechLines()).toHaveLength(0)
      expect(bubbles()).toHaveLength(0)
      await vi.advanceTimersByTimeAsync(20000)
      expect(speechLines()).toHaveLength(0)
      expect(bubbles()).toHaveLength(0)
    })

    it('tells the next command after the load as usual', async () => {
      await mountWith([turn(1, 'First.')])
      game.turns = restore([turn(1, 'First.'), talk(2, 'Hello.')])
      await nextTick()
      game.turns.push(talk(200, 'Again.'))
      await nextTick()
      await nextTick()
      expect(speechLines().map((line) => line.textContent)).toEqual([
        expect.stringContaining('Again.'),
      ])
    })
  })

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

    it('lights the dots a flight held back once every gain has landed, not before (rq-xxd8)', async () => {
      await mountWith([turn(1, 'First.')])
      const flights = useFlightStore()
      const light = vi.spyOn(game, 'showLandedDots')
      game.turns.push(taking(2))
      await nextTick()
      expect(flights.owes('item')).toBe(true)
      expect(light).not.toHaveBeenCalled()
      flights.clear()
      await nextTick()
      expect(light).toHaveBeenCalledTimes(1)
    })

    it('lights the dots at once for a gain that does not fly (rq-xxd8)', async () => {
      await mountWith([turn(1, 'First.')])
      const light = vi.spyOn(game, 'showLandedDots')
      game.turns.push({ ...taking(2), restored: true })
      await nextTick()
      await nextTick()
      expect(light).toHaveBeenCalled()
    })

    it('flies a lost item out of the Bag first, and leaves it off the card', async () => {
      await mountWith([turn(1, 'First.')])
      const flights = useFlightStore()
      game.turns.push({
        ...taking(2),
        lost: [{ kind: 'item', name: 'rope', count: 1 }],
      })
      await nextTick()
      expect(flights.current?.name).toBe('rope')
      expect(flights.current?.leaving).toBe(true)
      expect(paper().querySelector('[data-testid="chip"]')).toBeNull()
    })

    it('does not move a lost item under Reduce motion', async () => {
      document.documentElement.style.setProperty('--lq-motion', '0')
      await mountWith([turn(1, 'First.')])
      game.turns.push({
        ...turn(2, 'You drop it.', 'drop rope'),
        lost: [{ kind: 'item', name: 'rope', count: 1 }],
      })
      await nextTick()
      document.documentElement.style.removeProperty('--lq-motion')
      expect(useFlightStore().phase).toBe('rest')
      expect(useFlightStore().dipped).toBeNull()
    })

    it('does not fly for a turn a load brought back', async () => {
      await mountWith([turn(1, 'First.')])
      const flights = useFlightStore()
      game.turns.push({ ...taking(2), restored: true })
      await nextTick()
      await nextTick()
      expect(flights.current).toBeNull()
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

  it('does not hide or show the words on Escape (N does)', async () => {
    await mountTalking()
    press('Escape')
    await nextTick()
    expect(tab()).toBeNull()
    expect(speechZone().hasAttribute('inert')).toBe(false)
  })

  it('steps back from the real command box on Escape without hiding the words', async () => {
    // A laptop with a mouse and keyboard (not a phone), so the typing box can come up.
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: !query.includes('coarse'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    await mountWith([turn(1, 'Only the narrator.')])
    game.acceptInput = true
    await nextTick()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F1' }))
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
    // The open word list closes first (text kept).
    expect(box.getAttribute('aria-expanded')).toBe('true')
    press('Escape', box)
    await nextTick()
    expect(tab()).toBeNull()
    // The next press hides the box, and the words stay.
    expect(document.activeElement).toBe(box)
    press('Escape', box)
    await nextTick()
    await nextTick()
    expect(tab()).toBeNull()
    expect(document.querySelector('input[aria-label="Command"]')).toBeNull()
  })

  it('does not skip the narrator on Escape, and hides nothing', async () => {
    await mountTalking()
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
    expect(narration.isNarrating).toBe(true)
    expect(tab()).toBeNull()
    expect(speechZone().hasAttribute('inert')).toBe(false)
  })

  it('hurries a narrated look one block with a click on the picture', async () => {
    await mountWith([turn(1, 'The square is busy.')])
    game.turns.push(turn(2, 'A fountain.\n\nA bench.', 'look'))
    await nextTick()
    await settle()
    expect(useStageSpeechStore().conversation).toBeNull()
    const narration = useNarrationStore()
    // A voice that plays until it is stopped.
    narration.setAudioFactory(() => ({
      volume: 1,
      currentTime: 0,
      onended: null,
      onerror: null,
      play: () => Promise.resolve(),
      pause: () => {},
    }))
    const voiced = (markup: string) => ({
      kind: 'block' as const,
      parts: [
        {
          markup,
          clip: {
            file: 'x.mp3',
            speaker: 'narrator',
            duration: 5,
            words: [],
          },
        },
      ],
    })
    narration.begin(2, [voiced('A fountain.'), voiced('A bench.')], 'act1')
    expect(narration.speaking(2)?.unit).toBe(0)
    const picture = document.querySelector('.lq-stage-picture') as HTMLElement
    picture.click()
    // The next block is read after the hurried one's short pause.
    await vi.waitFor(() => expect(narration.speaking(2)?.unit).toBe(1))
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
    // Help is behind the menu.
    const menu = document.querySelector<HTMLElement>(
      'button[aria-label="Menu"]',
    )
    menu?.click()
    await nextTick()
    const help = [...document.querySelectorAll<HTMLElement>('button')].find(
      (b) => b.textContent?.trim() === 'Help',
    )
    help?.click()
    await nextTick()
    await settle()
    const text = document.querySelector('[role="dialog"]')?.textContent ?? ''
    expect(text).toContain('Commands')
    return text
  }

  it('has the Help line for N on a laptop, and not on a phone', async () => {
    const laptopHelp = await helpText()
    expect(laptopHelp).toContain("Esc — close what's open, or open the menu")
    expect(laptopHelp).toContain('N — hide or show the words')
    expect(laptopHelp).not.toContain("show or hide what's here")
    w?.unmount()
    document.body.innerHTML = ''
    stubScreen(false)
    const phoneHelp = await helpText()
    expect(phoneHelp).not.toContain('hide or show the')
    expect(phoneHelp).not.toContain("show or hide what's here")
  })

  it('has the Help lines for the room name, and for F1 where a keyboard can type', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: !query.includes('coarse'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    const keyboardHelp = await helpText()
    expect(keyboardHelp).toContain(
      "Press the room's name for Look, Search and Rest.",
    )
    expect(keyboardHelp).toContain(
      'Press F1 to type commands instead; F1 again hides the box.',
    )
    w?.unmount()
    document.body.innerHTML = ''
    // A phone: touch, no hover, small.
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: !query.includes('hover: hover'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    const phoneHelp = await helpText()
    expect(phoneHelp).toContain(
      "Press the room's name for Look, Search and Rest.",
    )
    expect(phoneHelp).not.toContain('F1')
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
