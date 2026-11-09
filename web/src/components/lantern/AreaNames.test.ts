// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import AreaNames from './AreaNames.vue'
import type { AreaThing } from '@/lantern/areaThings'

const things: AreaThing[] = [
  { areaId: 'villager', label: 'Tilda', kind: 'character' },
  { areaId: 'bucket', label: 'Bucket', kind: 'item' },
  { areaId: 'scenery-x-fountain', label: 'Fountain', kind: 'scenery' },
  {
    areaId: 'exit-north',
    label: '↑ Mira’s Hut',
    kind: 'exit',
    direction: 'north',
  },
  { areaId: 'unplaced', label: 'Nowhere', kind: 'item' },
]
/** Boxes on a 1920×1080 picture shown on a 960×540 stage (half size). */
const boxes = {
  villager: { x: 0.1, y: 0.4, width: 0.1, height: 0.2 },
  bucket: { x: 0.8, y: 0.7, width: 0.1, height: 0.1 },
  'scenery-x-fountain': { x: 0.4, y: 0.4, width: 0.2, height: 0.2 },
  'exit-north': { x: 0.45, y: 0.05, width: 0.1, height: 0.1 },
}

let wrappers: VueWrapper[] = []

/** Mount over a 960×540 stage; `words` is an optional rectangle of words over the picture. */
function mountNames(
  props: Partial<InstanceType<typeof AreaNames>['$props']> = {},
): VueWrapper {
  const stage = document.createElement('div')
  stage.className = 'lq-stage'
  document.body.append(stage)
  const wrapper = mount(AreaNames, {
    attachTo: stage,
    props: {
      things,
      boxes,
      pictureSize: { width: 1920, height: 1080 },
      showing: false,
      pointer: null,
      ...props,
    },
  })
  wrappers.push(wrapper)
  return wrapper
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(960)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(540)
})
afterEach(() => {
  for (const wrapper of wrappers) wrapper.unmount()
  wrappers = []
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('AreaNames', () => {
  it('shows nothing until asked, and is hidden from assistive technology', () => {
    const w = mountNames()
    expect(w.find('[data-area-mark]').exists()).toBe(false)
    expect(w.find('[data-area-name]').exists()).toBe(false)
    expect(w.attributes('aria-hidden')).toBe('true')
  })

  it('shows a mark and a name for each placed thing, coloured by kind', async () => {
    const w = mountNames({ showing: true })
    await nextTick()
    expect(w.findAll('[data-area-mark]')).toHaveLength(4)
    expect(w.get('[data-area-name="villager"]').classes()).toContain(
      'lq-area-character',
    )
    expect(w.get('[data-area-name="bucket"]').classes()).toContain(
      'lq-area-item',
    )
    expect(w.get('[data-area-name="exit-north"]').classes()).toContain(
      'lq-area-exit',
    )
    expect(w.get('[data-area-name="scenery-x-fountain"]').text()).toBe(
      'Fountain',
    )
    expect(w.find('[data-area-name="unplaced"]').exists()).toBe(false)
  })

  it('puts the mark at the middle of the thing', async () => {
    const w = mountNames({ showing: true })
    await nextTick()
    const style = w.get('[data-area-mark="bucket"]').attributes('style')
    expect(style).toContain('left: 816px')
    expect(style).toContain('top: 405px')
  })

  it('names the one thing under the pointer, and nothing over nothing', async () => {
    const w = mountNames({ pointer: { x: 140, y: 250 } })
    await nextTick()
    expect(w.get('[data-area-pointer]').text()).toBe('Tilda')
    await w.setProps({ pointer: { x: 700, y: 100 } })
    expect(w.find('[data-area-pointer]').exists()).toBe(false)
  })

  it('puts the pointer name under the pointer, and above it near the foot', async () => {
    const w = mountNames({ pointer: { x: 140, y: 250 } })
    await nextTick()
    const top = (): number =>
      parseFloat(
        /top: ([\d.]+)px/.exec(
          w.get('[data-area-pointer]').attributes('style') ?? '',
        )![1],
      )
    expect(top()).toBeGreaterThan(250)
    await w.setProps({
      pointer: { x: 480, y: 520 },
      boxes: {
        ...boxes,
        bucket: { x: 0.4, y: 0.9, width: 0.2, height: 0.1 },
      },
    })
    await nextTick()
    expect(top()).toBeLessThan(520)
  })

  describe('with an action bar over the foot', () => {
    const atTheFoot = {
      ...boxes,
      bucket: { x: 0.4, y: 0.8, width: 0.2, height: 0.2 },
    }
    /** The pixels of a style's `left` or `top`. */
    const px = (style: string | undefined, side: string): number =>
      parseFloat(new RegExp(`${side}: ([\\d.]+)px`).exec(style ?? '')![1])

    it('hangs the pointer name above the pointer just over the bar, clear of it', async () => {
      const w = mountNames({
        footCover: 73,
        boxes: atTheFoot,
        pointer: { x: 480, y: 452 },
      })
      await nextTick()
      const top = px(w.get('[data-area-pointer]').attributes('style'), 'top')
      expect(top).toBeLessThan(452)
      expect(top + 25).toBeLessThanOrEqual(540 - 73)
    })

    it('puts the mark of a thing partly behind the bar on the part in view', async () => {
      const w = mountNames({ showing: true, footCover: 73, boxes: atTheFoot })
      await nextTick()
      const y = px(
        w.get('[data-area-mark="bucket"]').attributes('style'),
        'top',
      )
      expect(y).toBeLessThan(540 - 73)
    })

    it('has no mark or name for a thing wholly behind the bar', async () => {
      const w = mountNames({
        showing: true,
        footCover: 73,
        boxes: {
          ...boxes,
          bucket: { x: 0.4, y: 0.9, width: 0.2, height: 0.1 },
        },
      })
      await nextTick()
      expect(w.find('[data-area-mark="bucket"]').exists()).toBe(false)
      expect(w.find('[data-area-name="bucket"]').exists()).toBe(false)
    })
  })

  it('keeps a name clear of the edge the drift pulls past the picture', async () => {
    const w = mountNames({
      pointer: { x: 3, y: 270 },
      boxes: { ...boxes, villager: { x: 0, y: 0.4, width: 0.1, height: 0.2 } },
    })
    await nextTick()
    const style = w.get('[data-area-pointer]').attributes('style') ?? ''
    expect(parseFloat(/left: ([\d.]+)px/.exec(style)![1])).toBeGreaterThan(18)
  })

  it('adds no second name under the pointer while everything is shown', async () => {
    const w = mountNames({ showing: true, pointer: { x: 140, y: 250 } })
    await nextTick()
    expect(w.find('[data-area-pointer]').exists()).toBe(false)
  })

  it('moves a crowded name apart with a line back to its mark', async () => {
    const w = mountNames({
      showing: true,
      things: [
        { areaId: 'a', label: 'Notice Board', kind: 'scenery' },
        { areaId: 'b', label: 'Old Notice', kind: 'item' },
      ],
      boxes: {
        a: { x: 0.5, y: 0.5, width: 0.02, height: 0.02 },
        b: { x: 0.505, y: 0.505, width: 0.02, height: 0.02 },
      },
    })
    await nextTick()
    expect(w.find('line').exists()).toBe(true)
  })

  it('never takes a click or focus', () => {
    const w = mountNames({ showing: true })
    expect(w.find('button, a, [tabindex]').exists()).toBe(false)
  })

  describe('under the words', () => {
    /** Words covering the left third of the stage (the picture's own pixels), as the rectangle the browser would report. */
    function wordsOver(selector: string): HTMLElement {
      const words = document.createElement('div')
      words.className = selector
      document.querySelector('.lq-stage')!.append(words)
      vi.spyOn(words, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 320,
        height: 540,
        right: 320,
        bottom: 540,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      })
      return words
    }

    it.each(['lq-story-wrap', 'lq-arrival-card', 'lq-ln'])(
      'has neither mark nor name for a thing under %s, until it goes',
      async (selector) => {
        const w = mountNames({ showing: true })
        const words = wordsOver(selector)
        await w.setProps({ relayout: 'words' })
        await new Promise((resolve) => setTimeout(resolve, 400))
        await nextTick()
        expect(w.find('[data-area-mark="villager"]').exists()).toBe(false)
        expect(w.find('[data-area-mark="bucket"]').exists()).toBe(true)
        words.remove()
        await w.setProps({ relayout: 'gone' })
        await new Promise((resolve) => setTimeout(resolve, 400))
        await nextTick()
        expect(w.find('[data-area-mark="villager"]').exists()).toBe(true)
      },
    )
  })

  it('reads the pointer against the drifted picture, not the bare stage', async () => {
    const w = mountNames({ pointer: null })
    // At the drift's peak the layer is 3% larger and shifted.
    vi.spyOn(w.element, 'getBoundingClientRect').mockReturnValue({
      left: -14.4,
      top: -8,
      width: 988.8,
      height: 556.2,
      right: 974.4,
      bottom: 548.2,
      x: -14.4,
      y: -8,
      toJSON: () => ({}),
    })
    // The villager's box ends at 192 in the layer's pixels; 195 is just right of it.
    await w.setProps({ pointer: { x: -14.4 + 195 * 1.03, y: -8 + 250 * 1.03 } })
    expect(w.find('[data-area-pointer]').exists()).toBe(false)
    await w.setProps({ pointer: { x: -14.4 + 150 * 1.03, y: -8 + 250 * 1.03 } })
    expect(w.get('[data-area-pointer]').text()).toBe('Tilda')
  })

  it('fades under the stylesheet’s motion setting, which Reduce motion sets to nothing', () => {
    const source = readFileSync(resolve(__dirname, 'AreaNames.vue'), 'utf8')
    expect(source).toMatch(
      /\.lq-area-enter-active[^}]*transition: opacity calc\(0\.2s \* var\(--lq-motion\)\)/s,
    )
  })
})

