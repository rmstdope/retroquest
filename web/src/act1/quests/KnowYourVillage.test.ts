import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../Act1'
import { TheDream } from '../rooms/TheDream'
import { executeCommands } from '@/testing/gameHelpers'
import { KnowYourVillageQuest } from './KnowYourVillage'

const QUEST = 'Know your village'

describe('Know your village', () => {
  it('starts once Elior has left the cottage, not on waking from the dream', () => {
    const game = new Game([new Act1()])
    executeCommands(game, ['talk to voice'])
    expect(game.state.activatedQuests.map((q) => q.name)).not.toContain(QUEST)
    game.state.currentRoom = game.state.allRooms.VegetableField
    game.state.markVisited(game.state.currentRoom)
    game.state.settleQuests()
    expect(game.state.activatedQuests.map((q) => q.name)).toContain(QUEST)
  })

  it('completes when every room of the village is visited, the dream not counted', () => {
    const game = new Game([new Act1()])
    executeCommands(game, ['talk to voice'])
    for (const room of Object.values(game.state.allRooms)) {
      if (!(room instanceof TheDream)) game.state.markVisited(room)
    }
    game.state.settleQuests()
    expect(game.state.visitedRooms).not.toContain('The Dream')
    expect(game.state.completedQuests.map((q) => q.name)).toContain(QUEST)
  })

  it("reads as Elior's own urge to explore, never an instruction to the player", () => {
    const quest = new KnowYourVillageQuest()
    for (const text of [quest.description, quest.completion]) {
      expect(text).toContain('Willowbrook')
      expect(text).not.toMatch(/encouraged|you should|you need to/i)
    }
  })
})
