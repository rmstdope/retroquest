import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import { executeCommands, expectMarkupWellFormed } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import { RuneToken } from './RuneToken'

describe('RuneToken', () => {
  it('reads as something made, not something lost, and names no one', () => {
    const game = new Game([new Act1()])
    game.state.addItemToInventory(new RuneToken())

    const response = executeCommands(game, ['examine rune token'])

    expect(response).toContain('black iron')
    expect(response).toContain('rune')
    expect(response).not.toContain('Malakar')
    expectMarkupWellFormed(response)
  })
})
