// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import AreaPress from './AreaPress.vue'
import type { AreaThing } from '@/lantern/areaThings'

const things: AreaThing[] = [
  { areaId: 'bucket', name: 'bucket', label: 'Bucket', kind: 'item' },
  { areaId: 'villager', name: 'villager', label: 'Tilda', kind: 'character' },
  {
    areaId: 'scenery-board',
    name: 'board',
    label: 'Notice Board',
    kind: 'scenery',
  },
  {
    areaId: 'old-notice',
    name: 'old notice',
    label: 'Old Notice',
    kind: 'item',
  },
  {
    areaId: 'exit-north',
    name: 'north',
    label: '↑ Hut',
    kind: 'exit',
    direction: 'north',
    place: 'Hut',
  },
  { areaId: 'unplaced', name: 'unplaced', label: 'Nowhere', kind: 'item' },
]
/** On a 1920×1080 picture shown at half size (960×540). */
const boxes = {
  bucket: { x: 0.8, y: 0.7, width: 0.1, height: 0.1 },
  villager: { x: 0.1, y: 0.4, width: 0.1, height: 0.2 },
  'scenery-board': { x: 0.4, y: 0.2, width: 0.2, height: 0.3 },
  'old-notice': { x: 0.45, y: 0.25, width: 0.05, height: 0.08 },
  'exit-north': { x: 0.45, y: 0.05, width: 0.1, height: 0.1 },
}

let wrappers: VueWrapper[] = []
function mountPress(): VueWrapper {
  const wrapper = mount(AreaPress, {
    attachTo: document.body,
    props: { things, boxes, pictureSize: { width: 1920, height: 1080 } },
  })
  wrappers.push(wrapper)
  return wrapper
}

/** A click with the given `detail` (0 is what a key press makes). */
function click(
  w: VueWrapper,
  id: string,
  detail: number,
  x: number,
  y: number,
): void {
  w.get(`[data-area-press="${id}"]`).element.dispatchEvent(
    new MouseEvent('click', { bubbles: true, detail, clientX: x, clientY: y }),
  )
}

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(960)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(540)
})
afterEach(() => {
  for (const w of wrappers) w.unmount()
  wrappers = []
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('AreaPress', () => {
  it('has a button for each placed thing and person, left to right, then one for each way out', async () => {
    const w = mountPress()
    await nextTick()
    const stops = w.findAll('button')
    expect(stops.map((s) => s.attributes('aria-label'))).toEqual([
      'Tilda',
      'Notice Board',
      'Old Notice',
      'Bucket',
      'Go north to Hut',
    ])
    for (const stop of stops.slice(0, 4))
      expect(stop.attributes('aria-haspopup')).toBe('menu')
  })

  it('makes a way out a plain button that names its direction and presses nothing itself', async () => {
    const w = mountPress()
    await nextTick()
    const way = w.get('[data-area-press="exit-north"]')
    expect(way.attributes('data-way')).toBe('north')
    expect(way.attributes('aria-haspopup')).toBeUndefined()
    expect(way.attributes('tabindex')).toBe('-1')
    click(w, 'exit-north', 0, 0, 0)
    expect(w.emitted('press')).toBeUndefined()
  })

  it('puts a smaller thing over the larger one it lies on', async () => {
    const w = mountPress()
    await nextTick()
    const z = (id: string): number =>
      Number(
        /z-index: (\d+)/.exec(
          w.get(`[data-area-press="${id}"]`).attributes('style') ?? '',
        )?.[1],
      )
    expect(z('old-notice')).toBeGreaterThan(z('scenery-board'))
  })

  it('lies over the middle of each thing in view', async () => {
    const w = mountPress()
    await nextTick()
    const style = w.get('[data-area-press="bucket"]').attributes('style')
    expect(style).toContain('left: 768px')
    expect(style).toContain('top: 378px')
    expect(style).toContain('width: 96px')
    expect(style).toContain('height: 54px')
  })

  it('says which thing is pressed and where, in the screen’s pixels', async () => {
    const w = mountPress()
    await nextTick()
    click(w, 'bucket', 1, 50, 60)
    expect(w.emitted('press')?.[0]).toEqual([things[0], { x: 50, y: 60 }])
  })

  it('says a key press came from the keyboard, at the middle of the thing', async () => {
    const w = mountPress()
    await nextTick()
    click(w, 'villager', 0, 0, 0)
    const [thing, at] = w.emitted('press')?.[0] ?? []
    expect(thing).toEqual(things[1])
    expect(at).toEqual({ x: 0, y: 0 })
  })

  it('keeps the things out of the Tab order: the keyboard has F1 and the typing box', async () => {
    const w = mountPress()
    await nextTick()
    const hits = w.findAll('.lq-area-press-hit')
    expect(hits.length).toBeGreaterThan(0)
    for (const hit of hits) expect(hit.attributes('tabindex')).toBe('-1')
  })

  it('says nothing when a thing takes focus, so no mark or name shows for it', async () => {
    const w = mountPress()
    await nextTick()
    await w.get('[data-area-press="bucket"]').trigger('focus')
    await w.get('[data-area-press="bucket"]').trigger('blur')
    expect(w.emitted('focused')).toBeUndefined()
  })

  it('has no way-out button in a room with no way out', async () => {
    const w = mount(AreaPress, {
      attachTo: document.body,
      props: {
        things: things.filter((t) => t.kind !== 'exit'),
        boxes,
        pictureSize: { width: 1920, height: 1080 },
      },
    })
    wrappers.push(w)
    await nextTick()
    expect(w.findAll('[data-way]')).toHaveLength(0)
  })

  it('shows nothing for a room with nothing placed', async () => {
    const w = mount(AreaPress, {
      attachTo: document.body,
      props: { things, boxes: {}, pictureSize: { width: 1920, height: 1080 } },
    })
    wrappers.push(w)
    await nextTick()
    expect(w.findAll('button')).toHaveLength(0)
  })
})
