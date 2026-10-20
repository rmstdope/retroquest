import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Game } from '@/engine'
import { Act1 } from '@/act1/Act1'
import { executeCommands } from '@/testing/gameHelpers'
import { failureReason, parseDebugScript } from '@/utils/debugScript'

describe('debug-scripts/act1.txt', () => {
  it('plays Act I up to its last step, which then completes the act', () => {
    const text = readFileSync(
      resolve(__dirname, '../debug-scripts/act1.txt'),
      'utf8',
    )
    const game = new Game([new Act1()])
    for (const { line, command } of parseDebugScript(text)) {
      const answer = executeCommands(game, [command])
      expect(failureReason(answer), `line ${line}: ${command}`).toBeNull()
    }
    const act = game.acts[game.currentAct]
    expect(act.isCompleted(game.state)).toBe(false)
    expect(game.state.currentRoom.name).toBe('Road to Greendale')

    executeCommands(game, ['use map'])
    expect(act.isCompleted(game.state)).toBe(true)
  })
})
