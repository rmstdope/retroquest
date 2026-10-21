import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { SirCedric } from '../characters/SirCedric'
import type { GameState } from '@/engine'
import { PropheticVision } from './PropheticVision'
import { FLAG_GATHERING_STORM_COMPLETED } from '../Act2StoryFlags'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

/** An Act II game with Sir Cedric in the current room. */
function createGameWithCedric(): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom.addCharacter(new SirCedric())
  return game
}

/** Mark every Act II side quest complete for finale tests. */
function completeAllSideQuests(gameState: GameState): void {
  const sideQuests = [
    ...gameState.nonActivatedQuests,
    ...gameState.activatedQuests,
    ...gameState.completedQuests,
  ].filter((quest) => !quest.isMain())
  gameState.completedQuests.push(...sideQuests)
}

describe('Prophetic Vision markup', () => {
  it('uses only known tags for the first vision', () => {
    const game = createGameWithCedric()
    completeAllSideQuests(game.state)

    const answer = new PropheticVision().castSpell(game.state)

    expect(answer).toContain('a robed figure')
    expectMarkupWellFormed(answer)
  })

  it('uses only known tags for a repeated vision', () => {
    const game = createGameWithCedric()
    completeAllSideQuests(game.state)
    const spell = new PropheticVision()
    spell.castSpell(game.state)

    const answer = spell.castSpell(game.state)

    expect(answer).toContain('brief glimpses of possible futures')
    expectMarkupWellFormed(answer)
  })
})

describe('Prophetic Vision first cast', () => {
  it('shows the village, the figure and the dream voice once', () => {
    const game = createGameWithCedric()
    completeAllSideQuests(game.state)
    const spell = new PropheticVision()

    const first = spell.castSpell(game.state)

    expect(first).toContain('[character_name]Sir Cedric[/character_name]')
    expect(first).toContain('A village at dusk')
    expect(first).toContain(
      '[italic]“Elior… how you have grown. Do not be afraid of me.”[/italic]',
    )
    expect(first).toContain(
      "The vision fades. [character_name]Sir Cedric[/character_name]'s expression has grown grave.",
    )
    expect(first).not.toContain('Willowbrook')
    expect(first).not.toContain('shadows gathering')
    const later = spell.castSpell(game.state)
    expect(later).not.toContain('how you have grown')
    expect(later).not.toContain('robed figure')
  })
})

describe('Prophetic Vision casting', () => {
  it('does not complete the Gathering Storm before all side quests are complete', () => {
    const game = createGameWithCedric()
    game.state.knownSpells.push(new PropheticVision())

    const answer = game.cast('prophetic vision')

    expect(answer.toLowerCase()).toContain('complete every side quest')
    expect(game.state.getStoryFlag(FLAG_GATHERING_STORM_COMPLETED)).toBe(false)
  })

  it('is cast by its spaced name and completes the Gathering Storm quest', () => {
    const game = createGameWithCedric()
    completeAllSideQuests(game.state)
    game.state.knownSpells.push(new PropheticVision())

    const answer = game.cast('prophetic vision')

    expect(answer).toContain('a robed figure')
    expect(game.state.getStoryFlag(FLAG_GATHERING_STORM_COMPLETED)).toBe(true)
  })
})
