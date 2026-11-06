import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import { FLAG_WELL_EXAMINED } from '../Act1StoryFlags'
import { MagneticFishingRod } from '../items/MagneticFishingRod'

const GLINT = 'Something glints far down in the well, much too deep for hands.'
const ON_ROD = 'The magnet might reach it, on a long enough rod.'

function questNamed(game: Game, name: string) {
  return game.state.activatedQuests.find((quest) => quest.name === name)
}

describe('Magnet fishing expedition', () => {
  it('starts when Elior sees the glint in the well', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.VillageWell
    expect(questNamed(game, 'Magnet fishing expedition')).toBeUndefined()

    executeCommands(game, ['examine well'])

    const quest = questNamed(game, 'Magnet fishing expedition')
    expect(quest?.latestStage).toBe(GLINT)
    expect(quest?.earlierStages).toEqual([])
  })

  it('starts for an old save in which the glint was already seen', () => {
    const game = new Game([new Act1()])
    game.state.setStoryFlag(FLAG_WELL_EXAMINED, true)

    game.state.nextActivatedQuest()
    game.state.nextActivatedQuest()
    const names = game.state.activatedQuests.map((quest) => quest.name)

    expect(names).toContain('Magnet fishing expedition')
  })

  it('adds a second entry once the magnet is on the rod', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.VillageWell
    executeCommands(game, ['examine well'])
    game.state.addItemToInventory(new MagneticFishingRod())

    expect(game.state.nextUpdatedQuest()?.name).toBe(
      'Magnet fishing expedition',
    )
    const quest = questNamed(game, 'Magnet fishing expedition')
    expect(quest?.earlierStages).toEqual([GLINT])
    expect(quest?.latestStage).toBe(ON_ROD)
  })

  it('starts with both entries when the rod comes first', () => {
    const game = new Game([new Act1()])
    game.state.addItemToInventory(new MagneticFishingRod())

    game.state.nextActivatedQuest()
    const quest = questNamed(game, 'Magnet fishing expedition')

    expect(quest?.earlierStages).toEqual([GLINT])
    expect(quest?.latestStage).toBe(ON_ROD)
  })
})