describe('AreaNames ways out', () => {
  const closedWays: AreaThing[] = [
    { areaId: 'exit-west', label: '', kind: 'exit', direction: 'west' },
  ]
  const wayBoxes = {
    ...boxes,
    'exit-west': { x: 0.0, y: 0.45, width: 0.1, height: 0.1 },
  }

  it('says which way a screen point presses: an open way, a closed way, or none', async () => {
    const w = mountNames({ closedWays, boxes: wayBoxes })
    await nextTick()
    const way = (x: number, y: number) =>
      (w.vm as unknown as { wayAt(x: number, y: number): unknown }).wayAt(x, y)
    // The north way at (0.45..0.55, 0.05..0.15) of 960×540.
    expect(way(480, 54)).toEqual({ direction: 'north', open: true })
    expect(way(20, 270)).toEqual({ direction: 'west', open: false })
    // A thing, and bare painting, are no way.
    expect(way(480, 270)).toBeNull()
    expect(way(700, 100)).toBeNull()
  })

  it('makes only the marks and names of ways out pressable, naming their direction', async () => {
    const w = mountNames({ showing: true })
    await nextTick()
    expect(w.get('[data-area-name="exit-north"]').attributes('data-way')).toBe(
      'north',
    )
    expect(w.get('[data-area-mark="exit-north"]').attributes('data-way')).toBe(
      'north',
    )
    expect(w.get('[data-area-name="bucket"]').attributes('data-way')).toBe(
      undefined,
    )
    expect(w.get('[data-area-mark="villager"]').attributes('data-way')).toBe(
      undefined,
    )
  })

  it('says when the pointer is over an open way, and not over a closed one', async () => {
    const w = mountNames({ closedWays, boxes: wayBoxes })
    await w.setProps({ pointer: { x: 480, y: 54 } })
    expect(w.emitted('pointing')?.at(-1)).toEqual(['north'])
    await w.setProps({ pointer: { x: 20, y: 270 } })
    expect(w.emitted('pointing')?.at(-1)).toEqual([null])
    await w.setProps({ pointer: { x: 480, y: 54 } })
    await w.setProps({ pointer: null })
    expect(w.emitted('pointing')?.at(-1)).toEqual([null])
  })
})
