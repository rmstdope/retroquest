import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { Act1 } from '../Act1'
import { FLAG_VILLAGER_TALKED_TO } from '../Act1StoryFlags'
import { expectDialogueSpeaker } from '@/testing/gameHelpers'

/** An Act I game with Elior standing in the Village Square. */
function gameInSquare(): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.VillageSquare
  return game
}

describe('Villager dialogue markup', () => {
  it('shows each rumour as well-formed dialogue spoken by the villager', () => {
    const game = gameInSquare()
    for (let i = 0; i < 6; i++) {
      const answer = game.commandParser.parse('talk to villager')
      expectDialogueSpeaker(answer, 'villager')
      expect(findMarkupProblems(answer)).toEqual([])
    }
  })

  it('records that a villager has been talked to', () => {
    const game = gameInSquare()
    game.commandParser.parse('talk to villager')
    expect(game.state.getStoryFlag(FLAG_VILLAGER_TALKED_TO)).toBe(true)
  })
})
