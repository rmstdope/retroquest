// @vitest-environment jsdom
/** What lies over the room picture, read from the markers the elements carry. */
import { afterEach, describe, expect, it } from 'vitest'
import { obstacleElements, readObstacles } from './obstacles'

const FRAME = { left: 0, top: 0, ratio: 1 }

/** An element in `parent` whose box is `at` (jsdom lays nothing out, so the box is stubbed). */
function boxed(
  parent: HTMLElement,
  attrs: Record<string, string>,
  at: { x: number; y: number; w: number; h: number },
): HTMLElement {
  const el = document.createElement('div')
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
  el.getBoundingClientRect = (): DOMRect =>
    ({
      left: at.x,
      top: at.y,
      right: at.x + at.w,
      bottom: at.y + at.h,
      width: at.w,
      height: at.h,
    }) as DOMRect
  parent.append(el)
  return el
}

describe('readObstacles', () => {
  let scope: HTMLElement
  afterEach(() => scope?.remove())
  const mount = (): HTMLElement => {
    scope = document.createElement('div')
    document.body.append(scope)
    return scope
  }

  it('reads an element by its marker, whatever its class', () => {
    const s = mount()
    boxed(
      s,
      { class: 'never-heard-of-it', 'data-lq-obstacle': 'panel' },
      { x: 10, y: 20, w: 30, h: 40 },
    )
    const read = readObstacles(s, FRAME)
    expect(read.panels).toEqual([{ x: 10, y: 20, w: 30, h: 40 }])
    expect(read.all).toEqual(read.panels)
    expect(read.words).toEqual([])
  })

  it('sorts the kinds: panels, words and cards, and names-only keep-clear', () => {
    const s = mount()
    const at = { x: 0, y: 0, w: 5, h: 5 }
    boxed(s, { 'data-lq-obstacle': 'panel' }, at)
    boxed(s, { 'data-lq-obstacle': 'keep-clear' }, at)
    boxed(s, { 'data-lq-obstacle': 'words' }, at)
    const clip = boxed(s, { 'data-lq-clip': '' }, at)
    boxed(clip, { 'data-lq-obstacle': 'card' }, at)
    const read = readObstacles(s, FRAME)
    expect(read.panels).toHaveLength(1)
    expect(read.words).toHaveLength(2)
    expect(read.all).toHaveLength(4)
  })

  it('takes a card only where its clip shows it, and none outside a clip', () => {
    const s = mount()
    const clip = boxed(s, { 'data-lq-clip': '' }, { x: 0, y: 0, w: 100, h: 50 })
    boxed(clip, { 'data-lq-obstacle': 'card' }, { x: 20, y: 30, w: 40, h: 100 })
    boxed(s, { 'data-lq-obstacle': 'card' }, { x: 0, y: 0, w: 9, h: 9 })
    expect(readObstacles(s, FRAME).words).toEqual([
      { x: 20, y: 30, w: 40, h: 20 },
    ])
  })

  it('leaves out an element with no size and one that is hidden', () => {
    const s = mount()
    boxed(s, { 'data-lq-obstacle': 'panel' }, { x: 0, y: 0, w: 0, h: 10 })
    boxed(
      s,
      { 'data-lq-obstacle': 'panel', style: 'visibility: hidden' },
      { x: 0, y: 0, w: 10, h: 10 },
    )
    expect(readObstacles(s, FRAME).all).toEqual([])
  })

  it('reports in the layer’s pixels, from its frame', () => {
    const s = mount()
    boxed(s, { 'data-lq-obstacle': 'panel' }, { x: 110, y: 70, w: 20, h: 10 })
    expect(readObstacles(s, { left: 10, top: 20, ratio: 2 }).panels).toEqual([
      { x: 50, y: 25, w: 10, h: 5 },
    ])
  })

  it('lists the marked elements to watch', () => {
    const s = mount()
    const a = boxed(
      s,
      { 'data-lq-obstacle': 'panel' },
      { x: 0, y: 0, w: 1, h: 1 },
    )
    boxed(s, { class: 'plain' }, { x: 0, y: 0, w: 1, h: 1 })
    boxed(s, { 'data-lq-obstacle': 'panels' }, { x: 0, y: 0, w: 1, h: 1 })
    const w = boxed(
      s,
      { 'data-lq-obstacle': 'words' },
      { x: 0, y: 0, w: 1, h: 1 },
    )
    expect(obstacleElements(s)).toEqual([a, w])
    expect(obstacleElements(s, ['panel'])).toEqual([a])
  })
})
