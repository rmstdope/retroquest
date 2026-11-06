import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import {
  FLAG_FISHERMAN_TOLD_OF_TIN,
  FLAG_FOUND_MOTHERS_LETTER,
} from '../Act1StoryFlags'
import { FadedPhotographQuest } from './FadedPhotograph'

const OPENING =
  'An old photograph of your parents, hidden away in a drawer. ' +
  "On the back is a line in your mother's hand."

describe('The faded photograph quest', () => {
  it('opens with what was found, not what to do next', () => {
    const quest = new FadedPhotographQuest()
    expect(quest.description).toBe(OPENING)
    expect(quest.description).not.toMatch(/river|grandmother|\bread\b/i)
    expect(quest.description).not.toMatch(/somewhere in the cottage/i)
  })

  it('keeps its name and completion line', () => {
    const quest = new FadedPhotographQuest()
    expect(quest.name).toBe('The faded photograph')
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
      (q) => q.name === 'The faded photograph',
    )
    expect(quest?.description).toBe(OPENING)
    expect(quest?.hint(game.state)).toBe(OPENING)
  })

  it('moves its log and hint on at every stage until the letter is read', () => {
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
      'take faded photograph',
    ])
    const quest = (): FadedPhotographQuest | undefined =>
      game.state.activatedQuests.find(
        (q): q is FadedPhotographQuest => q instanceof FadedPhotographQuest,
      )
    const hint = (): string => quest()?.hint(game.state) ?? ''
    const hints = [hint()]

    executeCommands(game, ['examine faded photograph'])
    expect(hint()).toMatch(/where the river bends/)
    expect(hint()).toMatch(/grandmother/i)
    hints.push(hint())

    executeCommands(game, ['give faded photograph to grandmother'])
    expect(hint()).toMatch(/fisherman/)
    expect(hint()).toMatch(/Riverbank/)
    hints.push(hint())

    game.state.setStoryFlag(FLAG_FISHERMAN_TOLD_OF_TIN, true)
    executeCommands(game, ['look'])
    expect(hint()).toMatch(/smooth stone/)
    hints.push(hint())

    game.state.setStoryFlag(FLAG_FOUND_MOTHERS_LETTER, true)
    executeCommands(game, ['look'])
    expect(hint()).toMatch(/letter/)
    hints.push(hint())

    expect(new Set(hints).size).toBe(hints.length)
    const details = quest()?.details()
    expect(details?.kind).toBe('journal')
    if (details?.kind === 'journal') {
      expect(details.earlier).toEqual(hints.slice(0, -1))
      expect(details.latest).toBe(hints[hints.length - 1])
    }
    expect(game.state.isQuestCompleted('The faded photograph')).toBe(false)
  })

  it('skips the grandmother stage when Elior goes straight to the fisherman', () => {
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
      'take faded photograph',
      'examine faded photograph',
    ])
    game.state.setStoryFlag(FLAG_FISHERMAN_TOLD_OF_TIN, true)
    executeCommands(game, ['look'])
    const quest = game.state.activatedQuests.find(
      (q) => q instanceof FadedPhotographQuest,
    )
    expect(quest?.hint(game.state)).toMatch(/smooth stone/)
    const details = quest?.details()
    expect(details?.kind === 'journal' && details.earlier.length).toBe(2)
  })
})
