// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ArrivalOnPicture from './ArrivalOnPicture.vue'
import { useArrivalStore } from '@/stores/useArrivalStore'
import { FOLLOW_EVENT } from '@/composables/useStoryFollow'
import type { ArrivalPart } from '@/lantern/stageArrival'
import type { QuestNews } from '@/lantern/questNews'
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

  describe('a part too tall for the clear space', () => {
    /** The layout jsdom does not have: the twin is as tall as its text is long, the stage 34 tall. */
    const proto = HTMLElement.prototype
    beforeEach(() => {
      Object.defineProperty(proto, 'offsetHeight', {
        configurable: true,
        get(this: HTMLElement): number {
          return this.classList.contains('lq-arrival-twin')
            ? (this.textContent ?? '').length
            : 0
        },
      })
      Object.defineProperty(proto, 'clientHeight', {
        configurable: true,
        get(this: HTMLElement): number {
          return this.dataset.testid === 'arrival-on-picture' ? 34 + 14 : 0
        },
      })
    })
    afterEach(() => {
      Reflect.deleteProperty(proto, 'offsetHeight')
      Reflect.deleteProperty(proto, 'clientHeight')
    })

    const long: ArrivalPart = {
      kind: 'description',
      lines: [
        { unit: 0, markup: 'Aaaaaaaaaa bbbb.' },
        { unit: 1, markup: 'Cccccccccc dddd.' },
        { unit: 2, markup: 'Eeee.' },
      ],
      voiced: false,
    }

    /** Mount with the part up and let the cut be made. */
    async function told(part: ArrivalPart, phone = false): Promise<VueWrapper> {
      const w = mount(ArrivalOnPicture, { props: { pictured: true, phone } })
      useArrivalStore().show(1, [part], false)
      for (let i = 0; i < 4; i++) await w.vm.$nextTick()
      return w
    }
    const lines = (w: VueWrapper): string[] =>
      w.findAll('.lq-arrival-text .lq-arrival-line').map((l) => l.text())

    it('shows the first page only, then the next on a click, with the same hint', async () => {
      const w = await told(long)
      expect(lines(w)).toEqual(['Aaaaaaaaaa bbbb.', 'Cccccccccc dddd.'])
      expect(w.get('.lq-arrival-hint').text()).toBe(
        'Click or press Enter to continue',
      )
      expect(w.find('.lq-arrival-bar').exists()).toBe(true)
      await w.trigger('click')
      await w.vm.$nextTick()
      expect(lines(w)).toEqual(['Eeee.'])
      expect(w.get('.lq-arrival-hint').text()).toBe(
        'Click or press Enter to continue',
      )
      await w.trigger('click')
      expect(w.find('.lq-arrival-card').exists()).toBe(false)
    })

    it('pages the text of quest news, the seal, heading and name staying on every page', async () => {
      const w = await told({
        kind: 'news',
        news: {
          kind: 'completed',
          name: 'Hint of Magic',
          main: false,
          text: 'x',
          progress: { completed: 1, total: 11 },
        },
        lines: [{ unit: 0, markup: 'Aaaaaaaaaa bbbb. Cccccccccc dddd. Eeee.' }],
        voiced: false,
      })
      const firstPage = lines(w)
      expect(firstPage.length).toBe(1)
      expect(firstPage[0]).not.toContain('Eeee.')
      await w.trigger('click')
      await w.vm.$nextTick()
      expect(lines(w)).toEqual(['Cccccccccc dddd.'])
      expect(w.get('.lq-news-name').text()).toBe('Hint of Magic')
      await w.trigger('click')
      await w.vm.$nextTick()
      expect(lines(w)).toEqual(['Eeee.'])
      expect(w.get('.lq-news-name').text()).toBe('Hint of Magic')
      expect(w.find('.lq-news-seal').exists()).toBe(true)
      expect(w.get('.lq-news-kicker').text()).toBe(
        'Side quest complete · 1 of 11',
      )
    })

    it('shows a part that fits as one page', async () => {
      const w = await told({ ...long, lines: [long.lines[2]] })
      expect(lines(w)).toEqual(['Eeee.'])
      await w.trigger('click')
      expect(w.find('.lq-arrival-card').exists()).toBe(false)
    })

    it('splits a paragraph too tall for a page between its sentences', async () => {
      const w = await told({
        ...long,
        lines: [{ unit: 0, markup: 'Aaaaaaaaaa bbbb. Cccccccccc dddd. Eeee.' }],
      })
      expect(lines(w)).toEqual(['Aaaaaaaaaa bbbb. Cccccccccc dddd.'])
      await w.trigger('click')
      await w.vm.$nextTick()
      expect(lines(w)).toEqual(['Eeee.'])
    })

    it('cuts a later arrival to the stage as it is then', async () => {
      const w = await told(long)
      await w.trigger('click')
      await w.vm.$nextTick()
      expect(lines(w)).toEqual(['Eeee.'])
      Object.defineProperty(proto, 'clientHeight', {
        configurable: true,
        get(this: HTMLElement): number {
          return this.dataset.testid === 'arrival-on-picture' ? 200 : 0
        },
      })
      // The observer is not in jsdom: the cut is made afresh with the part.
      const store = useArrivalStore()
      store.clear()
      store.show(2, [long], false)
      for (let i = 0; i < 4; i++) await w.vm.$nextTick()
      expect(lines(w)).toHaveLength(3)
    })

    it('pages a phone too, so a tap never moves on past unread lines (rq-fc9f)', async () => {
      const w = await told(long, true)
      expect(lines(w)).toEqual(['Aaaaaaaaaa bbbb.', 'Cccccccccc dddd.'])
      expect(w.get('.lq-arrival-hint').text()).toBe('Tap to continue')
      await w.trigger('click')
      await w.vm.$nextTick()
      expect(lines(w)).toEqual(['Eeee.'])
      await w.trigger('click')
      expect(w.find('.lq-arrival-card').exists()).toBe(false)
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

  describe('quest news', () => {
    const piece = (news: QuestNews, unit = 0, voiced = false): ArrivalPart => ({
      kind: 'news',
      news,
      lines: [{ unit, markup: news.text, wordBase: 5 }],
      voiced,
    })
    const done: QuestNews = {
      kind: 'completed',
      name: 'Hint of Magic',
      main: false,
      text: 'It [bold]stayed[/bold].',
      progress: { completed: 1, total: 11 },
    }
    const fresh: QuestNews = {
      kind: 'new',
      name: 'Magic for real',
      main: false,
      text: 'Find something.',
    }
    const update: QuestNews = {
      kind: 'updated',
      name: 'Curiosity killed the cat',
      main: false,
      text: 'The cat.',
    }

    it('tells a completion with the seal, the heading and count, the name, the text and the pill', async () => {
      const w = mount(ArrivalOnPicture, { props: { pictured: true } })
      useArrivalStore().show(1, [piece(done)], false)
      await w.vm.$nextTick()
      expect(w.find('.lq-news-seal').exists()).toBe(true)
      expect(w.get('.lq-news-kicker').text()).toBe(
        'Side quest complete · 1 of 11',
      )
      expect(w.get('.lq-news-name').text()).toBe('Hint of Magic')
      expect(w.get('.lq-arrival-line').text()).toBe('It stayed.')
      expect(w.get('.lq-arrival-hint').text()).toBe(
        'Click or press Enter to continue',
      )
      expect(w.find('button').exists()).toBe(false)
    })

    it('tells a new quest and an update without a seal', async () => {
      const w = mount(ArrivalOnPicture, { props: { pictured: true } })
      const arrival = useArrivalStore()
      arrival.show(1, [piece(fresh), piece(update, 1)], false)
      await w.vm.$nextTick()
      expect(w.find('.lq-news-seal').exists()).toBe(false)
      expect(w.get('.lq-news-kicker').text()).toBe('New side quest')
      await w.trigger('click')
      expect(w.get('.lq-news-kicker').text()).toBe('Quest updated')
      expect(w.get('.lq-news-name').text()).toBe('Curiosity killed the cat')
    })

    it("shows a checklist quest's needs as a list, not as '* ' lines", async () => {
      const w = mount(ArrivalOnPicture, { props: { pictured: true } })
      const checklist: QuestNews = {
        kind: 'new',
        name: 'Preparing for the road',
        main: false,
        text:
          'Mira has tasked you. She says you will need: \n' +
          '[success] * Warm clothing[/success]\n' +
          '[pending] * Sturdy footwear[/pending]',
      }
      useArrivalStore().show(1, [piece(checklist)], false)
      await w.vm.$nextTick()
      const text = w.get('.lq-arrival-text')
      expect(text.text()).not.toContain('*')
      expect(text.findAll('li').map((li) => li.text())).toEqual([
        'Warm clothing',
        'Sturdy footwear',
      ])
    })

    it('lays the checklist out as one left-aligned column, centred and at most 22em wide', () => {
      const source = read('./ArrivalOnPicture.vue')
      const rule = source.match(
        /\.lq-arrival-line :deep\(\.lq-quest-checklist\),\s*\.lq-arrival-twin :deep\(\.lq-quest-checklist\) \{([^}]*)\}/,
      )
      const body = rule?.[1] ?? ''
      expect(body).toContain('width: fit-content')
      expect(body).toContain('max-width: min(22em, 100%)')
      expect(body).toContain('margin-inline: auto')
      expect(body).toContain('text-align: left')
      expect(body).not.toContain('align-items: center')
    })

    it('says "Tap to continue" on a phone', async () => {
      const w = mount(ArrivalOnPicture, {
        props: { pictured: true, phone: true },
      })
      useArrivalStore().show(1, [piece(fresh)], false)
      await w.vm.$nextTick()
      expect(w.get('.lq-arrival-hint').text()).toBe('Tap to continue')
    })
  })

  describe('spell news', () => {
    const spellPart = (): ArrivalPart => ({
      kind: 'news',
      spell: {
        name: 'Revive',
        text: 'Your father’s word for calling a thing back.',
      },
      lines: [
        {
          unit: 0,
          markup: 'Your father’s word for calling a thing back.',
          wordBase: 3,
        },
      ],
      voiced: false,
    })

    it('tells a spell with the violet ✦ seal, "New spell", the capitalised name and the description', async () => {
      const w = mount(ArrivalOnPicture, { props: { pictured: true } })
      useArrivalStore().show(1, [spellPart()], false)
      await w.vm.$nextTick()
      expect(w.get('[data-testid="spell-seal"]').text()).toBe('✦')
      expect(w.find('[data-testid="news-seal"]').exists()).toBe(false)
      expect(w.get('.lq-news-kicker').text()).toBe('New spell')
      expect(w.get('.lq-news-name').text()).toBe('Revive')
      expect(w.get('.lq-arrival-line').text()).toBe(
        'Your father’s word for calling a thing back.',
      )
      expect(w.get('.lq-arrival-hint').text()).toBe(
        'Click or press Enter to continue',
      )
    })

    it('colours a met person in the description as a character name', async () => {
      const part = spellPart()
      const text =
        'It was taught to the [character_name]fisherman[/character_name].'
      part.spell = { name: 'Purify', text }
      part.lines = [{ unit: 0, markup: text, wordBase: 3 }]
      const w = mount(ArrivalOnPicture, { props: { pictured: true } })
      useArrivalStore().show(1, [part], false)
      await w.vm.$nextTick()
      expect(w.get('.lq-arrival-line .theme-character_name').text()).toBe(
        'fisherman',
      )
    })

    it('clears on a click', async () => {
      const w = mount(ArrivalOnPicture, { props: { pictured: true } })
      const arrival = useArrivalStore()
      arrival.show(1, [spellPart()], false)
      await w.trigger('click')
      expect(arrival.active).toBe(false)
    })
  })

  describe('the change between messages', () => {
    it('takes the leaving message out of the row, so it cannot push the new one sideways', () => {
      const source = read('./ArrivalOnPicture.vue')
      expect(source).not.toContain('mode="out-in"')
      expect(source).toMatch(
        /\.lq-arrival-fade-leave-active \{\s*position: absolute;\s*\}/,
      )
    })

    it('fades quickly, by opacity alone', () => {
      const source = read('./ArrivalOnPicture.vue')
      const active = source.match(
        /\.lq-arrival-fade-enter-active,\s*\.lq-arrival-fade-leave-active \{([^}]*)\}/,
      )
      expect(active?.[1]).toContain(
        'transition: opacity calc(0.15s * var(--lq-motion))',
      )
      const ends = source.match(
        /\.lq-arrival-fade-enter-from,\s*\.lq-arrival-fade-leave-to \{([^}]*)\}/,
      )
      expect(ends?.[1].trim()).toBe('opacity: 0;')
    })
  })
})
