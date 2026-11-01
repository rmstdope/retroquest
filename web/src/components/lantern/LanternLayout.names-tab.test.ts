// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { useGameStore, type Turn } from '@/stores/useGameStore'
import { GEM, startedHoldStore } from '@/testing/holdGame'

/**
 * Names in the story are Tab stops over the real engine: in the wide band only
 * the newest turn's, in the drawer and the narrow Story section every turn's.
 * Only names with a menu now are stops; Enter or Space opens the same menu a
 * click opens.
 */
const gem = `[item_name]${GEM}[/item_name]`
const gone = '[character_name]Old Tom[/character_name]'

/** A system turn (not narrated) with the given markup. */
function turn(id: number, text: string): Turn {
  return {
    id,
    command: null,
    text,
    room: 'Hall',
    description: null,
    gained: [],
    lost: [],
    arrival: null,
  }
}

describe('LanternLayout: names reached with Tab', () => {
  let w: VueWrapper
  let game: ReturnType<typeof useGameStore>

  /** Mount the layout in a wide or a narrow window. */
  async function start(wide: boolean): Promise<void> {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    setActivePinia(createPinia())
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        // Narrow here is the text page (a short screen), where every turn has stops.
        matches: query.includes(wide ? 'min-width' : 'max-height'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    game = await startedHoldStore()
    game.turns.splice(0, game.turns.length)
    game.turns.push(
      turn(901, `Old words about the ${gem}.`),
      turn(
        902,
        `Then ${gem} and ${gem} again, and ${gone}, a [spell_name]Light[/spell_name].`,
      ),
    )
    w = mount(LanternLayout, { attachTo: document.body })
    await w.vm.$nextTick()
    await w.vm.$nextTick()
  }
  afterEach(() => {
    w.unmount()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const stops = (root: string): HTMLElement[] =>
    [
      ...document.querySelectorAll<HTMLElement>(`${root} [tabindex="0"]`),
    ].filter((el) => el.matches('.theme-item_name, .theme-character_name'))

  describe('wide', () => {
    beforeEach(() => start(true))

    it('stops only on the reachable names of the newest turn', () => {
      const found = stops('.lq-story')
      expect(found.map((el) => el.textContent)).toEqual([GEM, GEM])
      for (const el of found) {
        expect(el.getAttribute('role')).toBe('button')
        expect(el.getAttribute('aria-haspopup')).toBe('menu')
      }
      expect(w.get('.lq-story').findAll('.theme-character_name')).toHaveLength(
        1,
      )
      expect(
        w.get('.lq-story').find('.theme-spell_name').attributes('tabindex'),
      ).toBeUndefined()
    })
  })

  describe('wide, keys and the drawer', () => {
    beforeEach(() => start(true))

    const firstStop = (): HTMLElement => stops('.lq-story')[0]!
    const key = async (el: Element, k: string): Promise<void> => {
      el.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: k,
          bubbles: true,
          cancelable: true,
        }),
      )
      await w.vm.$nextTick()
    }

    it('opens the menu with Enter and with Space, focus on its first action', async () => {
      for (const k of ['Enter', ' ']) {
        firstStop().focus()
        await key(firstStop(), k)
        await w.vm.$nextTick()
        expect(document.querySelector('.lq-name-menu')).not.toBeNull()
        expect(document.activeElement?.textContent?.trim()).toBe('Take')
        await key(document.activeElement!, 'Escape')
        expect(document.querySelector('.lq-name-menu')).toBeNull()
        expect(document.activeElement).toBe(firstStop())
      }
    })

    it('opens no menu while the game takes no input', async () => {
      game.acceptInput = false
      firstStop().focus()
      await key(firstStop(), 'Enter')
      expect(document.querySelector('.lq-name-menu')).toBeNull()
    })

    it('gives no stop to a name that is not here', async () => {
      game.turns.push(turn(903, `The ${gone} is back.`))
      await w.vm.$nextTick()
      await w.vm.$nextTick()
      expect(stops('.lq-story')).toHaveLength(0)
    })

    it("drops the old turn's stops when a turn arrives", async () => {
      game.turns.push(turn(903, 'Nothing to name here.'))
      await w.vm.$nextTick()
      await w.vm.$nextTick()
      expect(stops('.lq-story')).toHaveLength(0)
    })

    it('has a stop on every reachable name in the drawer, and Tab from the drawer lands on the newest turn', async () => {
      await w.get('[data-button="story"]').trigger('click')
      await w.vm.$nextTick()
      await w.vm.$nextTick()
      const found = stops('.lq-story-drawer')
      expect(found).toHaveLength(3)
      const body = w.get('.lq-story-drawer-body').element as HTMLElement
      body.focus()
      body.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Tab',
          bubbles: true,
          cancelable: true,
        }),
      )
      expect(document.activeElement).toBe(found[1])
    })
  })

  describe('wide, edge cases', () => {
    beforeEach(() => start(true))

    const tab = (el: Element): void => {
      el.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Tab',
          bubbles: true,
          cancelable: true,
        }),
      )
    }

    it('keeps the reader near the newest turn when it has no stops', async () => {
      game.turns.push(turn(903, 'Nothing to name here.'))
      await w.vm.$nextTick()
      await w.get('[data-button="story"]').trigger('click')
      await w.vm.$nextTick()
      await w.vm.$nextTick()
      const found = stops('.lq-story-drawer')
      const body = w.get('.lq-story-drawer-body').element as HTMLElement
      body.focus()
      tab(body)
      expect(document.activeElement).toBe(found[found.length - 1])
    })

    it('does not keep focus on a name opened with the mouse', async () => {
      const name = stops('.lq-story')[0]!
      name.focus()
      name.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
      await w.vm.$nextTick()
      expect(document.querySelector('.lq-name-menu')).not.toBeNull()
      await w.vm.$nextTick()
      document.querySelector('.lq-name-menu button')!.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        }),
      )
      await w.vm.$nextTick()
      expect(document.querySelector('.lq-name-menu')).toBeNull()
      expect(document.activeElement).not.toBe(name)
    })

    it('puts focus back on the same stop when a re-render replaces it', async () => {
      const name = stops('.lq-story')[1]!
      name.focus()
      const html = name.parentElement!.innerHTML
      name.parentElement!.innerHTML = html
      await Promise.resolve()
      await w.vm.$nextTick()
      const now = stops('.lq-story')
      expect(now).toHaveLength(2)
      expect(document.activeElement).toBe(now[1])
    })
  })

  describe('narrow, following what is here', () => {
    beforeEach(() => start(false))

    it('drops the stops of a thing left behind', async () => {
      expect(stops('.lq-story')).toHaveLength(3)
      game.submitCommand('north')
      await w.vm.$nextTick()
      await w.vm.$nextTick()
      expect(stops('.lq-story')).toHaveLength(0)
    })
  })

  describe('narrow', () => {
    beforeEach(() => start(false))

    it('stops on every turn in the Story section', () => {
      expect(stops('.lq-story')).toHaveLength(3)
    })
  })
})
