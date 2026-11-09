// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import PressRing from './PressRing.vue'
import type { ActionContext } from '@/lantern/actions'
import type { AreaThing } from '@/lantern/areaThings'
import { ringActions } from '@/lantern/pressRing'

const ctx: ActionContext = {
  roomItems: [],
  characters: ['tilda'],
  inventory: ['rope', "Elior's Journal"],
  spells: ['light'],
  exits: {},
  wares: [{ name: 'Rope', price: 1, seller: 'tilda' }],
}
const tilda: AreaThing = {
  areaId: 'tilda',
  name: 'tilda',
  label: 'Tilda',
  kind: 'character',
}
const bucket: AreaThing = {
  areaId: 'bucket',
  name: 'bucket',
  label: 'Bucket',
  kind: 'item',
}

let wrappers: VueWrapper[] = []
afterEach(() => {
  for (const w of wrappers) w.unmount()
  wrappers = []
})

async function ring(thing: AreaThing = tilda): Promise<VueWrapper> {
  const wrapper = mount(PressRing, {
    attachTo: document.body,
    props: {
      thing,
      actions: ringActions(thing, ctx),
      at: { x: 300, y: 160 },
      bounds: { w: 568, h: 320 },
    },
  })
  wrappers.push(wrapper)
  await nextTick()
  return wrapper
}
const coin = (w: VueWrapper, id: string) => w.get(`[data-ring-action="${id}"]`)
const key = (w: VueWrapper, name: string, target?: Element) =>
  (target
    ? w.get('.lq-press-ring')
    : w.get('.lq-press-ring')
  ).element.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: name,
      bubbles: true,
      cancelable: true,
    }),
  )

describe('PressRing', () => {
  it('shows the name in the middle and a button with a word for each action, as a menu', async () => {
    const w = await ring()
    expect(w.get('.lq-ring-name').text()).toBe('Tilda')
    expect(w.get('.lq-ring-name').classes()).toContain('lq-ring-character')
    expect(w.get('[role="menu"]').attributes('aria-label')).toBe('Tilda')
    expect(
      w
        .findAll('.lq-ring-coin')
        .map((b) => b.element.childNodes[1].textContent),
    ).toEqual(
      expect.arrayContaining(['Talk to', 'Say…', 'Buy…', 'Give…', 'Examine']),
    )
    expect(w.findAll('[role="menuitem"]')).toHaveLength(7)
  })

  it('focuses the first action when it opens', async () => {
    const w = await ring()
    expect(document.activeElement).toBe(coin(w, 'talk').element)
  })

  it('sends the command of an action at once', async () => {
    const w = await ring()
    await coin(w, 'examine').trigger('click')
    expect(w.emitted('pick')).toEqual([['examine tilda']])
  })

  it('lights an action with choices, dims the others and fans the choices out', async () => {
    const w = await ring()
    await coin(w, 'give').trigger('click')
    expect(coin(w, 'give').classes()).toContain('lq-ring-on')
    expect(coin(w, 'talk').classes()).toContain('lq-ring-dim')
    const pills = w.findAll('.lq-ring-fan [role="menuitem"]')
    expect(pills.map((p) => p.text())).toEqual(['Rope', "Elior's Journal"])
    expect(document.activeElement).toBe(pills[0].element)
    await pills[1].trigger('click')
    expect(w.emitted('pick')).toEqual([["give Elior's Journal to tilda"]])
  })

  it('shows the ware and its price in a Buy… fan', async () => {
    const w = await ring()
    await coin(w, 'buy').trigger('click')
    expect(w.get('.lq-ring-fan [role="menuitem"]').text()).toBe('Rope · 1 coin')
  })

  it('opens a words box for Say…, and sends nothing while it is empty', async () => {
    const w = await ring()
    await coin(w, 'say').trigger('click')
    const input = w.get<HTMLInputElement>('.lq-ring-say input')
    expect(input.attributes('placeholder')).toBe('words…')
    expect(document.activeElement).toBe(input.element)
    await w.get('.lq-ring-say').trigger('submit')
    expect(w.emitted('pick')).toBeUndefined()
    await input.setValue('hello there')
    await w.get('.lq-ring-say').trigger('submit')
    expect(w.emitted('pick')).toEqual([['say hello there to tilda']])
  })

  it('steps back from a fan to the ring with Escape, then closes', async () => {
    const w = await ring()
    await coin(w, 'give').trigger('click')
    key(w, 'Escape')
    await w.vm.$nextTick()
    expect(w.find('.lq-ring-fan').exists()).toBe(false)
    expect(coin(w, 'give').classes()).not.toContain('lq-ring-on')
    expect(w.emitted('close')).toBeUndefined()
    key(w, 'Escape')
    expect(w.emitted('close')).toEqual([[true]])
  })

  it('closes on Tab', async () => {
    const w = await ring()
    key(w, 'Tab')
    expect(w.emitted('close')).toEqual([[true]])
  })

  it('goes round the ring with the arrow keys and up and down a fan', async () => {
    const w = await ring()
    key(w, 'ArrowRight')
    expect(document.activeElement).toBe(coin(w, 'say').element)
    key(w, 'ArrowLeft')
    key(w, 'ArrowLeft')
    expect(document.activeElement).toBe(coin(w, 'examine').element)
    await coin(w, 'give').trigger('click')
    const pills = w.findAll('.lq-ring-fan [role="menuitem"]')
    key(w, 'ArrowDown')
    expect(document.activeElement).toBe(pills[1].element)
    key(w, 'ArrowUp')
    expect(document.activeElement).toBe(pills[0].element)
  })

  it('closes on a press outside, and lets that press do nothing else', async () => {
    const w = await ring()
    const seen: string[] = []
    const probe = document.createElement('button')
    probe.addEventListener('click', () => seen.push('clicked'))
    document.body.append(probe)
    probe.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    probe.click()
    probe.click()
    probe.remove()
    expect(w.emitted('close')).toEqual([[false]])
    expect(seen).toEqual(['clicked'])
  })

  it('leaves a press inside the ring alone', async () => {
    const w = await ring(bucket)
    coin(w, 'take').element.dispatchEvent(
      new Event('pointerdown', { bubbles: true }),
    )
    expect(w.emitted('close')).toBeUndefined()
  })

  it('keeps room in the fan for the curve, so the longest name is not cut short', () => {
    const source = readFileSync(resolve(__dirname, 'PressRing.vue'), 'utf8')
    expect(source).toMatch(/\.lq-ring-pill \{[^}]*max-width: 100%/s)
    expect(source).toMatch(/\.lq-ring-fan-right \{[^}]*padding-right: 12px/s)
    expect(source).toMatch(/\.lq-ring-fan-left \{[^}]*padding-left: 12px/s)
  })
})
