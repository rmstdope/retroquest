import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import { OldNotice } from './OldNotice'
import { VillageSquare } from '../rooms/VillageSquare'

describe('OldNotice', () => {
  it('shows the missing-cat poster and its reward when examined in the Village Square', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms['VillageSquare']
    const answer = executeCommands(game, ['examine old notice'])
    expect(answer).toContain('[bold]MISSING[/bold]')
    expect(answer).toContain('[character_name]Patches[/character_name]')
    expect(answer).toContain('Last seen near the old well.')
    expect(answer).toContain('A small reward is offered.')
  })

  it('stands in the Village Square as an item of its own, so it has a chip', () => {
    const square = new VillageSquare()
    expect(square.items.some((item) => item instanceof OldNotice)).toBe(true)
  })

  it('reads as well-formed markup', () => {
    const game = new Game([new Act1()])
    const text = new OldNotice().examine(game.state)
    expect(findMarkupProblems(text)).toEqual([])
    expect(text).not.toContain('You read the')
  })

  it('shows the notice as unquoted writing naming Hemlock', () => {
    const game = new Game([new Act1()])
    const text = new OldNotice().examine(game.state)
    expect(text).toContain(
      '[character_name][/character_name]\n[dialogue][bold]MISSING[/bold]',
    )
    expect(text).toContain('[character_name]Hemlock[/character_name] family')
    expect(text).toContain('A small reward is offered.[/dialogue]')
  })
})
