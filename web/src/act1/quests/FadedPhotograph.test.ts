import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import { FadedPhotographQuest } from './FadedPhotograph'

const OPENING =
  'An old photograph of your parents, hidden away in a drawer. ' +
  "On the back is a line in your mother's hand."

describe('The Faded Photograph quest', () => {
  it('opens with what was found, not what to do next', () => {
    const quest = new FadedPhotographQuest()
    expect(quest.description).toBe(OPENING)
    expect(quest.description).not.toMatch(/river|grandmother|\bread\b/i)
    expect(quest.description).not.toMatch(/somewhere in the cottage/i)
  })

  it('keeps its name and completion line', () => {
    const quest = new FadedPhotographQuest()
    expect(quest.name).toBe('The Faded Photograph')
    expect(quest.completion).toContain('At the river bend you found')
  })

  it('shows the opening as its only entry once the cottage is searched, and as the hint', () => {
    const game = new Game([new Act1()])
    executeCommands(game, [
      'talk to voice',
      'use lantern',
      'take bread',
      'take lantern',
      'talk to grandmother',
      'use journal',
      'talk to grandmother',
      'search',
    ])
    const quest = game.state.activatedQuests.find(
      (q) => q.name === 'The Faded Photograph',
    )
    expect(quest?.description).toBe(OPENING)
    expect(quest?.hint(game.state)).toBe(OPENING)
  })
})
