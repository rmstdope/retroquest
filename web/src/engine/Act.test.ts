import { describe, it, expect } from 'vitest'
import { Act } from './Act'
import { GameState } from './GameState'
import { Room } from './Room'

describe('Act', () => {
  it('keeps its content and metadata', () => {
    const room = new Room({ name: 'Start', description: '' })
    const act = new Act({
      name: 'Act1',
      rooms: { Start: room },
      quests: [],
      musicFile: 'song.mp3',
      musicInfo: 'Song by Someone',
    })
    expect(act.name).toBe('Act1')
    expect(act.rooms.Start).toBe(room)
    expect(act.quests).toEqual([])
    expect(act.musicFile).toBe('song.mp3')
    expect(act.musicInfo).toBe('Song by Someone')
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
