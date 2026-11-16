// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import KeyLine from './KeyLine.vue'

const HINTS = [
  { keys: ['↑', '↓'], word: 'move' },
  { keys: ['Esc'], word: 'back' },
]

function keyboard(on: boolean): void {
  vi.stubGlobal('matchMedia', () => ({
    matches: on,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

describe('KeyLine', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('shows key caps and words to a keyboard player', () => {
    keyboard(true)
    const w = mount(KeyLine, { props: { hints: HINTS } })
    expect(w.findAll('kbd').map((k) => k.text())).toEqual(['↑', '↓', 'Esc'])
    expect(w.findAll('.lq-keygroup').map((g) => g.text())).toEqual([
      '↑↓move',
      'Escback',
    ])
  })

  it('shows nothing to a touch player', () => {
    keyboard(false)
    expect(
      mount(KeyLine, { props: { hints: HINTS } })
        .find('.lq-keyline')
        .exists(),
    ).toBe(false)
  })
})
