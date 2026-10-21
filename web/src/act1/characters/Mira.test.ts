import { describe, it, expect, vi } from 'vitest'
import { Game, type GameState } from '@/engine'
import { Act1 } from '../Act1'
import { RareFlower } from '../items/RareFlower'
import { RuneToken } from '../items/RuneToken'
import { Mechanism } from '../items/Mechanism'
import { Rope } from '../items/Rope'
import {
  FLAG_CONNECT_WITH_NATURE,
  FLAG_INVESTIGATED_WITHERED_CROPS,
  FLAG_MAGIC_FULLY_UNLOCKED,
  FLAG_MIRA_NAMED_FOULING_SIGIL,
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

  it('takes the amulet off its stand, so there is one amulet in the world', () => {
    const game = gameInMirasHut()
    game.state.addItemToInventory(new RareFlower())
    executeCommands(game, ['give rare flower to mira'])
    completeJourneyPreparations(game.state)

    executeCommands(game, ['talk to mira'])

    expect(game.state.currentRoom.getItemByName('amulet')).toBeNull()
    expect(
      game.state.inventory.filter((item) => item.name === 'ancient amulet'),
    ).toHaveLength(1)
    expect(game.state.currentRoom.describe(game.state)).toContain(
      'The stand where the amulet rested stands empty.',
    )
  })

  it('hints once, between the gift and the warning, that she knew his parents', () => {
    const game = gameInMirasHut()
    game.state.addItemToInventory(new RareFlower())
    executeCommands(game, ['give rare flower to mira'])
    completeJourneyPreparations(game.state)

    const response = executeCommands(game, ['talk to mira'])
    const hint =
      'I knew your parents better than I have said. ' +
      'Once you are truly ready, I will tell you.'

    expect(response).toContain('Then, more quietly:')
    expect(response).toContain(hint)
    const gift = response.indexOf('added to inventory!')
    expect(response.indexOf('Then, more quietly:')).toBeGreaterThan(gift)
    expect(response.indexOf(hint)).toBeLessThan(
      response.indexOf('She holds your hand a moment longer'),
    )

    const later = executeCommands(game, ['talk to mira'])
    expect(later).not.toContain('truly ready')
    expect(later).not.toContain('your parents')
  })

  it('does not hint before the hand-over', () => {
    const game = gameInMirasHut()
    const response = executeCommands(game, ['talk to mira'])
    expect(response).not.toContain('your parents')
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

describe('Mira and the rune token from the well', () => {
  it('names it a fouling sigil, set in the well on purpose, and hands it back', () => {
    const game = gameInMirasHut()
    game.state.addItemToInventory(new RuneToken())

    const response = executeCommands(game, ['give rune token to mira'])

    expect(response).toContain('fouling sigil')
    expect(response).toContain('on purpose')
    expect(response).toContain('searching')
    expect(response).not.toContain('Malakar')
    expectItemInInventory(game.state, 'rune token')
    expect(game.state.getStoryFlag(FLAG_MIRA_NAMED_FOULING_SIGIL)).toBe(true)
    expectDialogueSpeaker(response, 'Mira')
    const beats = response.split('\n').filter((beat) => beat.trim() !== '')
    for (const beat of beats) expect(beat.length).toBeLessThan(400)
  })

  it('ties it to the mill once Elior has jammed the mechanism there', () => {
    const game = gameInMirasHut()
    const mechanism = game.state.allRooms.OldMill.items.find(
      (item) => item instanceof Mechanism,
    )
    if (!(mechanism instanceof Mechanism)) throw new Error('no mechanism')
    const rope = new Rope()
    game.state.addItemToInventory(rope)
    mechanism.useWith(game.state, rope)
    game.state.addItemToInventory(new RuneToken())

    const response = executeCommands(game, ['give rune token to mira'])

    expect(response).toContain('mill')
    expectDialogueSpeaker(response, 'Mira')
  })

  it('does not tell the whole tale twice', () => {
    const game = gameInMirasHut()
    game.state.addItemToInventory(new RuneToken())
    executeCommands(game, ['give rune token to mira'])

    const response = executeCommands(game, ['give rune token to mira'])

    expect(response).not.toContain('on purpose')
    expectItemInInventory(game.state, 'rune token')
    expectDialogueSpeaker(response, 'Mira')
  })
})
