import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { SirCedric } from '../characters/SirCedric'
import { PropheticVision } from './PropheticVision'
import { FLAG_GATHERING_STORM_COMPLETED } from '../Act2StoryFlags'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

/** An Act II game with Sir Cedric in the current room. */
function createGameWithCedric(): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom.addCharacter(new SirCedric())
  return game
}

describe('Prophetic Vision markup', () => {
  it('uses only known tags for the first vision', () => {
    const game = createGameWithCedric()

    const answer = new PropheticVision().castSpell(game.state)

    expect(answer).toContain('shadows gathering in the north')
    expectMarkupWellFormed(answer)
  })

  it('uses only known tags for a repeated vision', () => {
    const game = createGameWithCedric()
    const spell = new PropheticVision()
    spell.castSpell(game.state)

    const answer = spell.castSpell(game.state)

    expect(answer).toContain('brief glimpses of possible futures')
    expectMarkupWellFormed(answer)
  })
})

describe('Prophetic Vision casting', () => {
  it('is cast by its spaced name and completes the Gathering Storm quest', () => {
    const game = createGameWithCedric()
    game.state.knownSpells.push(new PropheticVision())

    const answer = game.cast('prophetic vision')

    expect(answer).toContain('shadows gathering in the north')
    expect(game.state.getStoryFlag(FLAG_GATHERING_STORM_COMPLETED)).toBe(true)
  })
})
