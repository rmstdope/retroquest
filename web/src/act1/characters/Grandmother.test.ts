import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import { Locket } from '../items/Locket'

describe('Grandmother and the locket', () => {
  it('recognises the locket as her daughter’s founders’ heirloom', () => {
    const game = new Game([new Act1()])
    game.state.addItemToInventory(new Locket())

    const response = executeCommands(game, ['give locket to grandmother'])

    expect(response).toContain("this was your mother's")
    expect(response).toContain('all the way back to the founders')
    expect(game.state.hasItem('travel cloak')).toBe(true)
  })
})
