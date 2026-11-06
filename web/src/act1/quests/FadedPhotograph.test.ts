import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { executeCommands, pathIndex, playPath } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import { ACT1_GOLDEN_PATH } from '../Act1GoldenPath'
import { FLAG_TALKED_TO_GRANDMOTHER_ABOUT_PHOTO } from '../Act1StoryFlags'
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
    const quest = (): FadedPhotographQuest | undefined =>
      game.state.activatedQuests.find(
        (q): q is FadedPhotographQuest => q instanceof FadedPhotographQuest,
      )
    const hint = (): string => quest()?.hint(game.state) ?? ''
    let played = 0
    const to = (command: string): void => {
      const next = pathIndex(ACT1_GOLDEN_PATH, command) + 1
      playPath(game, ACT1_GOLDEN_PATH, played, next)
      played = next
    }
    to('take faded photograph')
    const hints = [hint()]

    to('examine faded photograph')
    expect(hint()).toMatch(/where the river bends/)
    expect(hint()).toMatch(/grandmother/i)
    hints.push(hint())

    to('give faded photograph to grandmother')
    expect(hint()).toMatch(/fisherman/)
    expect(hint()).toMatch(/Riverbank/)
    hints.push(hint())

    to('give faded photograph to fisherman')
    expect(hint()).toMatch(/smooth stone/)
    hints.push(hint())

    to('take letter')
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

  it('skips the grandmother stage when Elior goes straight to the fisherman, and adds nothing when he asks her later', () => {
    const game = new Game([new Act1()])
    const path = ACT1_GOLDEN_PATH.filter(
      (command) => command !== 'give faded photograph to grandmother',
    )
    playPath(game, path, 0, pathIndex(path, 'take letter') + 1)
    const quest = game.state.activatedQuests.find(
      (q) => q instanceof FadedPhotographQuest,
    )
    expect(quest?.hint(game.state)).toMatch(/letter/)
    const before = quest?.details()
    expect(before?.kind === 'journal' && before.earlier.length).toBe(3)

    game.state.setStoryFlag(FLAG_TALKED_TO_GRANDMOTHER_ABOUT_PHOTO, true)
    expect(quest?.checkUpdate(game.state)).toBe(false)
    expect(quest?.details()).toEqual(before)
  })
})
