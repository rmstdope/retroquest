import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../Act1'
import { executeCommands } from '@/testing/gameHelpers'
import { Key } from '../items/Key'
import { FLAG_PATCHES_FOUND } from '../Act1StoryFlags'

/** A new Act I game already woken out of the dream, standing in the cottage. */
function cottageGame(): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.EliorsCottage
  return game
}

const QUEST = 'Curiosity killed the cat'

describe('Curiosity killed the cat', () => {
  it('starts when Hemlock asks after Patches', () => {
    const game = cottageGame()
    game.state.currentRoom = game.state.allRooms.GeneralStore
    executeCommands(game, ['talk to shopkeeper'])
    expect(game.state.isQuestActivated(QUEST)).toBe(true)
  })

  it('stays open after the shed is unlocked, until Patches is home', () => {
    const game = cottageGame()
    game.state.currentRoom = game.state.allRooms.VillageWell
    game.state.addItemToInventory(new Key())
    executeCommands(game, ['go south', 'use key with door', 'talk to patches'])
    expect(game.state.isQuestActivated(QUEST)).toBe(true)
    const quest = game.state.activatedQuests.find((q) => q.name === QUEST)
    expect(quest?.description).toContain('[character_name]Hemlock')

    executeCommands(game, ['go north', 'go east', 'go north'])
    executeCommands(game, ['talk to shopkeeper'])

    expect(game.state.isQuestCompleted(QUEST)).toBe(true)
    expect(game.state.isQuestActivated(QUEST)).toBe(false)
  })

  it('also completes when Patches stays with grandmother', () => {
    const game = cottageGame()
    game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)
    executeCommands(game, ['say stay to grandmother'])

    const completed = game.state.completedQuests.find((q) => q.name === QUEST)
    expect(completed?.completion).toContain('hearth')
    expect(completed?.completion).toContain('[character_name]grandmother')
  })
})
