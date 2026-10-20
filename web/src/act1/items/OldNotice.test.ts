import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { Act1 } from '../Act1'
import { OldNotice } from './OldNotice'

describe('OldNotice', () => {
  it('reads as well-formed markup', () => {
    const game = new Game([new Act1()])
    const text = new OldNotice().read(game.state)
    expect(findMarkupProblems(text)).toEqual([])
    expect(text).toContain('[event]You read the [item_name]')
  })

  it('shows the notice as unquoted writing naming Hemlock', () => {
    const game = new Game([new Act1()])
    const text = new OldNotice().read(game.state)
    expect(text).toContain(
      '[character_name][/character_name]\n[dialogue][bold]MISSING[/bold]',
    )
    expect(text).toContain('[character_name]Hemlock[/character_name] family')
    expect(text).toContain('A small reward is offered.[/dialogue]')
  })
})
