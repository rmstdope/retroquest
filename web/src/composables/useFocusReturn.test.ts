// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, reactive, ref } from 'vue'
import { provideFocusReturn, useFocusReturn } from './useFocusReturn'

/** What the made-up game can be told to show. */
interface Up {
  box: boolean
  first: boolean
  second: boolean
  menu: boolean
  card: boolean
  busy: boolean
}

/** The made-up game as a test sees it. */
interface Game {
  box: () => HTMLElement
  opener: () => HTMLElement
  window: (name: string) => HTMLElement
  set: (changes: Partial<Up>) => Promise<void>
}

/** The one rule for where focus goes when something over the game goes away. */
describe('useFocusReturn', () => {
  let w: VueWrapper | undefined
  afterEach(() => {
    w?.unmount()
    w = undefined
  })

  /**
   * A made-up game: a typing box, a button, and things over it that nobody
   * else knows about (two windows and a card), shown by `up`.
   */
  async function game(): Promise<Game> {
    const up = reactive<Up>({
      box: true,
      first: false,
      second: false,
      menu: false,
      card: false,
      busy: false,
    })
    /** A window nobody has heard of: it takes focus, and gives it back to `data-opener`. */
    const Window = {
      props: ['name'],
      setup(props: { name: string }) {
        const opener = document.activeElement as HTMLElement | null
        useFocusReturn({ opener: () => opener })
        return () =>
          h('button', {
            'data-window': props.name,
            onVnodeMounted: (node) => (node.el as HTMLElement).focus(),
          })
      },
    }
    /** A card, which stays mounted and shows while `up.card`. */
    const Card = {
      setup() {
        useFocusReturn({ up: () => up.card })
        return () => null
      },
    }
    /** A passing thing that is over the game while mounted, like a name's menu. */
    const Menu = {
      setup() {
        const opener = document.activeElement as HTMLElement | null
        useFocusReturn({ passing: true, opener: () => opener })
        return () => null
      },
    }
    const Layout = defineComponent({
      setup() {
        const box = ref<HTMLInputElement | null>(null)
        provideFocusReturn({
          typingBox: () => (up.box ? box.value : null),
          busy: () => up.busy,
        })
        return () => [
          h('input', { ref: box }),
          h('button', { 'data-opener': '' }),
          up.first ? h(Window, { name: 'first', key: 'first' }) : null,
          up.second ? h(Window, { name: 'second', key: 'second' }) : null,
          up.menu ? h(Menu) : null,
          h(Card),
        ]
      },
    })
    w = mount(Layout, { attachTo: document.body })
    await flushPromises()
    const find = (selector: string): HTMLElement =>
      document.querySelector<HTMLElement>(selector)!
    return {
      box: () => find('input'),
      opener: () => find('[data-opener]'),
      window: (name: string) => find(`[data-window="${name}"]`),
      async set(changes: Partial<Up>): Promise<void> {
        Object.assign(up, changes)
        await flushPromises()
      },
    }
  }

  const lose = (): void => (document.activeElement as HTMLElement).blur()

  it('gives the typing box the cursor when a window goes, whatever opened it', async () => {
    const g = await game()
    g.opener().focus()
    await g.set({ first: true })
    expect(document.activeElement).toBe(g.window('first'))
    await g.set({ first: false })
    expect(document.activeElement).toBe(g.box())
  })

  it('gives focus back to what opened the window when no typing box is up', async () => {
    const g = await game()
    await g.set({ box: false })
    g.opener().focus()
    await g.set({ first: true })
    await g.set({ first: false })
    expect(document.activeElement).toBe(g.opener())
  })

  it('waits for the last window to go', async () => {
    const g = await game()
    await g.set({ first: true })
    await g.set({ second: true })
    await g.set({ second: false })
    expect(document.activeElement).toBe(g.window('first'))
    await g.set({ first: false })
    expect(document.activeElement).toBe(g.box())
  })

  it('leaves focus in a window that replaces another', async () => {
    const g = await game()
    await g.set({ first: true })
    await g.set({ first: false, second: true })
    expect(document.activeElement).toBe(g.window('second'))
  })

  it('gives the box a lost cursor when a card goes', async () => {
    const g = await game()
    await g.set({ card: true })
    lose()
    await g.set({ card: false })
    expect(document.activeElement).toBe(g.box())
  })

  it('takes focus from nothing when a card goes', async () => {
    const g = await game()
    await g.set({ card: true })
    g.opener().focus()
    await g.set({ card: false })
    expect(document.activeElement).toBe(g.opener())
  })

  it('leaves a passing thing opened from a control back on it', async () => {
    const g = await game()
    g.opener().focus()
    await g.set({ menu: true })
    await g.set({ menu: false })
    expect(document.activeElement).toBe(g.opener())
  })

  it('moves nothing when a card goes behind a window', async () => {
    const g = await game()
    await g.set({ card: true, first: true })
    lose()
    await g.set({ card: false })
    expect(document.activeElement).toBe(document.body)
  })

  it('gives the box the cursor when a window goes while a card is up', async () => {
    const g = await game()
    await g.set({ card: true, first: true })
    await g.set({ first: false })
    expect(document.activeElement).toBe(g.box())
  })

  it('moves nothing while busy, and gives the box the cursor once that ends', async () => {
    const g = await game()
    await g.set({ first: true })
    await g.set({ busy: true })
    await g.set({ first: false })
    expect(document.activeElement).toBe(document.body)
    await g.set({ busy: false })
    expect(document.activeElement).toBe(g.box())
  })

  it('leaves focus in a window that is up when busy ends', async () => {
    const g = await game()
    await g.set({ busy: true })
    await g.set({ first: true })
    await g.set({ busy: false })
    expect(document.activeElement).toBe(g.window('first'))
  })
})
