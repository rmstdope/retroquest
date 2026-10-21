import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import {
  FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED,
  FLAG_ACT4_KNIGHT_OF_DESPAIR_STARTED,
} from '../Act4StoryFlags'
import { HallOfEchoes } from './HallOfEchoes'

describe('HallOfEchoes', () => {
  it('has the correct name', () => {
    const room = new HallOfEchoes()
    expect(room.name).toBe('Hall of Echoes')
  })

  it('holds the echoes, the stone and the knight', () => {
    const room = new HallOfEchoes()
    expect(room.items.map((i) => i.name)).toEqual(['Echoes', 'Echo Stone'])
    expect(room.characters.map((c) => c.name)).toEqual([
      'Knight of Despair',
      'Sir Cedric',
    ])
  })

  it('offers only the way south and blocks the stair east', () => {
    const game = new Game([new Act4()])
    const room = new HallOfEchoes()
    expect(Object.keys(room.getExits(game.state))).toEqual(['south'])
    expect(room.blockedExit(game.state, 'east')).toContain(
      'there is no way past him',
    )
    expect(room.blockedExit(game.state, 'north')).toBeNull()
  })

  it('starts the knight quest on entering and opens the stair once he is redeemed', () => {
    const game = new Game([new Act4()])
    const room = new HallOfEchoes()
    room.onEnter(game.state)
    expect(game.state.getStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_STARTED)).toBe(
      true,
    )
    game.state.setStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED, true)
    expect(Object.keys(room.getExits(game.state))).toContain('east')
    expect(room.blockedExit(game.state, 'east')).toBeNull()
  })
})
