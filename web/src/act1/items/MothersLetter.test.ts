import { describe, it, expect, beforeEach } from 'vitest'
import { Game, characterName, findMarkupProblems } from '@/engine'
import {
  executeCommands,
  expectItemInInventory,
  expectItemInRoom,
} from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import { FadedPhotograph } from './FadedPhotograph'
import { MothersLetter } from './MothersLetter'
import { FLAG_FOUND_PHOTO, FLAG_READ_MOTHERS_LETTER } from '../Act1StoryFlags'

describe("The mother's letter at the river bend", () => {
  let game: Game

  beforeEach(() => {
    game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.Riverbank
    game.state.addItemToInventory(new FadedPhotograph())
    game.state.setStoryFlag(FLAG_FOUND_PHOTO, true)
  })

  it('stays hidden from a search before the fisherman tells of it', () => {
    executeCommands(game, ['search'])

    expectItemInRoom(game.state.currentRoom, "mother's letter", false)
  })

  it('is found in a tin under the smooth stone once the fisherman tells of it', () => {
    executeCommands(game, [
      'examine faded photograph',
      'give faded photograph to fisherman',
    ])

    const response = executeCommands(game, ['search'])

    expect(response).toContain('tin')
    expectItemInRoom(game.state.currentRoom, "mother's letter")
    executeCommands(game, ['take letter'])
    expectItemInInventory(game.state, "mother's letter")
  })

  it('is found only once', () => {
    executeCommands(game, [
      'examine faded photograph',
      'give faded photograph to fisherman',
      'search',
      'take letter',
    ])

    const response = executeCommands(game, ['search'])

    expect(response).not.toContain('tin')
    expectItemInRoom(game.state.currentRoom, "mother's letter", false)
  })

  it('keeps the smooth stone at the water when Elior tries to take it', () => {
    const response = executeCommands(game, ['take smooth stone'])

    expect(response).toContain('[failure]')
    expectItemInRoom(game.state.currentRoom, 'smooth stone')
  })

  it('names Malakar and the amulet in written words', () => {
    const description = new MothersLetter().description

    expect(findMarkupProblems(description)).toEqual([])
    expect(description).toContain('[dialogue]')
    expect(description).toContain(characterName('Malakar'))
    expect(description).toContain('amulet')
  })

  it('completes The Faded Photograph when it is read, not before', () => {
    executeCommands(game, [
      'examine faded photograph',
      'give faded photograph to fisherman',
      'search',
      'take letter',
    ])
    expect(game.state.isQuestCompleted('The Faded Photograph')).toBe(false)

    executeCommands(game, ['examine letter'])

    expect(game.state.getStoryFlag(FLAG_READ_MOTHERS_LETTER)).toBe(true)
    expect(game.state.isQuestCompleted('The Faded Photograph')).toBe(true)
  })

  it('can be read by using it as well', () => {
    game.state.addItemToInventory(new MothersLetter())

    const response = executeCommands(game, ['use letter'])

    expect(response).toContain(characterName('Malakar'))
    expect(game.state.getStoryFlag(FLAG_READ_MOTHERS_LETTER)).toBe(true)
  })
})
