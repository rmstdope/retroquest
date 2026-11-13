import { describe, it, expect } from 'vitest'
import { Act } from './Act'
import { GameState } from './GameState'
import { Room } from './Room'

describe('Act', () => {
  it('names its content classes for saves', () => {
    const room = new Room({ name: 'Start', description: '' })
    const act = new Act({
      name: 'A',
      rooms: { Start: room },
      quests: [],
      musicFile: '',
      musicInfo: '',
      classes: { Room },
    })
    expect(act.classes).toEqual({ Room })
  })

  it('has no intro, no setup and never completes by default', () => {
    const room = new Room({ name: 'Start', description: '' })
    const act = new Act({
      name: 'A',
      rooms: { Start: room },
      quests: [],
      musicFile: '',
      musicInfo: '',
    })
    const gs = new GameState(room, act.rooms, act.quests)
    expect(act.getActIntro()).toBe('')
    expect(act.setupGameState(gs)).toBeUndefined()
    expect(act.isCompleted(gs)).toBe(false)
  })
})
