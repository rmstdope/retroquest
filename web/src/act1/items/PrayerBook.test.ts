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

  it('shows the passage as unquoted writing', () => {
    const game = new Game([new Act1()])
    const text = new PrayerBook().read(game.state)
    expect(text).toContain(
      "[character_name][/character_name]\n[dialogue]By the moon's forgotten echo, " +
        'let the silent bells resound...[/dialogue]',
    )
  })
})
