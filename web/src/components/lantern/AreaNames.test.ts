// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import AreaNames from './AreaNames.vue'
import type { AreaThing } from '@/lantern/areaThings'

const things: AreaThing[] = [
  { areaId: 'villager', label: 'Tilda', kind: 'character' },
  { areaId: 'bucket', label: 'Bucket', kind: 'item' },
  { areaId: 'scenery-x-fountain', label: 'Fountain', kind: 'scenery' },
  { areaId: 'exit-north', label: '↑ Mira’s Hut', kind: 'exit' },
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
})
