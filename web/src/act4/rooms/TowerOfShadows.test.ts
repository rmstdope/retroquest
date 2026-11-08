import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import {
  FLAG_ACT4_TOWER_STAIR_OPEN,
  FLAG_ACT4_WHISPERS_MIRA_NAMED,
} from '../Act4StoryFlags'
import { TowerOfShadows } from './TowerOfShadows'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { ACT4_GOLDEN_PATH } from '../Act4GoldenPath'
import { executeCommands } from '@/testing/gameHelpers'

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

/** The golden path up to the third name said to the whispers. */
const TO_NAMED = ACT4_GOLDEN_PATH.slice(
  0,
  ACT4_GOLDEN_PATH.indexOf('say nyx to whispers') + 1,
)

describe('Tower of Shadows once the friends are named', () => {
  it('speaks of the whispers until the friends are named', () => {
    const game = new Game([new Act4()])
    executeCommands(game, TO_NAMED.slice(0, -1))
    expect(game.state.currentRoom.name).toBe('Tower of Shadows')
    expect(game.state.currentRoom.describe(game.state)).toContain(
      'tells you why you should not have come.',
    )
  })

  it('no longer speaks of the whispers once they are gone', () => {
    const game = new Game([new Act4()])
    executeCommands(game, TO_NAMED)
    const text = game.state.currentRoom.describe(game.state)
    expect(text).toContain(
      'The whispers are gone. The stair winds up into the dark, and it is only a stair.',
    )
    expect(text).not.toContain('why you should not have come')
    expect(text).not.toContain('move a moment after you do')
  })
})
