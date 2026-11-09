// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import BeltOfPictures from './BeltOfPictures.vue'
import { useGameStore } from '@/stores/useGameStore'
import { useBeltStore } from '@/stores/useBeltStore'
import { useFlightStore } from '@/stores/useFlightStore'

describe('BeltOfPictures', () => {
  let w: VueWrapper | undefined
  const mountBelt = (props: { compact?: boolean } = {}): VueWrapper =>
    (w = mount(BeltOfPictures, { props, attachTo: document.body }))
  const tiles = (): string[] =>
    w!.findAll('[data-belt-pic]').map((t) => t.attributes('data-belt-pic')!)

  beforeEach(() => {
    const memory: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => memory[key] ?? null,
      setItem: (key: string, value: string) => {
        memory[key] = value
      },
      clear: () => undefined,
    })
    setActivePinia(createPinia())
    const game = useGameStore()
    game.rawInventory = [
      {
        name: '[item_name]2 bread[/item_name]',
        description: 'A [bold]loaf[/bold].',
      },
      { name: "[item_name]Elior's Journal[/item_name]", description: 'Notes.' },
    ]
    game.rawSpells = [
      { name: '[spell_name]light[/spell_name]', description: 'Glow.' },
    ]
  })
  afterEach(() => {
    w?.unmount()
    vi.unstubAllGlobals()
  })

  it('shows a picture for each carried thing, with its name and count beneath', () => {
    mountBelt()
    expect(tiles()).toEqual(['item:bread', "item:Elior's Journal"])
    const bread = w!.get('[data-belt-pic="item:bread"]')
    expect(bread.text()).toContain('Bread')
    expect(bread.text()).toContain('×2')
    expect(bread.find('.lq-belt-letter').text()).toBe('B')
  })

  it('has two tiny buttons with no words, the lit one for the list showing', async () => {
    mountBelt()
    const bag = w!.get('[data-belt-switch="bag"]')
    const spells = w!.get('[data-belt-switch="spells"]')
    expect(bag.attributes('aria-label')).toBe('Bag')
    expect(bag.text()).toBe('')
    expect(bag.attributes('aria-pressed')).toBe('true')
    expect(spells.attributes('aria-pressed')).toBe('false')
    await spells.trigger('click')
    expect(tiles()).toEqual(['spell:light'])
    expect(useBeltStore().list).toBe('spells')
    expect(
      w!.get('[data-belt-switch="spells"]').attributes('aria-pressed'),
    ).toBe('true')
  })

  it('says so when nothing is carried and when no spell is known', async () => {
    const game = useGameStore()
    game.rawInventory = []
    game.rawSpells = []
    mountBelt()
    expect(w!.text()).toContain('Your bag is empty.')
    await w!.get('[data-belt-switch="spells"]').trigger('click')
    expect(w!.text()).toContain('You know no spells yet.')
  })

  it('puts the belt away with ▾, leaving the tiny buttons, and brings it back on the list pressed', async () => {
    mountBelt()
    await w!.get('[data-belt-away]').trigger('click')
    expect(w!.find('[data-belt-pic]').exists()).toBe(false)
    expect(w!.find('[data-belt-switch="bag"]').exists()).toBe(true)
    expect(w!.find('[data-belt-away]').exists()).toBe(false)
  })

  it('brings the belt back on the list of the tiny button pressed', async () => {
    useBeltStore().putAway()
    mountBelt()
    await w!.get('[data-belt-switch="spells"]').trigger('click')
    expect(useBeltStore().away).toBe(false)
    expect(tiles()).toEqual(['spell:light'])
  })

  it('shows an amber dot only on the button of the list not showing, and on both while away', async () => {
    const game = useGameStore()
    game.spellsHaveNew = true
    mountBelt()
    expect(w!.find('[data-belt-switch="spells"] .lq-dot').exists()).toBe(true)
    expect(w!.find('[data-belt-switch="bag"] .lq-dot').exists()).toBe(false)
    game.bagHasNew = true
    useBeltStore().putAway()
    await nextTick()
    expect(w!.find('[data-belt-switch="bag"] .lq-dot').exists()).toBe(true)
  })

  it('counts the list showing as seen', async () => {
    const game = useGameStore()
    game.bagHasNew = true
    mountBelt()
    await nextTick()
    expect(game.bagHasNew).toBe(false)
  })

  it('tells a press on a picture with the spot, and a key press with its middle', async () => {
    mountBelt()
    const el = w!.get('[data-belt-pic="item:bread"]').element
    el.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        clientX: 30,
        clientY: 40,
        detail: 1,
      }),
    )
    expect(w!.emitted('press')?.[0][0]).toMatchObject({ name: 'bread' })
    expect(w!.emitted('press')?.[0][1]).toEqual({ x: 30, y: 40 })
    el.getBoundingClientRect = () =>
      ({ left: 10, top: 20, width: 40, height: 40 }) as DOMRect
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }))
    expect(w!.emitted('press')?.[1][1]).toEqual({ x: 30, y: 40 })
  })

  it('walks along the belt with the arrow keys, one Tab stop', async () => {
    mountBelt()
    const first = w!.get('[data-belt-pic="item:bread"]')
    const second = w!.get('[data-belt-pic="item:Elior\'s Journal"]')
    expect(first.attributes('tabindex')).toBe('0')
    expect(second.attributes('tabindex')).toBe('-1')
    ;(first.element as HTMLElement).focus()
    await first.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(second.element)
    await second.trigger('keydown', { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(first.element)
  })

  it('shows the name and description as a caption while a picture has focus', async () => {
    mountBelt()
    expect(w!.find('.lq-belt-caption').exists()).toBe(false)
    await w!.get('[data-belt-pic="item:bread"]').trigger('focus')
    expect(w!.get('.lq-belt-caption').text()).toContain('Bread')
    expect(w!.get('.lq-belt-caption').text()).toContain('A loaf.')
    await w!.get('[data-belt-pic="item:bread"]').trigger('blur')
    expect(w!.find('.lq-belt-caption').exists()).toBe(false)
  })

  it('reads a picture as its name, count and description', () => {
    mountBelt()
    const bread = w!.get('[data-belt-pic="item:bread"]')
    expect(bread.attributes('aria-label')).toBe('Bread, 2')
    const id = bread.attributes('aria-describedby')!
    expect(document.getElementById(id)?.textContent).toBe('A loaf.')
  })

  it('lights the picture in hand', async () => {
    mountBelt()
    useBeltStore().takeInHand({
      kind: 'item',
      name: 'bread',
      label: 'Bread',
      verb: 'give',
    })
    await nextTick()
    expect(w!.get('[data-belt-pic="item:bread"]').classes()).toContain('lq-lit')
  })

  it('keeps the names off the pictures when compact', () => {
    mountBelt({ compact: true })
    expect(w!.find('.lq-belt-name').exists()).toBe(false)
  })

  it('shows ‹ and › only when there are more pictures than fit', async () => {
    mountBelt()
    expect(w!.find('[data-belt-more="next"]').exists()).toBe(false)
    const strip = w!.get('.lq-belt-strip').element as HTMLElement
    Object.defineProperty(strip, 'clientWidth', {
      value: 100,
      configurable: true,
    })
    Object.defineProperty(strip, 'scrollWidth', {
      value: 300,
      configurable: true,
    })
    await w!.get('.lq-belt-strip').trigger('scroll')
    expect(w!.find('[data-belt-more="next"]').exists()).toBe(true)
    expect(w!.find('[data-belt-more="prev"]').exists()).toBe(false)
  })

  it('bumps the picture that a gained thing has flown to, and the tiny button of its kind', async () => {
    mountBelt()
    const flights = useFlightStore()
    flights.landed = 'item'
    flights.landedName = 'bread'
    await nextTick()
    expect(w!.get('[data-belt-pic="item:bread"]').classes()).toContain(
      'lq-landed',
    )
    expect(
      w!.get('[data-belt-pic="item:Elior\'s Journal"]').classes(),
    ).not.toContain('lq-landed')
    expect(w!.get('[data-belt-switch="bag"]').classes()).toContain('lq-landed')
  })

  it('dips the Bag tiny button as a lost item rises out of it', async () => {
    mountBelt()
    useFlightStore().dipped = 'item'
    await nextTick()
    expect(w!.get('[data-belt-switch="bag"]').classes()).toContain('lq-dipped')
    expect(w!.get('[data-belt-switch="spells"]').classes()).not.toContain(
      'lq-dipped',
    )
  })

  it('scrolls the picture a gained thing will land on into view as the flight begins', async () => {
    mountBelt()
    const el = w!.get('[data-belt-pic="item:bread"]').element
    const scrolled = vi.fn()
    el.scrollIntoView = scrolled
    useFlightStore().launch([{ kind: 'item', name: 'bread', count: 2 }])
    await nextTick()
    await nextTick()
    expect(scrolled).toHaveBeenCalled()
    useFlightStore().clear()
  })
})
