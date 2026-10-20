import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import { FLAG_DEER_CAN_BE_OBSERVED } from '../Act1StoryFlags'
import { LightSpell } from '../spells/LightSpell'

/** An Act I game where Elior has rested in the glade until the deer came. */
function gameWithDeer(): Game {
  const game = new Game([new Act1()])
  game.state.setStoryFlag(FLAG_DEER_CAN_BE_OBSERVED, true)
  game.state.currentRoom = game.state.allRooms.HiddenGlade
  executeCommands(game, ['rest'])
  return game
}

describe('The deer of the Hidden Glade', () => {
  it.each(['talk to deer', 'examine deer'])(
    'answers "%s" with a look toward the mossy stone, then to Elior',
    (command) => {
      const game = gameWithDeer()

      const response = executeCommands(game, [command])

      expect(response).toContain('mossy stone')
      expect(response).toContain('then to you')
      expect(response).not.toContain('[dialogue]')
      expect(findMarkupProblems(response)).toEqual([])
    },
  )

  it('bows to Elior once the stone has been lit', () => {
    const game = gameWithDeer()
    game.state.learnSpell(new LightSpell())
    executeCommands(game, ['cast light'])

    const response = executeCommands(game, ['talk to deer'])

    expect(response).not.toContain('then to you')
    expect(response).toContain('glowing stone')
    expect(findMarkupProblems(response)).toEqual([])
  })
})
