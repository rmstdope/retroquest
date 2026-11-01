// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ArrivalOnPicture from './ArrivalOnPicture.vue'
import { useArrivalStore } from '@/stores/useArrivalStore'
import { FOLLOW_EVENT } from '@/composables/useStoryFollow'
import type { ArrivalPart } from '@/lantern/stageArrival'
import {
  LANTERN_PALETTES,
  contrastRatio,
  cssVariableName,
} from '@/lantern/tokens'

// Read from disk: Vitest replaces CSS imports with empty strings.
const read = (path: string): string =>
  readFileSync(new URL(path, import.meta.url), 'utf8')

/**
 * The colour tokens the inline tags are drawn in: every rule of lantern.css
 * whose selector list names a `.theme-*` class, grouped or not.
 */
function inlineTagColourTokens(): string[] {
  const css = read('../../lantern/lantern.css')
  const tokens = [...css.matchAll(/([^{}]*)\{([^}]*)\}/g)]
    .filter((m) => m[1].includes('.theme-'))
    .flatMap((m) =>
      [...m[2].matchAll(/(?:^|[;\s])color: var\((--lq-[\w-]+)\)/g)].map(
        (c) => c[1],
      ),
    )
  return [...new Set(tokens)].sort()
}

/** The `--name: value` declarations of the arrival's rule on a picture. */
function onPictureDeclarations(): Record<string, string> {
  const source = read('./ArrivalOnPicture.vue')
  const body = source.match(/\.lq-arrival-stage:not\(\.lq-bare\) \{([^}]*)\}/)
  return Object.fromEntries(
    [...(body?.[1] ?? '').matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [
      m[1],
      m[2].trim(),
    ]),
  )
}

const description: ArrivalPart = {
  kind: 'description',
  lines: [{ unit: 0, markup: 'Cobbles and a [bold]fountain[/bold].' }],
  voiced: false,
}
const events: ArrivalPart = {
  kind: 'events',
  lines: [{ unit: 0, markup: 'A man leaves.' }],
  voiced: false,
}

