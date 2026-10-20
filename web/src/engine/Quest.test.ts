import { describe, it, expect } from 'vitest'
import { Quest } from './Quest'
import { GameState } from './GameState'
import { Room } from './Room'

function gameState(): GameState {
  const start = new Room({ name: 'Start', description: '' })
  return new GameState(start, { Start: start }, [])
}

describe('Quest', () => {
  it('has a default completion text', () => {
    const q = new Quest({ name: 'Find the key', description: 'd' })
    expect(q.completion).toBe("You have completed the quest 'Find the key'.")
    const custom = new Quest({
      name: 'Q',
      description: 'd',
      completion: 'Done.',
    })
    expect(custom.completion).toBe('Done.')
  })

  it('is a side quest that neither triggers nor updates by default', () => {
    const gs = gameState()
    const q = new Quest({ name: 'Q', description: 'd' })
    expect(q.isMain()).toBe(false)
    expect(q.checkTrigger(gs)).toBe(false)
    expect(q.checkUpdate(gs)).toBe(false)
    expect(q.checkCompletion(gs)).toBe(false)
  })

  it('completes when told to', () => {
    const gs = gameState()
    const q = new Quest({ name: 'Q', description: 'd', completion: 'Done.' })
    expect(q.complete(gs)).toBe('Done.')
    expect(q.completed).toBe(true)
    expect(q.checkCompletion(gs)).toBe(true)
  })
})
