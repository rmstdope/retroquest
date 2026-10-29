import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { Act1 } from '../Act1'
import { PrayerBook } from './PrayerBook'

describe('PrayerBook', () => {
  it('reads as well-formed markup', () => {
    const game = new Game([new Act1()])
    const text = new PrayerBook().read(game.state)
    expect(findMarkupProblems(text)).toEqual([])
    expect(text).not.toContain('[event]You read the [item_name]')
  })

  it('opens with narration, then sets the hymn apart as unquoted writing', () => {
    const game = new Game([new Act1()])
    const text = new PrayerBook().read(game.state)
    expect(text).toBe(
      'The book falls open by itself at a page worn soft with reading: ' +
        'the hymn for the bell.\n' +
        '[character_name][/character_name]\n[dialogue]Ring for the ones who go, ' +
        'and ring them home.[/dialogue]',
    )
  })
})
