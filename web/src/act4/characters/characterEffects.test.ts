import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import { parseTurn } from '@/lantern/parseTurn'
import { Act4 } from '../Act4'
import { FLAG_ACT4_REDEMPTION_ENDING } from '../Act4StoryFlags'
import { executeCommands } from '@/testing/gameHelpers'

/** The kinds of the blocks that one answer is made of. */
function kinds(answer: string): string[] {
  return parseTurn(answer).map((block) =>
    block.kind === 'failure' && block.narrated ? 'clue' : block.kind,
  )
}

describe('Act IV characters narrate their effects', () => {
  it('never wrap an effect in event() or write a bare [failure] box', () => {
    const sources = readdirSync(__dirname)
      .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
      .map((f) => [f, readFileSync(join(__dirname, f), 'utf8')])
    for (const [file, source] of sources) {
      expect(source, file).not.toMatch(/(?<![\w.])event\(/)
      expect(source, file).not.toContain('[failure]')
    }
  })

  it('gives a pendant to Nyx as one read sentence, with no grey echo', () => {
    const game = new Game([new Act4()])
    game.state.setStoryFlag(FLAG_ACT4_REDEMPTION_ENDING, true)
    game.state.currentRoom = game.state.allRooms.WillowbrookField
    const given = executeCommands(game, ["give nyx's token to nyx"])
    expect(given).not.toContain('You hold out')
    expect(given).toContain(
      'The light comes down to the pendant, and the two of them are gone',
    )
    expect(kinds(given)).toEqual(['text'])
  })

  it('reads a description of the king as story text', () => {
    const game = new Game([new Act4()])
    game.state.currentRoom = game.state.allRooms.ThroneChamber
    expect(kinds(executeCommands(game, ['examine king']))).toEqual(['text'])
  })
})
