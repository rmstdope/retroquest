import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { FLAG_HERMITS_WARNING_COMPLETED } from '../Act2StoryFlags'

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
