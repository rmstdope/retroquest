// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { useGameStore, type Turn } from '@/stores/useGameStore'

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

function stubScreen(wide: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: wide,
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
    stubScreen(true)
  })
  afterEach(() => {
    w?.unmount()
    vi.unstubAllGlobals()
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
    document.querySelector('.lq-paper-hide')
  const tab = (): HTMLElement | null => document.querySelector('.lq-paper-tab')
  const press = (key: string, target: EventTarget = document.body): void => {
    target.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
    )
  }

  it('holds only the current turn', async () => {
    await mountWith([turn(1, 'First.', 'look'), turn(2, 'Second.', 'wait')])
    const turns = [...paper().querySelectorAll('[data-testid="turn"]')]
    expect(turns).toHaveLength(1)
    expect(turns[0]?.textContent).toContain('Second.')
    expect(turns[0]?.textContent).toContain('› wait')
  })

  it('shows no paper and no tab for a turn with nothing to tell', async () => {
    await mountWith([turn(1, 'First.'), turn(2, '')])
    expect(paper().style.display).toBe('none')
    expect(tab()).toBeNull()
  })

  it('hides to a tab with Hide and brings the paper back with the tab, moving focus between them', async () => {
    await mountWith([turn(1, 'First.')])
    expect(hideButton()?.textContent?.trim()).toBe('▾ Hide')
    expect(hideButton()?.getAttribute('title')).toBe('Hide the narration (N)')
    expect(tab()).toBeNull()

    await settle()
    hideButton()?.click()
    await nextTick()
    await nextTick()
    expect(tab()?.textContent?.trim()).toBe('▴ Narration')
    expect(tab()?.getAttribute('title')).toBe('Show the narration (N)')
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

  it('opens again on a new turn with something to tell, and stays clear for one without', async () => {
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
    game.turns.push(turn(3, ''))
    await nextTick()
    expect(tab()).toBeNull()
    expect(paper().style.display).toBe('none')
  })

  it('moves focus to the tab when N hides the paper while focus is inside it', async () => {
    await mountWith([turn(1, 'First.')])
    hideButton()?.focus()
    press('n', hideButton() as HTMLElement)
    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(tab())
  })

  it('sizes the paper to its content, up to half the play area', async () => {
    const heights: Record<string, number> = {
      'lq-paper-content': 200,
      'lq-story-wrap': 260,
    }
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(
      function (this: HTMLElement) {
        const name = Object.keys(heights).find((c) =>
          this.classList.contains(c),
        )
        return name ? (heights[name] ?? 0) : 0
      },
    )
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(
      function (this: HTMLElement) {
        if (this.classList.contains('lq-main')) return 1000
        if (this.classList.contains('lq-story')) return 240
        return 0
      },
    )
    await mountWith([turn(1, 'First.')])
    // chrome = wrap 260 - story 240 (+ no padding in jsdom) = 20
    expect(paper().style.height).toBe('220px')

    heights['lq-paper-content'] = 900
    game.turns.push(turn(2, 'Long.'))
    await nextTick()
    const { useSettingsStore } = await import('@/stores/useSettingsStore')
    useSettingsStore().textSize = 'large'
    await nextTick()
    await nextTick()
    expect(paper().style.height).toBe('500px')
    vi.restoreAllMocks()
  })

  it('lets the tab row push the actions down when there is no paper', async () => {
    await mountWith([turn(1, '')])
    expect(
      document
        .querySelector('.lq-paper-tabrow')
        ?.classList.contains('lq-paper-none'),
    ).toBe(true)
    game.turns.push(turn(2, 'Something.'))
    await nextTick()
    expect(
      document
        .querySelector('.lq-paper-tabrow')
        ?.classList.contains('lq-paper-none'),
    ).toBe(false)
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
    expect(await helpText()).toContain('N — hide or show the narration')
    w?.unmount()
    document.body.innerHTML = ''
    stubScreen(false)
    expect(await helpText()).not.toContain('hide or show the narration')
  })

  it('keeps every turn in the story, with no Hide, on a phone', async () => {
    stubScreen(false)
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
