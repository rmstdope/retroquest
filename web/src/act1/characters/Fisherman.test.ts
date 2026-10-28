import { describe, it, expect, beforeEach } from 'vitest'
import { Game } from '@/engine'
import {
  executeCommands,
  expectDialogueSpeaker,
  expectItemInInventory,
} from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import { FadedPhotograph } from '../items/FadedPhotograph'
import { Fish } from '../items/Fish'
import { FishingRod } from '../items/FishingRod'
import { HealSpell } from '../spells/HealSpell'
import {
  FLAG_FISHERMAN_TOLD_OF_TIN,
  FLAG_HEALED_FISHERMAN_ARM,
} from '../Act1StoryFlags'

describe('Fisherman', () => {
  let game: Game

  beforeEach(() => {
    game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.Riverbank
  })

  describe('shown the faded photograph', () => {
    beforeEach(() => {
      game.state.addItemToInventory(new FadedPhotograph())
    })

    it('recognises the mother but keeps the tin to himself before the message is read', () => {
      const response = executeCommands(game, [
        'give faded photograph to fisherman',
      ])

      expect(response).toContain('your mother')
      expect(response).not.toContain('tin')
      expect(game.state.getStoryFlag(FLAG_FISHERMAN_TOLD_OF_TIN)).toBe(false)
      expectItemInInventory(game.state, 'faded photograph')
    })

    it('tells of the tin under the smooth stone once the message is read', () => {
      executeCommands(game, ['examine faded photograph'])

      const response = executeCommands(game, [
        'give faded photograph to fisherman',
      ])

      expect(response).not.toContain('You show the')
      expect(response).toContain('tin')
      expect(response).toContain('[item_name]smooth stone[/item_name]')
      expectDialogueSpeaker(response, 'fisherman')
      expect(game.state.getStoryFlag(FLAG_FISHERMAN_TOLD_OF_TIN)).toBe(true)
      expectItemInInventory(game.state, 'faded photograph')
    })

    it('points back to the stone when shown the photograph again', () => {
      executeCommands(game, [
        'examine faded photograph',
        'give faded photograph to fisherman',
      ])

      const response = executeCommands(game, [
        'give faded photograph to fisherman',
      ])

      expect(response).toContain('[item_name]smooth stone[/item_name]')
      expect(response).not.toContain('The night before she went away')
    })
  })

  it('credits the mother when teaching purify', () => {
    game.state.addItemToInventory(new Fish())

    const response = executeCommands(game, ['give fish to fisherman'])

    expect(response).toContain(
      'mother taught me a thing for that, here at the bend',
    )
    expect(response).toContain('I reckon it was always more hers than mine.')
    expect(game.state.hasSpell('purify')).toBe(true)
  })

  describe('healed', () => {
    beforeEach(() => {
      game.state.learnSpell(new HealSpell())
    })

    it('mends his arm and thanks Elior', () => {
      const response = executeCommands(game, ['cast heal on fisherman'])

      expect(response).toContain('arm')
      expect(response).toContain('Thank you')
      expectDialogueSpeaker(response, 'fisherman')
      expect(game.state.getStoryFlag(FLAG_HEALED_FISHERMAN_ARM)).toBe(true)
    })

    it('has nothing left to mend the second time', () => {
      executeCommands(game, ['cast heal on fisherman'])

      const response = executeCommands(game, ['cast heal on fisherman'])

      expect(response).toContain('nothing left to mend')
      expect(response).not.toContain('Thank you')
    })

    it('no longer speaks of a bad arm when talked to without a rod', () => {
      executeCommands(game, ['cast heal on fisherman'])

      const response = executeCommands(game, ['talk to fisherman'])

      expect(response).not.toContain('seen better days')
      expect(response).toContain('mended')
      expectDialogueSpeaker(response, 'fisherman')
    })

    it('teaches fishing out of gratitude when talked to with a rod', () => {
      executeCommands(game, ['cast heal on fisherman'])
      game.state.addItemToInventory(new FishingRod())

      const response = executeCommands(game, ['talk to fisherman'])

      expect(response).not.toContain('busted')
      expect(response).not.toContain("can't fish myself")
      expect(response).toContain('He teaches you the basics of fishing.')
      expect(game.state.getStoryFlag('learned_fishing_basics')).toBe(true)
      expectDialogueSpeaker(response, 'fisherman')
    })
  })
})

describe('Fisherman teaching purify', () => {
  it('ends his speech on a full sentence, not a comma', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.Riverbank
    game.state.addItemToInventory(new Fish())

    const response = executeCommands(game, ['give fish to fisherman'])

    expect(response).not.toContain(',[/dialogue]')
    expect(response).toContain(
      'You have learned [spell_name]purify[/spell_name].',
    )
  })

  it('speaks his current idle line after loading a save that holds the old one', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.Riverbank
    game.state.addItemToInventory(new Fish())
    executeCommands(game, ['give fish to fisherman'])
    const fisherman = game.state.currentRoom.getCharacterByName('fisherman')
    Object.defineProperty(fisherman, 'dialogueStates', {
      value: { taught_spells: 'The river has many moods.' },
      enumerable: true,
      writable: true,
      configurable: true,
    })
    const loaded = new Game([new Act1()])
    expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')

    const answer = loaded.commandParser.parse('talk to fisherman')

    expect(answer).toContain('She used to sit right where you')
    expect(answer).not.toContain('many moods')
  })
})
