import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { FLAG_HERMITS_WARNING_COMPLETED } from '../Act2StoryFlags'
import { ForestSurvivalKit } from '../items/ForestSurvivalKit'
import { GREENDALE_QUESTS } from '../greendaleWork'
import {
  executeCommands,
  expectCurrentRoom,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

describe('Forest Transition access', () => {
  it('keeps the forest entrance closed until Greendale quests and the warning are complete', () => {
    const game = new Game([new Act2()])
    const transition = game.state.allRooms.ForestTransition
    const requiredQuests = [
      "The Knight's Test",
      'Supplies for the Journey',
      'Echoes of the Past',
      "The Healer's Apprentice",
      'The Ancient Library',
    ]

    game.state.setStoryFlag(FLAG_HERMITS_WARNING_COMPLETED, true)
    for (const questName of requiredQuests.slice(0, -1)) {
      const quest = game.state.getQuest(questName)
      if (quest === null) throw new Error(`Missing quest: ${questName}`)
      game.state.completedQuests.push(quest)
    }
    expect(transition.getExits(game.state)).not.toHaveProperty('east')

    const finalQuest = game.state.getQuest('The Ancient Library')
    if (finalQuest === null)
      throw new Error('Missing The Ancient Library quest')
    game.state.completedQuests.push(finalQuest)

    expect(transition.getExits(game.state).east).toBe('ForestEntrance')
  })
})

describe('Forest Transition description', () => {
  it('seats the hermit among the stones before the camp and by the ashes after', () => {
    const game = new Game([new Act2()])
    const room = game.state.allRooms.ForestTransition

    const before = room.descriptionFor(game.state)
    expect(
      before.endsWith(
        'A robed figure sits among the stones, watching the trees.',
      ),
    ).toBe(true)

    game.state.setStoryFlag(FLAG_HERMITS_WARNING_COMPLETED, true)
    const after = room.descriptionFor(game.state)
    expect(after).toBe(
      before.replace(
        'A robed figure sits among the stones, watching the trees.',
        'The [character_name]forest hermit[/character_name] sits by the cold ashes of your camp in the lee of the oldest stone.',
      ),
    )
  })

  it('shows one hermit sentence when a save holds the older description', () => {
    const game = new Game([new Act2()])
    const room = game.state.allRooms.ForestTransition
    room.description += ' A robed figure sits peacefully among the stones.'
    game.state.setStoryFlag(FLAG_HERMITS_WARNING_COMPLETED, true)

    const text = room.descriptionFor(game.state)

    expect(text).not.toContain('robed figure')
    expect(text).toContain('cold ashes of your camp')
  })
})

/** A game at the stones, camped by the hermit's word, with Greendale's quests still open. */
function createCampedGameWithCityQuestsOpen(): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom = game.state.allRooms.ForestTransition
  game.state.inventory.push(new ForestSurvivalKit())
  executeCommands(game, ['talk to forest hermit', 'use forest survival kit'])
  return game
}

describe('Forest Transition while Greendale still has work', () => {
  it('keeps the plain refusal once Greendale is done but before the camp', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.ForestTransition
    for (const name of GREENDALE_QUESTS) {
      const quest = game.state.getQuest(name)
      if (quest === null) throw new Error(`Missing quest: ${name}`)
      game.state.completedQuests.push(quest)
    }

    expect(executeCommands(game, ['e'])).toContain("You can't go that way.")
  })

  it('has the hermit turn the player back to Greendale at the way east', () => {
    const game = createCampedGameWithCityQuestsOpen()

    const answer = executeCommands(game, ['e'])

    expect(answer).not.toContain("You can't go that way.")
    expect(answer).toContain('forest hermit')
    expect(answer).toContain('Greendale')
    expectMarkupWellFormed(answer)
    expectCurrentRoom(game.state, 'Forest Transition')
  })

  it('does not promise an open way after the camp while it is shut', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.ForestTransition
    game.state.inventory.push(new ForestSurvivalKit())
    executeCommands(game, ['talk to forest hermit'])

    const camp = executeCommands(game, ['use forest survival kit'])
    const talk = executeCommands(game, ['talk to forest hermit'])
    const log = game.state.getQuest("The Hermit's Warning")?.completion ?? ''

    expect(camp).not.toContain('Go on')
    expect(camp).toContain('Greendale')
    expect(talk).not.toContain('Go on')
    expect(talk).toContain('Greendale')
    expect(log).not.toContain('The way east is open')
  })
})
