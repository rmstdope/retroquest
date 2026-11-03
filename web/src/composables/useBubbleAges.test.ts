// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { STAGE_BUBBLES, useBubbleAges } from './useBubbleAges'

describe('useBubbleAges', () => {
  let scope = effectScope()
  afterEach(() => scope.stop())

  /** A container with `count` bubbles, aged by the composable. */
  async function aged(count: number): Promise<HTMLElement> {
    const root = document.createElement('div')
    root.innerHTML = Array.from(
      { length: count },
      (_, i) => `<p class="b">${i}</p>`,
    ).join('')
    scope = effectScope()
    scope.run(() => useBubbleAges(ref(root), '.b'))
    await nextTick()
    return root
  }

  const ages = (root: HTMLElement): (string | null)[] =>
    Array.from(root.querySelectorAll('.b')).map((b) =>
      b.getAttribute('data-age'),
    )

  it('marks the newest bubble new, the one before prev and the rest old', async () => {
    expect(ages(await aged(4))).toEqual(['old', 'old', 'prev', 'new'])
    expect(ages(await aged(1))).toEqual(['new'])
  })

  it('ages again when a bubble comes, also inside a nested element', async () => {
    const root = await aged(2)
    const turn = document.createElement('article')
    turn.innerHTML = '<p class="b">later</p>'
    root.appendChild(turn)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(ages(root)).toEqual(['old', 'prev', 'new'])
  })

  it('on the stage skips a bubble still waiting to be shown, and ages it once it is', async () => {
    const root = document.createElement('div')
    root.innerHTML =
      '<p class="lq-bubble">Words.</p>' +
      '<div class="lq-bubble lq-pending">+ Lantern</div>'
    scope = effectScope()
    scope.run(() => useBubbleAges(ref(root), STAGE_BUBBLES))
    await nextTick()
    const [words, chips] = Array.from(root.children)
    expect(words.getAttribute('data-age')).toBe('new')
    expect(chips.hasAttribute('data-age')).toBe(false)
    chips.classList.remove('lq-pending')
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(words.getAttribute('data-age')).toBe('prev')
    expect(chips.getAttribute('data-age')).toBe('new')
  })

  it('ages the lines of the one column with the bubbles between them', async () => {
    const root = document.createElement('div')
    root.innerHTML =
      '<div class="lq-cl">Hello.</div><p class="lq-bubble">She smiles.</p>' +
      '<div class="lq-cl">Again.</div>'
    scope = effectScope()
    scope.run(() => useBubbleAges(ref(root), STAGE_BUBBLES))
    await nextTick()
    expect(
      Array.from(root.children).map((e) => e.getAttribute('data-age')),
    ).toEqual(['old', 'prev', 'new'])
  })
})
