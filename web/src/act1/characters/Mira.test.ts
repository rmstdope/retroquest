import { describe, it, expect, vi } from 'vitest'
import { Game, type GameState } from '@/engine'
import { Act1 } from '../Act1'
import { RareFlower } from '../items/RareFlower'
import {
  FLAG_CONNECT_WITH_NATURE,
  FLAG_INVESTIGATED_WITHERED_CROPS,
  FLAG_MAGIC_FULLY_UNLOCKED,
  FLAG_VILLAGER_TALKED_TO,
  FLAG_WELL_EXAMINED,
} from '../Act1StoryFlags'
import {
  executeCommands,
  expectDialogueSpeaker,
  expectItemInInventory,
  expectSpellKnown,
} from '@/testing/gameHelpers'

/** A game standing in Mira's hut. */
function gameInMirasHut(): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.MirasHut
  return game
}

/** Lets the Preparing for the Road quest report itself complete. */
function completeJourneyPreparations(state: GameState): void {
  const quest = state.getQuest('Preparing for the Road')
  expect(quest).not.toBeNull()
  vi.spyOn(quest!, 'checkCompletion').mockReturnValue(true)
}

describe('Mira’s early guidance', () => {
  it('points Elior toward the Rare Flower, the well and the Hidden Glade', () => {
    const game = gameInMirasHut()
    game.state.setStoryFlag(FLAG_INVESTIGATED_WITHERED_CROPS, true)
    game.state.setStoryFlag(FLAG_VILLAGER_TALKED_TO, true)
    game.state.setStoryFlag(FLAG_WELL_EXAMINED, true)

    const response = game.commandParser.parse('talk to mira')

    expect(response).toContain('Rare Flower')
    expect(response).toContain('Hidden Glade')
    expect(response).toContain('well')
    expect(game.state.getStoryFlag(FLAG_CONNECT_WITH_NATURE)).toBe(true)
  })
})

describe('Mira accepting the Rare Flower', () => {
  it('teaches the spells in short beats and names the preparations in one line', () => {
    const game = gameInMirasHut()
    game.state.addItemToInventory(new RareFlower())

    const response = executeCommands(game, ['give rare flower to mira'])

    for (const spell of ['heal', 'unlock', 'light'])
      expectSpellKnown(game.state, spell)
    expect(game.state.getStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED)).toBe(true)
    expect(response).toContain(
      "You'll need warmth, protection, food, boots and a [item_name]map[/item_name].",
    )
    expect(response).not.toContain('\n- ')
    const beats = response.split('\n').filter((beat) => beat.trim() !== '')
    expect(beats.length).toBeGreaterThanOrEqual(3)
    for (const beat of beats) expect(beat.length).toBeLessThan(400)
    expectDialogueSpeaker(response, 'Mira')
  })

  it('keeps Greendale for the day she hands over the amulet', () => {
    const game = gameInMirasHut()
    game.state.addItemToInventory(new RareFlower())

    const response = executeCommands(game, ['give rare flower to mira'])

    expect(response).not.toContain('Greendale')
    expect(response).not.toContain('druid')
  })
})

describe('Mira handing over the Ancient Amulet', () => {
  it('sends Elior toward Greendale and warns him to guard the amulet', () => {
    const game = gameInMirasHut()
    game.state.addItemToInventory(new RareFlower())
    executeCommands(game, ['give rare flower to mira'])
    completeJourneyPreparations(game.state)

    const response = executeCommands(game, ['talk to mira'])

    expectItemInInventory(game.state, 'Ancient Amulet')
    expect(response).toContain('Greendale')
    expect(response).toContain('show the amulet to no one lightly')
    expect(response).toContain('Those who know what it is will find you.')
    expect(response).not.toContain('druid')
    expectDialogueSpeaker(response, 'Mira')
  })

  it('does not repeat the parting words once the amulet is his', () => {
    const game = gameInMirasHut()
    game.state.addItemToInventory(new RareFlower())
    executeCommands(game, ['give rare flower to mira'])
    completeJourneyPreparations(game.state)
    executeCommands(game, ['talk to mira'])

    const response = executeCommands(game, ['talk to mira'])

    expect(response).not.toContain('show the amulet to no one lightly')
  })
})
