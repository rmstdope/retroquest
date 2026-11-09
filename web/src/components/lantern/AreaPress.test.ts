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
  { areaId: 'exit-north', name: 'north', label: '↑ Hut', kind: 'exit' },
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
  it('has a Tab stop for each placed thing and person, left to right, and none for a way out', async () => {
    const w = mountPress()
    await nextTick()
    const stops = w.findAll('button')
    expect(stops.map((s) => s.attributes('aria-label'))).toEqual([
      'Tilda',
      'Notice Board',
      'Old Notice',
      'Bucket',
    ])
    for (const stop of stops) {
      expect(stop.attributes('tabindex')).toBeUndefined()
      expect(stop.attributes('aria-haspopup')).toBe('menu')
    }
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

  it('says which thing a key put focus on, and when none has', async () => {
    const w = mountPress()
    await nextTick()
    const matches = HTMLElement.prototype.matches
    vi.spyOn(HTMLElement.prototype, 'matches').mockImplementation(function (
      this: HTMLElement,
      selector: string,
    ) {
      return selector === ':focus-visible' ? true : matches.call(this, selector)
    })
    await w.get('[data-area-press="bucket"]').trigger('focus')
    await w.get('[data-area-press="bucket"]').trigger('blur')
    expect(w.emitted('focused')).toEqual([['bucket'], [null]])
  })

  it('does not show a name for a thing a press put focus on', async () => {
    const w = mountPress()
    await nextTick()
    vi.spyOn(HTMLElement.prototype, 'matches').mockImplementation(() => false)
    await w.get('[data-area-press="bucket"]').trigger('focus')
    expect(w.emitted('focused')).toBeUndefined()
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
