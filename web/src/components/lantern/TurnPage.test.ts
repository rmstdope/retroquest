// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TurnPage from './TurnPage.vue'

describe('TurnPage', () => {
  const page = mount(TurnPage)

  it('asks the player to turn the phone, in the agreed words', () => {
    expect(page.get('h2').text()).toBe('Turn your phone on its side')
    const lines = page.findAll('p').map((p) => p.text())
    expect(lines).toEqual([
      'RetroQuest is played with the phone held sideways, so the whole room fits.',
      "If nothing happens, check that your phone's rotation lock is off.",
    ])
  })

  it('is a modal page over everything', () => {
    expect(page.attributes('role')).toBe('dialog')
    expect(page.attributes('aria-modal')).toBe('true')
    expect(page.attributes('aria-labelledby')).toBe(
      page.get('h2').attributes('id'),
    )
  })
})
