// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ArrivalOnPicture from './ArrivalOnPicture.vue'
import { useArrivalStore } from '@/stores/useArrivalStore'
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
      expect(pill).not.toContain('text-shadow: var')
      const hint = source.match(/\.lq-arrival-hint \{([^}]*)\}/)?.[1] ?? ''
      expect(hint).not.toContain('opacity')
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
