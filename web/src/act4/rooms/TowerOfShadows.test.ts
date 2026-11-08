import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import {
  FLAG_ACT4_TOWER_STAIR_OPEN,
  FLAG_ACT4_WHISPERS_MIRA_NAMED,
} from '../Act4StoryFlags'
import { TowerOfShadows } from './TowerOfShadows'

/** An Act IV game standing in the Tower of Shadows, the main quest open. */
function inTheTower(): Game {
  const act = new Act4()
  act.musicFile = ''
  const game = new Game([act])
  game.state.currentRoom = act.rooms.TowerOfShadows
  game.state.settleQuests()
  return game
}

describe('TowerOfShadows', () => {
  it('has the correct name', () => {
    const room = new TowerOfShadows()
    expect(room.name).toBe('Tower of Shadows')
  })

  it('has something to say about the whispers before the third name', () => {
    const game = inTheTower()
    const before = game.hint()
    expect(before).toContain('whispers')
    game.state.setStoryFlag(FLAG_ACT4_WHISPERS_MIRA_NAMED, true)
    const afterOne = game.hint()
    expect(afterOne).toContain('whispers')
    expect(afterOne).not.toBe(before)
    game.state.setStoryFlag(FLAG_ACT4_TOWER_STAIR_OPEN, true)
    expect(game.hint()).not.toContain('whispers')
  })
})
