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
  { areaId: 'villager', name: 'villager', label: 'Tilda', kind: 'character' },
  { areaId: 'bucket', name: 'bucket', label: 'Bucket', kind: 'item' },
  {
    areaId: 'scenery-x-fountain',
    name: 'scenery-x-fountain',
    label: 'Fountain',
    kind: 'scenery',
  },
  {
    areaId: 'exit-north',
    name: 'north',
    label: '↑ Mira’s Hut',
    kind: 'exit',
    direction: 'north',
  },
  { areaId: 'unplaced', name: 'unplaced', label: 'Nowhere', kind: 'item' },
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
  vi.unstubAllGlobals()
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

  describe('with a mark point chosen in the studio', () => {
    const marked = {
      ...boxes,
      bucket: { ...boxes.bucket, mark: { x: 0.85, y: 0.72 } },
    }

    it('puts the mark on the point, the rest at their middles', async () => {
      const w = mountNames({ showing: true, boxes: marked })
      await nextTick()
      const style = w.get('[data-area-mark="bucket"]').attributes('style')
      expect(style).toContain('left: 816px')
      expect(style).toContain('top: 388.8px')
      expect(
        w.get('[data-area-mark="villager"]').attributes('style'),
      ).toContain('left: 144px')
    })

    it('starts a moved name’s line at the moved mark', async () => {
      const w = mountNames({
        showing: true,
        things: [
          { areaId: 'a', name: 'a', label: 'Notice Board', kind: 'scenery' },
          { areaId: 'b', name: 'b', label: 'Old Notice', kind: 'item' },
          { areaId: 'c', name: 'c', label: 'Third Notice', kind: 'item' },
        ],
        boxes: {
          c: {
            x: 0.4,
            y: 0.4,
            width: 0.2,
            height: 0.2,
            mark: { x: 0.5, y: 0.5 },
          },
          a: {
            x: 0.4,
            y: 0.4,
            width: 0.2,
            height: 0.2,
            mark: { x: 0.5, y: 0.5 },
          },
          b: {
            x: 0.4,
            y: 0.4,
            width: 0.2,
            height: 0.2,
            mark: { x: 0.5, y: 0.5 },
          },
        },
      })
      await nextTick()
      // The three marks share a point, so they now stand a mark's width apart
      // (480, 504, 528); a line starts at the mark whose name had to move.
      const marksX = ['a', 'b', 'c'].map((id) =>
        parseFloat(
          /left: ([\d.]+)px/.exec(
            w.get(`[data-area-mark="${id}"]`).attributes('style') ?? '',
          )![1],
        ),
      )
      expect([...marksX].sort((p, q) => p - q)).toEqual([480, 504, 528])
      const starts = w
        .findAll('line')
        .map((line) => Number(line.attributes('x1')))
      expect(starts.length).toBeGreaterThan(0)
      for (const x of starts) expect(marksX).toContain(x)
      expect(Number(w.get('line').attributes('y1'))).toBeCloseTo(270, 3)
    })

    it('shows a focused thing at the same spot as when all are shown', async () => {
      const all = mountNames({ showing: true, boxes: marked })
      const one = mountNames({ focused: 'bucket', boxes: marked })
      await nextTick()
      expect(one.get('[data-area-mark="bucket"]').attributes('style')).toBe(
        all.get('[data-area-mark="bucket"]').attributes('style'),
      )
      expect(one.get('[data-area-name="bucket"]').attributes('style')).toBe(
        all.get('[data-area-name="bucket"]').attributes('style'),
      )
    })
  })

  it('shows a focused thing where its neighbours put it, not alone', async () => {
    const pair: AreaThing[] = [
      { areaId: 'a', name: 'a', label: 'Notice Board', kind: 'scenery' },
      { areaId: 'b', name: 'b', label: 'Old Notice', kind: 'item' },
    ]
    const boxes = {
      a: { x: 0.5, y: 0.5, width: 0.02, height: 0.02 },
      b: { x: 0.505, y: 0.505, width: 0.02, height: 0.02 },
    }
    const all = mountNames({ showing: true, things: pair, boxes })
    const one = mountNames({ focused: 'b', things: pair, boxes })
    await nextTick()
    expect(one.get('[data-area-name="b"]').attributes('style')).toBe(
      all.get('[data-area-name="b"]').attributes('style'),
    )
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
        { areaId: 'a', name: 'a', label: 'Notice Board', kind: 'scenery' },
        { areaId: 'b', name: 'b', label: 'Old Notice', kind: 'item' },
        { areaId: 'c', name: 'c', label: 'Third Notice', kind: 'item' },
      ],
      boxes: {
        c: { x: 0.503, y: 0.503, width: 0.02, height: 0.02 },
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
    it('judges a thing by its mark, not the middle of its rectangle', async () => {
      const w = mountNames({
        showing: true,
        boxes: {
          ...boxes,
          // Middle under the words, point clear of them: shown.
          villager: {
            x: 0.1,
            y: 0.4,
            width: 0.4,
            height: 0.2,
            mark: { x: 0.45, y: 0.5 },
          },
          // Middle clear of the words, point under them: waits.
          bucket: {
            x: 0.1,
            y: 0.7,
            width: 0.5,
            height: 0.1,
            mark: { x: 0.15, y: 0.75 },
          },
        },
      })
      wordsOver('lq-story-wrap')
      await w.setProps({ relayout: 'words' })
      await new Promise((resolve) => setTimeout(resolve, 400))
      await nextTick()
      expect(w.find('[data-area-mark="villager"]').exists()).toBe(true)
      expect(w.find('[data-area-mark="bucket"]').exists()).toBe(false)
    })

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

    it('shows a thing again once the words over it at mount have faded (rq-fy44)', async () => {
      // The stage coming back: the words folded away for the names are still fading out when the layer is put on the page.
      const stage = document.createElement('div')
      stage.className = 'lq-stage'
      document.body.append(stage)
      const words = wordsOver('lq-story-wrap')
      const w = mount(AreaNames, {
        attachTo: stage,
        props: {
          things,
          boxes,
          pictureSize: { width: 1920, height: 1080 },
          showing: true,
          pointer: null,
        },
      })
      wrappers.push(w)
      await nextTick()
      expect(w.find('[data-area-mark="villager"]').exists()).toBe(false)
      // Faded, with nothing else changing.
      words.style.visibility = 'hidden'
      await new Promise((resolve) => setTimeout(resolve, 400))
      await nextTick()
      expect(w.find('[data-area-mark="villager"]').exists()).toBe(true)
    })
  })

  describe('under the room plate', () => {
    /** A plate over (0..300, 200..340) of the stage, the villager's mark (144, 216) at its top. */
    function plateOver(selector: string, top = 200, height = 140): HTMLElement {
      const el = document.createElement('div')
      el.className = selector
      document.querySelector('.lq-stage')!.append(el)
      setRect(el, top, height)
      return el
    }
    function setRect(el: HTMLElement, top: number, height: number): void {
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top,
        width: 300,
        height,
        right: 300,
        bottom: top + height,
        x: 0,
        y: top,
        toJSON: () => ({}),
      })
    }
    const top = (w: VueWrapper, selector: string): number =>
      parseFloat(
        /top: ([\d.]+)px/.exec(w.get(selector).attributes('style') ?? '')![1],
      )

    it('steps the mark just below the plate, its name beside it, the line ending at the mark', async () => {
      const w = mountNames({ showing: true })
      plateOver('lq-phone-plate')
      await w.setProps({ relayout: 'plate' })
      await new Promise((resolve) => setTimeout(resolve, 400))
      await nextTick()
      expect(top(w, '[data-area-mark="villager"]')).toBeGreaterThanOrEqual(
        340 + 8,
      )
      expect(
        w.get('[data-area-name="villager"]').attributes('style'),
      ).toContain('left:')
    })

    it('draws the line of a moved name to the moved mark, and a press on that mark is a press on its thing', async () => {
      const w = mountNames({ showing: true })
      plateOver('lq-phone-plate')
      await w.setProps({ relayout: 'plate' })
      await new Promise((resolve) => setTimeout(resolve, 400))
      await nextTick()
      const markY = top(w, '[data-area-mark="villager"]')
      const lines = w.findAll('.lq-area-lines line')
      for (const line of lines) {
        const y1 = parseFloat(line.attributes('y1')!)
        expect(y1).toBeGreaterThanOrEqual(340)
      }
      await w
        .get('[data-area-mark="villager"]')
        .trigger('click', { clientX: 1, clientY: markY })
      expect(w.emitted('press')?.[0][0]).toEqual(things[0])
    })

    it('steps a mark under a corner button clear of it too', async () => {
      const w = mountNames({ showing: true })
      const stage = document.querySelector('.lq-stage')!
      const group = document.createElement('div')
      group.className = 'lq-stage-buttons'
      const button = document.createElement('button')
      group.append(button)
      stage.append(group)
      setRect(button, 200, 140)
      await w.setProps({ relayout: 'button' })
      await new Promise((resolve) => setTimeout(resolve, 400))
      await nextTick()
      expect(top(w, '[data-area-mark="villager"]')).toBeGreaterThanOrEqual(
        340 + 8,
      )
    })

    it('puts two unmoved marks a mark’s width apart, and two dots above the Show tab side by side, Table on the left', async () => {
      const pairT: AreaThing[] = [
        { areaId: 'table', name: 'table', label: 'Table', kind: 'scenery' },
        { areaId: 'bread', name: 'bread', label: 'Bread', kind: 'item' },
      ]
      const pairBoxes = {
        table: { x: 0.14, y: 0.5, width: 0.02, height: 0.02 },
        bread: { x: 0.145, y: 0.5, width: 0.02, height: 0.02 },
      }
      const w = mountNames({ showing: true, things: pairT, boxes: pairBoxes })
      await nextTick()
      const at = (id: string): [number, number] => {
        const style =
          w.get(`[data-area-mark="${id}"]`).attributes('style') ?? ''
        return [
          parseFloat(/left: ([\d.]+)px/.exec(style)![1]),
          parseFloat(/top: ([\d.]+)px/.exec(style)![1]),
        ]
      }
      const [tx, ty] = at('table')
      const [bx, by] = at('bread')
      expect(Math.hypot(bx - tx, by - ty)).toBeGreaterThanOrEqual(23.5)
      expect(tx).toBeLessThan(bx)
      // Over the Show tab as well: both step out from under it, still apart.
      plateOver('lq-paper-tab', 240, 80)
      await w.setProps({ relayout: 'tab' })
      await new Promise((resolve) => setTimeout(resolve, 400))
      await nextTick()
      const [tx2, ty2] = at('table')
      const [bx2, by2] = at('bread')
      // The tab spans 240..320; a mark stands at least 12 px outside it.
      expect(ty2 <= 240 - 12 || ty2 >= 320 + 12).toBe(true)
      expect(Math.hypot(bx2 - tx2, by2 - ty2)).toBeGreaterThanOrEqual(23.5)
      expect(tx2).toBeLessThan(bx2)
    })

    it.each(['lq-words-hide', 'lq-paper-tab'])(
      'steps a mark under the story’s Hide/Show tab (%s) clear of it too',
      async (tab) => {
        const w = mountNames({ showing: true })
        plateOver(tab)
        await w.setProps({ relayout: 'tab' })
        await new Promise((resolve) => setTimeout(resolve, 400))
        await nextTick()
        expect(top(w, '[data-area-mark="villager"]')).toBeGreaterThanOrEqual(
          340 + 8,
        )
      },
    )

    it('steps a mark under the Show what’s here / Showing button clear of it too', async () => {
      const w = mountNames({ showing: true })
      plateOver('lq-show-names')
      await w.setProps({ relayout: 'show-names' })
      await new Promise((resolve) => setTimeout(resolve, 400))
      await nextTick()
      expect(top(w, '[data-area-mark="villager"]')).toBeGreaterThanOrEqual(
        340 + 8,
      )
    })

    it('steps a mark under the Showing button in the picture’s foot corner up or aside, never off the picture', async () => {
      // The button sits at the foot's right (780..950, 506..534); the villager's mark lies under it.
      const w = mountNames({
        showing: true,
        boxes: {
          ...boxes,
          villager: { x: 0.88, y: 0.9, width: 0.04, height: 0.08 },
        },
      })
      const button = document.createElement('button')
      button.className = 'lq-show-names'
      document.querySelector('.lq-stage')!.append(button)
      vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
        left: 780,
        top: 506,
        width: 170,
        height: 28,
        right: 950,
        bottom: 534,
        x: 780,
        y: 506,
        toJSON: () => ({}),
      })
      await w.setProps({ relayout: 'show-names' })
      await new Promise((resolve) => setTimeout(resolve, 400))
      await nextTick()
      const style = w.get('[data-area-mark="villager"]').attributes('style')
      const x = parseFloat(/left: ([\d.]+)px/.exec(style ?? '')![1])
      const y = parseFloat(/top: ([\d.]+)px/.exec(style ?? '')![1])
      expect(y <= 506 - 8 || x <= 780 - 8 || x >= 950 + 8).toBe(true)
      expect(y).toBeLessThanOrEqual(540)
    })

    it('steps a mark under the Hide tab beside it, not up under the open words', async () => {
      // What can be seen ends at 300; the tab (250..290) sits at its foot, the words end just above it, edge to edge.
      const w = mountNames({ showing: true, footCover: 240 })
      plateOver('lq-words-hide', 250, 40)
      const words = document.createElement('div')
      words.className = 'lq-story-wrap'
      document.querySelector('.lq-stage')!.append(words)
      vi.spyOn(words, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 960,
        height: 244,
        right: 960,
        bottom: 244,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      })
      await w.setProps({ relayout: 'words' })
      await new Promise((resolve) => setTimeout(resolve, 400))
      await nextTick()
      const style = w.get('[data-area-mark="villager"]').attributes('style')
      const left = parseFloat(/left: ([\d.]+)px/.exec(style ?? '')![1])
      expect(left).toBeGreaterThanOrEqual(300 + 8)
    })

    it('puts the mark back when the plate no longer covers it, and moves it when the plate grows', async () => {
      const w = mountNames({ showing: true })
      const plate = plateOver('lq-stage-plate', 200, 40)
      await w.setProps({ relayout: 'a' })
      await new Promise((resolve) => setTimeout(resolve, 400))
      await nextTick()
      expect(top(w, '[data-area-mark="villager"]')).toBeGreaterThanOrEqual(
        240 + 8,
      )
      setRect(plate, 0, 20)
      await w.setProps({ relayout: 'b' })
      await new Promise((resolve) => setTimeout(resolve, 400))
      await nextTick()
      expect(top(w, '[data-area-mark="villager"]')).toBe(270)
    })

    it('watches the plate itself, so a plate that grows moves the marks at once', async () => {
      const observed: Element[] = []
      let notify: () => void = () => {}
      vi.stubGlobal(
        'ResizeObserver',
        class {
          constructor(callback: () => void) {
            notify = callback
          }
          observe(el: Element): void {
            observed.push(el)
          }
          unobserve(): void {}
          disconnect(): void {}
        },
      )
      const w = mountNames({ showing: true })
      const plate = plateOver('lq-phone-plate', 0, 20)
      await w.setProps({ relayout: 'plate' })
      await nextTick()
      expect(observed).toContain(plate)
      expect(top(w, '[data-area-mark="villager"]')).toBe(270)
      setRect(plate, 200, 140)
      notify()
      await nextTick()
      expect(top(w, '[data-area-mark="villager"]')).toBeGreaterThanOrEqual(
        340 + 8,
      )
    })

    describe('two things under the plate', () => {
      const pair: AreaThing[] = [
        {
          areaId: 'shelves',
          name: 'shelves',
          label: 'Shelves',
          kind: 'scenery',
        },
        { areaId: 'books', name: 'books', label: 'Books', kind: 'scenery' },
      ]
      const pairBoxes = {
        shelves: { x: 0.1, y: 0.45, width: 0.02, height: 0.02 },
        books: { x: 0.112, y: 0.45, width: 0.02, height: 0.02 },
      }
      const left = (w: VueWrapper, id: string): number =>
        parseFloat(
          /left: ([\d.]+)px/.exec(
            w.get(`[data-area-mark="${id}"]`).attributes('style') ?? '',
          )![1],
        )

      it('stand side by side, a mark’s width of space apart, the left thing’s mark first', async () => {
        const w = mountNames({ showing: true, things: pair, boxes: pairBoxes })
        plateOver('lq-phone-plate')
        await w.setProps({ relayout: 'plate' })
        await new Promise((resolve) => setTimeout(resolve, 400))
        await nextTick()
        expect(top(w, '[data-area-mark="books"]')).toBe(
          top(w, '[data-area-mark="shelves"]'),
        )
        expect(left(w, 'books') - left(w, 'shelves')).toBeGreaterThanOrEqual(24)
      })

      it('show the focused one alone at the same spot as with everything showing', async () => {
        const all = mountNames({
          showing: true,
          things: pair,
          boxes: pairBoxes,
        })
        plateOver('lq-phone-plate')
        await all.setProps({ relayout: 'plate' })
        await new Promise((resolve) => setTimeout(resolve, 400))
        await nextTick()
        const spot = left(all, 'books')
        all.unmount()
        document.body.innerHTML = ''
        const one = mountNames({
          showing: false,
          focused: 'books',
          things: pair,
          boxes: pairBoxes,
        })
        plateOver('lq-phone-plate')
        await one.setProps({ relayout: 'plate' })
        await new Promise((resolve) => setTimeout(resolve, 400))
        await nextTick()
        expect(left(one, 'books')).toBe(spot)
      })
    })

    it('marks the thing with keyboard focus clear of the plate as well', async () => {
      const w = mountNames({ showing: false, focused: 'villager' })
      plateOver('lq-phone-plate')
      await w.setProps({ relayout: 'plate' })
      await new Promise((resolve) => setTimeout(resolve, 400))
      await nextTick()
      expect(top(w, '[data-area-mark="villager"]')).toBeGreaterThanOrEqual(
        340 + 8,
      )
    })
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

  it('shows the mark and name of the thing that has keyboard focus, names or not', async () => {
    const w = mountNames({ focused: 'bucket' })
    await nextTick()
    expect(w.findAll('[data-area-mark]')).toHaveLength(1)
    expect(w.get('[data-area-name="bucket"]').text()).toBe('Bucket')
    await w.setProps({ focused: null })
    await nextTick()
    expect(w.find('[data-area-name]').exists()).toBe(false)
  })

  it('names a thing once when it has keyboard focus and the pointer is on it', async () => {
    const w = mountNames({ focused: 'villager', pointer: { x: 140, y: 250 } })
    await nextTick()
    expect(w.findAll('.lq-area-name').map((name) => name.text())).toEqual([
      'Tilda',
    ])
    expect(w.find('[data-area-pointer]').exists()).toBe(false)
  })

  it('still names what the pointer is on when focus is on something else, and once focus has left', async () => {
    const w = mountNames({ focused: 'bucket', pointer: { x: 140, y: 250 } })
    await nextTick()
    expect(w.get('[data-area-pointer]').text()).toBe('Tilda')
    expect(w.get('[data-area-name="bucket"]').text()).toBe('Bucket')
    await w.setProps({ focused: 'villager' })
    expect(w.find('[data-area-pointer]').exists()).toBe(false)
    await w.setProps({ focused: null })
    expect(w.get('[data-area-pointer]').text()).toBe('Tilda')
  })

  it('takes a press on a mark or a name as a press on its thing, and not on a way out', async () => {
    const w = mountNames({ showing: true })
    await nextTick()
    await w
      .get('[data-area-name="bucket"]')
      .trigger('click', { clientX: 5, clientY: 6 })
    await w
      .get('[data-area-mark="villager"]')
      .trigger('click', { clientX: 7, clientY: 8 })
    await w.get('[data-area-name="exit-north"]').trigger('click')
    expect(w.emitted('press')).toEqual([
      [things[1], { x: 5, y: 6 }, true],
      [things[0], { x: 7, y: 8 }, true],
    ])
  })

  it('lets a mark or a name be pressed, a hand over them', () => {
    const source = readFileSync(resolve(__dirname, 'AreaNames.vue'), 'utf8')
    expect(source).toMatch(/\.lq-area-live[^}]*pointer-events: auto/s)
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
    {
      areaId: 'exit-west',
      name: 'exit-west',
      label: '',
      kind: 'exit',
      direction: 'west',
    },
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

  it('has no pointer name while a ring is open, and still says the way under the pointer', async () => {
    const w = mountNames({ ringOpen: true })
    await w.setProps({ pointer: { x: 480, y: 54 } })
    expect(w.find('[data-area-pointer]').exists()).toBe(false)
    expect(w.emitted('pointing')?.at(-1)).toEqual(['north'])
  })
})
