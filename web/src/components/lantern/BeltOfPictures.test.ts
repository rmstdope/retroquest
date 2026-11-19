// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import BeltOfPictures from './BeltOfPictures.vue'
import { useGameStore } from '@/stores/useGameStore'
import { useBeltStore } from '@/stores/useBeltStore'
import { useFlightStore } from '@/stores/useFlightStore'
import { setPictureProbe } from '@/lantern/roomPicture'
import { flushPromises } from '@vue/test-utils'

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
    setPictureProbe(null)
    w?.unmount()
    vi.unstubAllGlobals()
  })

  it('shows a picture for each carried thing, with its count as a tag and no name beneath', () => {
    mountBelt()
    expect(tiles()).toEqual(['item:bread', "item:Elior's Journal"])
    const bread = w!.get('[data-belt-pic="item:bread"]')
    expect(bread.text()).not.toContain('Bread')
    expect(bread.text()).toContain('×2')
    expect(w!.find('.lq-belt-name').exists()).toBe(false)
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
    useBeltStore().show('spells')
    await nextTick()
    expect(tiles()).toEqual(['spell:light'])
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
    useBeltStore().show('spells')
    await nextTick()
    expect(w!.text()).toContain('You know no spells yet.')
  })

  it('has no ▾ button', () => {
    mountBelt()
    expect(w!.find('[data-belt-away]').exists()).toBe(false)
    expect(w!.text()).not.toContain('▾')
  })

  describe('the strap folds and unfurls', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => {
      vi.useRealTimers()
      document.documentElement.style.removeProperty('--lq-motion')
    })
    const stud = (list: string): ReturnType<VueWrapper['get']> =>
      w!.get(`[data-belt-switch="${list}"]`)

    it('folds away in 0.6 s when the lit stud is pressed, leaving the studs', async () => {
      mountBelt()
      await stud('bag').trigger('click')
      expect(useBeltStore().away).toBe(true)
      expect(w!.find('[data-belt-pic]').exists()).toBe(true)
      expect(w!.get('.lq-belt').classes()).toContain('lq-belt-folded')
      vi.advanceTimersByTime(599)
      await nextTick()
      expect(w!.find('[data-belt-pic]').exists()).toBe(true)
      vi.advanceTimersByTime(1)
      await nextTick()
      expect(w!.find('[data-belt-pic]').exists()).toBe(false)
      expect(w!.find('[data-belt-switch="bag"]').exists()).toBe(true)
      expect(stud('bag').attributes('aria-pressed')).toBe('false')
    })

    it('unfurls on the list of the stud pressed while folded away', async () => {
      useBeltStore().putAway()
      mountBelt()
      expect(w!.find('[data-belt-pic]').exists()).toBe(false)
      await stud('spells').trigger('click')
      expect(useBeltStore().away).toBe(false)
      expect(useBeltStore().list).toBe('spells')
      expect(tiles()).toEqual(['spell:light'])
      await nextTick()
      vi.advanceTimersByTime(600)
      await nextTick()
      expect(w!.get('.lq-belt').classes()).not.toContain('lq-belt-folded')
      expect(tiles()).toEqual(['spell:light'])
    })

    it('keeps reporting the height of the folded tab, so the story stays clear of it', async () => {
      const original = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        'offsetHeight',
      )
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
        configurable: true,
        get: () => 52,
      })
      try {
        useBeltStore().putAway()
        mountBelt()
        await nextTick()
        const heights = w!.emitted<[number]>('measure')!.map((e) => e[0])
        expect(heights.at(-1)).toBe(52)
      } finally {
        if (original) {
          Object.defineProperty(HTMLElement.prototype, 'offsetHeight', original)
        } else {
          Reflect.deleteProperty(HTMLElement.prototype, 'offsetHeight')
        }
      }
    })

    it('keeps reporting the folded tab when the strap is folded during play', async () => {
      const original = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        'offsetHeight',
      )
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
        configurable: true,
        get: () => 52,
      })
      try {
        mountBelt()
        await stud('bag').trigger('click')
        vi.advanceTimersByTime(600)
        await nextTick()
        await nextTick()
        const heights = w!.emitted<[number]>('measure')!.map((e) => e[0])
        expect(heights.at(-1)).toBe(52)
      } finally {
        if (original) {
          Object.defineProperty(HTMLElement.prototype, 'offsetHeight', original)
        } else {
          Reflect.deleteProperty(HTMLElement.prototype, 'offsetHeight')
        }
      }
    })

    it('folds the open list away, then unfurls the other, 0.6 s each, ignoring presses meanwhile', async () => {
      mountBelt()
      await stud('spells').trigger('click')
      expect(useBeltStore().away).toBe(true)
      expect(useBeltStore().list).toBe('bag')
      await stud('bag').trigger('click')
      await stud('spells').trigger('click')
      vi.advanceTimersByTime(600)
      await nextTick()
      expect(useBeltStore().away).toBe(false)
      expect(useBeltStore().list).toBe('spells')
      expect(tiles()).toEqual(['spell:light'])
      await stud('bag').trigger('click')
      expect(useBeltStore().list).toBe('spells')
      expect(useBeltStore().away).toBe(false)
      vi.advanceTimersByTime(600)
      await nextTick()
      await stud('bag').trigger('click')
      expect(useBeltStore().away).toBe(true)
    })

    it('changes at once when reduced motion is chosen', async () => {
      document.documentElement.style.setProperty('--lq-motion', '0')
      mountBelt()
      await stud('bag').trigger('click')
      await nextTick()
      expect(w!.find('[data-belt-pic]').exists()).toBe(false)
      await stud('spells').trigger('click')
      await nextTick()
      expect(tiles()).toEqual(['spell:light'])
      await stud('bag').trigger('click')
      await nextTick()
      expect(tiles()).toEqual(['item:bread', "item:Elior's Journal"])
    })

    it('moves focus from a picture to the stud that folded the strap', async () => {
      mountBelt()
      ;(w!.get('[data-belt-pic="item:bread"]').element as HTMLElement).focus()
      useBeltStore().putAway()
      await nextTick()
      expect(document.activeElement).toBe(stud('bag').element)
    })

    it('unfurls a short strap with the words when nothing is carried, and folds it the same', async () => {
      const game = useGameStore()
      game.rawInventory = []
      mountBelt()
      expect(w!.text()).toContain('Your bag is empty.')
      await stud('bag').trigger('click')
      vi.advanceTimersByTime(600)
      await nextTick()
      expect(w!.text()).not.toContain('Your bag is empty.')
      await stud('bag').trigger('click')
      expect(w!.text()).toContain('Your bag is empty.')
    })
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

  it('tells the layout the caption of the picture that has focus, and none once it is gone', async () => {
    mountBelt()
    const told = (): unknown[] =>
      (w!.emitted('caption') ?? []).map((e) => (e as unknown[])[0])
    expect(told().at(-1)).toBeNull()
    await w!.get('[data-belt-pic="item:bread"]').trigger('focus')
    expect(told().at(-1)).toMatchObject({
      label: 'Bread',
      note: 'A [bold]loaf[/bold].',
    })
    await w!.get('[data-belt-pic="item:bread"]').trigger('blur')
    expect(told().at(-1)).toBeNull()
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
      verb: 'usewith',
    })
    await nextTick()
    expect(w!.get('[data-belt-pic="item:bread"]').classes()).toContain('lq-lit')
  })

  it('keeps the names off the pictures when compact', () => {
    mountBelt({ compact: true })
    expect(w!.find('.lq-belt-name').exists()).toBe(false)
  })

  describe('lifting a picture to drag it', () => {
    const pointer = (
      type: string,
      x: number,
      pointerType = 'mouse',
    ): PointerEvent =>
      new PointerEvent(type, {
        pointerType,
        clientX: x,
        clientY: 5,
        button: 0,
        bubbles: true,
      })
    const lifts = (): unknown[][] => (w!.emitted('lift') ?? []) as unknown[][]

    it('lifts a picture a mouse pulls a few pixels, and the release is no press', async () => {
      mountBelt()
      const el = w!.get('[data-belt-pic="item:bread"]').element
      el.dispatchEvent(pointer('pointerdown', 10))
      el.dispatchEvent(pointer('pointermove', 12))
      expect(lifts()).toHaveLength(0)
      el.dispatchEvent(pointer('pointermove', 20))
      expect(lifts()).toHaveLength(1)
      expect(lifts()[0][0]).toMatchObject({ key: 'item:bread' })
      expect(lifts()[0][1]).toMatchObject({ x: 20, y: 5, pointerType: 'mouse' })
      el.dispatchEvent(pointer('pointermove', 40))
      expect(lifts()).toHaveLength(1)
      el.dispatchEvent(pointer('pointerup', 40))
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
      expect(w!.emitted('press')).toBeUndefined()
    })

    it('still presses on a click that never moved', async () => {
      mountBelt()
      const el = w!.get('[data-belt-pic="item:bread"]').element
      el.dispatchEvent(pointer('pointerdown', 10))
      el.dispatchEvent(pointer('pointermove', 11))
      el.dispatchEvent(pointer('pointerup', 11))
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
      expect(lifts()).toHaveLength(0)
      expect(w!.emitted('press')).toHaveLength(1)
    })

    it('lifts nothing once the button is up again', async () => {
      mountBelt()
      const el = w!.get('[data-belt-pic="item:bread"]').element
      el.dispatchEvent(pointer('pointerdown', 10))
      el.dispatchEvent(pointer('pointerup', 10))
      el.dispatchEvent(pointer('pointermove', 60))
      expect(lifts()).toHaveLength(0)
    })

    it('marks the lifted pocket as an empty ring and a pocket dropped on as lit', async () => {
      mountBelt()
      await w!.setProps({
        lifted: 'item:bread',
        dragOver: "item:Elior's Journal",
      })
      expect(w!.get('[data-belt-pic="item:bread"]').classes()).toContain(
        'lq-belt-lifted',
      )
      expect(
        w!.get('[data-belt-pic="item:Elior\'s Journal"]').classes(),
      ).toContain('lq-belt-drop')
      expect(w!.get('[data-belt-pic="item:bread"]').classes()).not.toContain(
        'lq-belt-drop',
      )
    })

    it('lifts a finger only after the hold, then on the next move; a swipe still scrolls', async () => {
      vi.useFakeTimers()
      try {
        mountBelt()
        const el = w!.get('[data-belt-pic="item:bread"]').element
        el.dispatchEvent(pointer('pointerdown', 10, 'touch'))
        el.dispatchEvent(pointer('pointermove', 60, 'touch'))
        expect(lifts()).toHaveLength(0)
        el.dispatchEvent(pointer('pointerup', 60, 'touch'))
        el.dispatchEvent(pointer('pointerdown', 10, 'touch'))
        vi.advanceTimersByTime(450)
        await nextTick()
        el.dispatchEvent(pointer('pointermove', 12, 'touch'))
        expect(lifts()).toHaveLength(0)
        const stop = new Event('touchmove', { cancelable: true })
        document.dispatchEvent(stop)
        expect(stop.defaultPrevented).toBe(true)
        // Only a finger that has held is a drag: before the hold its moves still scroll the bag.
        el.dispatchEvent(pointer('pointerup', 12, 'touch'))
        el.dispatchEvent(pointer('pointerdown', 10, 'touch'))
        const early = new Event('touchmove', { cancelable: true })
        document.dispatchEvent(early)
        expect(early.defaultPrevented).toBe(false)
        vi.advanceTimersByTime(450)
        await nextTick()
        el.dispatchEvent(pointer('pointermove', 30, 'touch'))
        expect(lifts()).toHaveLength(1)
        expect(lifts()[0][1]).toMatchObject({ pointerType: 'touch' })
      } finally {
        vi.useRealTimers()
      }
    })
  })

  describe('touch and hold', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())
    const told = (): unknown[] =>
      (w!.emitted('caption') ?? []).map((e) => (e as unknown[])[0])
    const touch = (type: string, x = 5): PointerEvent =>
      new PointerEvent(type, {
        pointerType: 'touch',
        clientX: x,
        clientY: 5,
        bubbles: true,
      })

    it('shows only the caption after 450 ms, and no ring; letting go hides it', async () => {
      mountBelt()
      const el = w!.get('[data-belt-pic="item:bread"]').element
      el.dispatchEvent(touch('pointerdown'))
      vi.advanceTimersByTime(449)
      await nextTick()
      expect(told().at(-1)).toBeNull()
      vi.advanceTimersByTime(1)
      await nextTick()
      expect(told().at(-1)).toMatchObject({ label: 'Bread' })
      el.dispatchEvent(touch('pointerup'))
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
      await nextTick()
      expect(told().at(-1)).toBeNull()
      expect(w!.emitted('press')).toBeUndefined()
    })

    it('does not eat a later key press when no click follows a hold', async () => {
      mountBelt()
      const el = w!.get('[data-belt-pic="item:bread"]').element
      el.dispatchEvent(touch('pointerdown'))
      vi.advanceTimersByTime(450)
      el.dispatchEvent(touch('pointercancel'))
      vi.advanceTimersByTime(1)
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }))
      expect(w!.emitted('press')).toHaveLength(1)
    })

    it('leaves a tap as a press, with no caption', async () => {
      mountBelt()
      const el = w!.get('[data-belt-pic="item:bread"]').element
      el.dispatchEvent(touch('pointerenter'))
      el.dispatchEvent(touch('pointerdown'))
      el.dispatchEvent(touch('pointerup'))
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
      await nextTick()
      expect(told().at(-1)).toBeNull()
      expect(w!.emitted('press')).toHaveLength(1)
    })

    it('is no hold when the finger moves or the touch is cancelled', async () => {
      mountBelt()
      const el = w!.get('[data-belt-pic="item:bread"]').element
      el.dispatchEvent(touch('pointerdown'))
      el.dispatchEvent(touch('pointermove', 40))
      vi.advanceTimersByTime(600)
      await nextTick()
      expect(told().at(-1)).toBeNull()
      el.dispatchEvent(touch('pointerdown'))
      el.dispatchEvent(touch('pointercancel'))
      vi.advanceTimersByTime(600)
      await nextTick()
      expect(told().at(-1)).toBeNull()
    })

    it('still shows the caption for a mouse resting on a picture', async () => {
      mountBelt()
      await w!.get('[data-belt-pic="item:bread"]').trigger('pointerenter')
      expect(told().at(-1)).toMatchObject({ label: 'Bread' })
    })
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

  it('holds back a gained thing and a spell until their flights land', async () => {
    mountBelt()
    const flights = useFlightStore()
    flights.owe([
      { kind: 'item', name: "Elior's Journal", count: 1 },
      { kind: 'item', name: 'bread', count: 1 },
      { kind: 'spell', name: 'light', count: 1 },
    ])
    await nextTick()
    expect(tiles()).toEqual(['item:bread'])
    expect(w!.get('[data-belt-pic="item:bread"]').text()).not.toContain('×')
    useBeltStore().show('spells')
    await nextTick()
    expect(tiles()).toEqual([])
    flights.clear()
    await nextTick()
    expect(tiles()).toEqual(['spell:light'])
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

  describe('with pictures made', () => {
    it('shows the picture of a painted thing in place of its letter, keeping the rest', async () => {
      setPictureProbe((url) => Promise.resolve(url.endsWith('item-bread.png')))
      mountBelt()
      await flushPromises()
      const bread = w!.get('[data-belt-pic="item:bread"]')
      expect(bread.find('img').attributes('src')).toMatch(/item-bread\.png$/)
      expect(bread.find('img').attributes('alt')).toBe('')
      expect(bread.find('.lq-belt-letter').exists()).toBe(false)
      expect(bread.text()).toContain('×2')
      expect(bread.attributes('aria-label')).toBe('Bread, 2')
      const journal = w!.get('[data-belt-pic="item:Elior\'s Journal"]')
      expect(journal.find('img').exists()).toBe(false)
      expect(journal.find('.lq-belt-letter').text()).toBe('E')
    })

    it('shows a painted spell, on the small row of a sideways phone too', async () => {
      setPictureProbe(() => Promise.resolve(true))
      mountBelt({ compact: true })
      useBeltStore().show('spells')
      await flushPromises()
      const light = w!.get('[data-belt-pic="spell:light"]')
      expect(light.find('img').attributes('src')).toMatch(/spell-light\.png$/)
    })

    it('keeps the letter while the picture loads and when it fails to load', async () => {
      setPictureProbe(() => new Promise<boolean>(() => undefined))
      mountBelt()
      await flushPromises()
      expect(w!.find('[data-belt-pic="item:bread"] img').exists()).toBe(false)
      expect(
        w!.get('[data-belt-pic="item:bread"] .lq-belt-letter').text(),
      ).toBe('B')
      setPictureProbe(() => Promise.resolve(false))
      w!.unmount()
      mountBelt()
      await flushPromises()
      expect(w!.find('[data-belt-pic="item:bread"] img').exists()).toBe(false)
    })
  })
})
