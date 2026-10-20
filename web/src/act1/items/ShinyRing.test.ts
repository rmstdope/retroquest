import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { Act1 } from '../Act1'
import { executeCommands } from '@/testing/gameHelpers'
import { ShinyRing } from './ShinyRing'

describe('ShinyRing', () => {
  it("shows the initials that make it Elior's mother's wedding ring", () => {
    const game = new Game([new Act1()])
    game.state.addItemToInventory(new ShinyRing())

    const answer = executeCommands(game, ['examine shiny ring'])

    expect(findMarkupProblems(answer)).toEqual([])
    expect(answer).toContain('[dialogue]A & L[/dialogue]')
    expect(answer).toContain("your mother's wedding ring")
  })

  it('shows the initials on a ring restored from an older save', () => {
    const game = new Game([new Act1()])
    const ring = new ShinyRing()
    ring.description = 'A beautiful silver ring. It looks quite valuable.'
    game.state.addItemToInventory(ring)

    expect(executeCommands(game, ['examine ring'])).toContain('A & L')
  })
})
