import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { MirrorLabyrinth } from './MirrorLabyrinth'
import { ServantsPendant } from '../items/ServantsPendant'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'
import { FLAG_ACT4_MAZE_OF_MIRRORS_STARTED } from '../Act4StoryFlags'

describe('MirrorLabyrinth', () => {
  it('has the correct name', () => {
    const room = new MirrorLabyrinth()
    expect(room.name).toBe('Mirror Labyrinth')
  })

  it('starts its quest on entering and offers only the way south', () => {
    const game = new Game([new Act4()])
    const room = new MirrorLabyrinth()
    room.onEnter(game.state)
    expect(game.state.getStoryFlag(FLAG_ACT4_MAZE_OF_MIRRORS_STARTED)).toBe(
      true,
    )
    expect(Object.keys(room.getExits(game.state))).toEqual(['south'])
  })

  it('walks into glass north, east and west only until it is solved', () => {
    const game = new Game([new Act4()])
    const room = new MirrorLabyrinth()
    for (const way of ['north', 'east', 'west']) {
      expect(room.blockedExit(game.state, way)).toContain('cold glass')
    }
    expect(room.blockedExit(game.state, 'up')).toBeNull()
    game.state.inventory.push(new ServantsPendant())
    room.solve(game.state)
    expect(room.blockedExit(game.state, 'north')).toBeNull()
  })

  it('shows the True Self and the after-description only once solved', () => {
    const game = new Game([new Act4()])
    const room = new MirrorLabyrinth()
    expect(room.characters).toHaveLength(0)
    room.solve(game.state)
    expect(room.characters).toHaveLength(0)
    game.state.inventory.push(new ServantsPendant())
    room.solve(game.state)
    room.solve(game.state)
    expect(room.characters.map((c) => c.name)).toEqual(['True Self'])
    expect(room.description).toContain('The false mirrors stand dark')
  })
})

describe('MirrorLabyrinth markup', () => {
  it('writes well-formed answers in every state', () => {
    const game = new Game([new Act4()])
    const room = new MirrorLabyrinth()
    const answers = [
      room.blockedExit(game.state, 'north') ?? '',
      room.solve(game.state),
    ]
    game.state.inventory.push(new ServantsPendant())
    answers.push(room.solve(game.state), room.solve(game.state))
    for (const answer of answers) expectMarkupWellFormed(answer)
  })
})