describe('ArrivalOnPicture', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
  })
  afterEach(() => vi.useRealTimers())

  it('shows nothing while no arrival is told', () => {
    const w = mount(ArrivalOnPicture, { props: { pictured: true } })
    expect(w.find('.lq-arrival-card').exists()).toBe(false)
    expect(w.classes()).not.toContain('lq-on')
  })

  it('tells the description with the hint, and a bar when it is read for its time', async () => {
    const w = mount(ArrivalOnPicture, { props: { pictured: true } })
    useArrivalStore().show(1, [description], false)
    await w.vm.$nextTick()
    expect(w.get('.lq-arrival-line').text()).toBe('Cobbles and a fountain.')
    expect(w.get('.lq-arrival-hint').text()).toBe(
      'Click or press Enter to continue',
    )
    expect(w.find('[data-testid="arrival-bar"]').exists()).toBe(true)
    expect(w.classes()).toContain('lq-on')
  })

  it('tells what happens in italics, and goes on to the description on a click', async () => {
    const w = mount(ArrivalOnPicture, { props: { pictured: true } })
    useArrivalStore().show(1, [events, description], false)
    await w.vm.$nextTick()
    expect(w.get('.lq-arrival-line').classes()).toContain('lq-arrival-event')
    await w.trigger('click')
    expect(w.get('.lq-arrival-line').classes()).not.toContain(
      'lq-arrival-event',
    )
    await w.trigger('click')
    expect(w.find('.lq-arrival-card').exists()).toBe(false)
  })

  it('shows no bar when the narrator tells it', async () => {
    const w = mount(ArrivalOnPicture, { props: { pictured: true } })
    useArrivalStore().show(1, [{ ...description, voiced: true }], true)
    await w.vm.$nextTick()
    expect(w.find('[data-testid="arrival-bar"]').exists()).toBe(false)
  })

  it('is dark ink on the paper when there is no picture', () => {
    const w = mount(ArrivalOnPicture, { props: { pictured: false } })
    expect(w.classes()).toContain('lq-bare')
    const withPicture = mount(ArrivalOnPicture, { props: { pictured: true } })
    expect(withPicture.classes()).not.toContain('lq-bare')
  })

  it('is a polite live region', () => {
    const w = mount(ArrivalOnPicture, { props: { pictured: true } })
    expect(w.attributes('aria-live')).toBe('polite')
  })

  it('says "Tap to continue" on a phone', async () => {
    const w = mount(ArrivalOnPicture, {
      props: { pictured: true, phone: true },
    })
    useArrivalStore().show(1, [description], false)
    await w.vm.$nextTick()
    expect(w.get('.lq-arrival-hint').text()).toBe('Tap to continue')
  })

  describe('the hint pill', () => {
    it('holds the hint and, while nobody speaks, the reading bar', async () => {
      const w = mount(ArrivalOnPicture, { props: { pictured: true } })
      useArrivalStore().show(1, [description], false)
      await w.vm.$nextTick()
      const pill = w.get('.lq-arrival-pill')
      expect(pill.find('.lq-arrival-hint').exists()).toBe(true)
      expect(pill.find('[data-testid="arrival-bar"]').exists()).toBe(true)
    })

    it('holds only the hint when the narrator speaks the part', async () => {
      const w = mount(ArrivalOnPicture, { props: { pictured: false } })
      useArrivalStore().show(1, [{ ...description, voiced: true }], true)
      await w.vm.$nextTick()
      const pill = w.get('.lq-arrival-pill')
      expect(pill.get('.lq-arrival-hint').text()).toBe(
        'Click or press Enter to continue',
      )
      expect(pill.find('[data-testid="arrival-bar"]').exists()).toBe(false)
    })

    it('is a dark see-through pill whose words meet 4.5:1 even over white', () => {
      const source = read('./ArrivalOnPicture.vue')
      const pill = source.match(/\.lq-arrival-pill \{([^}]*)\}/)?.[1] ?? ''
      const bg = pill.match(
        /background:\s*rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)/,
      )
      expect(bg).not.toBeNull()
      const alpha = Number(bg?.[4])
      expect(alpha).toBeGreaterThan(0)
      expect(alpha).toBeLessThan(1)
      const over = [1, 2, 3]
        .map((i) => Math.round(Number(bg?.[i]) * alpha + 255 * (1 - alpha)))
        .map((c) => c.toString(16).padStart(2, '0'))
        .join('')
      const ink = pill.match(/color:\s*(#[0-9a-f]{6})/i)?.[1] ?? ''
      expect(contrastRatio(ink, `#${over}`)).toBeGreaterThanOrEqual(4.5)
      expect(pill).toContain('text-shadow: none')
      const hint = source.match(/\.lq-arrival-hint \{([^}]*)\}/)?.[1] ?? ''
      expect(hint).not.toContain('opacity')
    })
  })

  describe('a long arrival', () => {
    /** The layout jsdom does not have: the text box's content and visible heights. */
    const box = { scrollHeight: 0, clientHeight: 0 }
    const proto = HTMLElement.prototype
    const isBox = (el: Element): boolean =>
      el.classList.contains('lq-arrival-text')

    beforeEach(() => {
      for (const key of ['scrollHeight', 'clientHeight'] as const)
        Object.defineProperty(proto, key, {
          configurable: true,
          get(this: HTMLElement): number {
            return isBox(this) ? box[key] : 0
          },
        })
    })
    afterEach(() => {
      Reflect.deleteProperty(proto, 'scrollHeight')
      Reflect.deleteProperty(proto, 'clientHeight')
    })

    /** Mount with a part up and the box laid out at the given heights. */
    async function told(
      scrollHeight: number,
      clientHeight: number,
      voiced = false,
    ): Promise<VueWrapper> {
      box.scrollHeight = scrollHeight
      box.clientHeight = clientHeight
      const w = mount(ArrivalOnPicture, { props: { pictured: true } })
      useArrivalStore().show(1, [{ ...description, voiced }], voiced)
      await w.vm.$nextTick()
      await w.vm.$nextTick()
      return w
    }

    /** Scroll the text box to `top` and let the component notice. */
    async function scrollTo(w: VueWrapper, top: number): Promise<void> {
      const el = w.get('.lq-arrival-text').element
      Object.defineProperty(el, 'scrollTop', {
        value: top,
        writable: true,
        configurable: true,
      })
      await w.get('.lq-arrival-text').trigger('scroll')
    }

    it('keeps the lines in a text box and the pill outside it', async () => {
      const w = await told(100, 100)
      expect(w.get('.lq-arrival-text').find('.lq-arrival-line').exists()).toBe(
        true,
      )
      expect(w.get('.lq-arrival-text').find('.lq-arrival-pill').exists()).toBe(
        false,
      )
      expect(w.get('.lq-arrival-card').find('.lq-arrival-pill').exists()).toBe(
        true,
      )
    })

    it('fades nowhere when the text fits', async () => {
      const w = await told(300, 300)
      expect(w.get('.lq-arrival-text').classes()).not.toContain('lq-fade-b')
      expect(w.get('.lq-arrival-text').classes()).not.toContain('lq-fade-t')
    })

    it('fades the edges where the text continues', async () => {
      const w = await told(900, 300)
      const classes = (): string[] => w.get('.lq-arrival-text').classes()
      expect(classes()).toContain('lq-fade-b')
      expect(classes()).not.toContain('lq-fade-t')
      await scrollTo(w, 200)
      expect(classes()).toContain('lq-fade-b')
      expect(classes()).toContain('lq-fade-t')
      await scrollTo(w, 600)
      expect(classes()).not.toContain('lq-fade-b')
      expect(classes()).toContain('lq-fade-t')
    })

    it('starts each part at its first line', async () => {
      box.scrollHeight = 900
      box.clientHeight = 300
      const w = mount(ArrivalOnPicture, { props: { pictured: true } })
      useArrivalStore().show(1, [events, description], false)
      await w.vm.$nextTick()
      await w.vm.$nextTick()
      await scrollTo(w, 400)
      await w.trigger('click')
      await w.vm.$nextTick()
      await w.vm.$nextTick()
      const el = w.get('.lq-arrival-text')
      expect(el.element.scrollTop).toBe(0)
      expect(el.classes()).toContain('lq-fade-b')
      expect(el.classes()).not.toContain('lq-fade-t')
    })

    it('starts a second arrival of the same kind at its first line', async () => {
      const w = await told(900, 300)
      await scrollTo(w, 400)
      expect(w.get('.lq-arrival-text').classes()).toContain('lq-fade-t')
      const store = useArrivalStore()
      store.clear()
      store.show(2, [description], false)
      for (let i = 0; i < 4; i++) await w.vm.$nextTick()
      const el = w.get('.lq-arrival-text')
      expect(el.element.scrollTop).toBe(0)
      expect(el.classes()).not.toContain('lq-fade-t')
      expect(el.classes()).toContain('lq-fade-b')
    })

    it('follows the lit word that leaves the visible text, and takes the event', async () => {
      const w = await told(900, 300, true)
      const text = w.get('.lq-arrival-text').element
      const scrollTo = vi.fn()
      text.scrollTo = scrollTo
      const word = document.createElement('span')
      text.append(word)
      text.getBoundingClientRect = (): DOMRect =>
        ({ top: 100, bottom: 400, height: 300 }) as DOMRect
      word.getBoundingClientRect = (): DOMRect =>
        ({ top: 500, bottom: 520, height: 20 }) as DOMRect
      const event = new CustomEvent(FOLLOW_EVENT, {
        bubbles: true,
        cancelable: true,
      })
      word.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(true)
      expect(scrollTo).toHaveBeenCalledTimes(1)
      expect(scrollTo.mock.calls[0][0].top).toBe(0 + 500 - 100 - 100)
    })

    it('leaves the text alone while the lit word is in the middle of it', async () => {
      const w = await told(900, 300, true)
      const text = w.get('.lq-arrival-text').element
      const scrollTo = vi.fn()
      text.scrollTo = scrollTo
      const word = document.createElement('span')
      text.append(word)
      text.getBoundingClientRect = (): DOMRect =>
        ({ top: 100, bottom: 400, height: 300 }) as DOMRect
      word.getBoundingClientRect = (): DOMRect =>
        ({ top: 180, bottom: 200, height: 20 }) as DOMRect
      word.dispatchEvent(
        new CustomEvent(FOLLOW_EVENT, { bubbles: true, cancelable: true }),
      )
      expect(scrollTo).not.toHaveBeenCalled()
    })

    it('jumps instead of gliding with reduced motion', async () => {
      document.documentElement.style.setProperty('--lq-motion', '0')
      const w = await told(900, 300, true)
      const text = w.get('.lq-arrival-text').element
      const scrollTo = vi.fn()
      text.scrollTo = scrollTo
      const word = document.createElement('span')
      text.append(word)
      text.getBoundingClientRect = (): DOMRect =>
        ({ top: 100, bottom: 400, height: 300 }) as DOMRect
      word.getBoundingClientRect = (): DOMRect =>
        ({ top: 500, bottom: 520, height: 20 }) as DOMRect
      word.dispatchEvent(
        new CustomEvent(FOLLOW_EVENT, { bubbles: true, cancelable: true }),
      )
      expect(scrollTo.mock.calls[0][0].behavior).toBe('auto')
      document.documentElement.style.removeProperty('--lq-motion')
    })

    it('keeps the pill from shrinking and the stage from scrolling itself', () => {
      const source = read('./ArrivalOnPicture.vue')
      const pill = source.match(/\.lq-arrival-pill \{([^}]*)\}/)?.[1] ?? ''
      expect(pill).toContain('flex-shrink: 0')
      const phone = source.match(/\.lq-phone-arrival \{([^}]*)\}/)?.[1] ?? ''
      expect(phone).not.toContain('overflow-y')
      const text = source.match(/\.lq-arrival-text \{([^}]*)\}/)?.[1] ?? ''
      expect(text).toContain('overflow-y: auto')
      expect(text).toContain('min-height: 0')
    })
  })

  describe('on a picture, in either theme', () => {
    const dark = Object.fromEntries(
      Object.entries(LANTERN_PALETTES.dark).map(([k, v]) => [
        cssVariableName(k),
        v,
      ]),
    )

    it('finds the colours the inline tags use', () => {
      expect(inlineTagColourTokens()).toEqual([
        '--lq-accent-text',
        '--lq-character',
        '--lq-failure',
        '--lq-fg',
        '--lq-item',
        '--lq-muted',
        '--lq-spell',
        '--lq-success',
      ])
    })

    it.each(inlineTagColourTokens())(
      'draws %s in the dark theme colour, readable against the dark glow',
      (token) => {
        const colour = onPictureDeclarations()[token]
        expect(colour, token).toBe(dark[token])
        expect(contrastRatio(colour, '#000000')).toBeGreaterThanOrEqual(4.5)
      },
    )
  })
})
