import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act1 } from './Act1'
import { ACT1_GOLDEN_PATH } from './Act1GoldenPath'
import { MagnetFishingExpeditionQuest } from './quests/MagnetFishingExpedition'

/** A game at the road with the amulet, where the well's task was never started. */
function gameWithTheWellTaskUnstarted(): Game {
  const game = new Game([new Act1()])
  executeCommands(game, ACT1_GOLDEN_PATH)
  game.state.completedQuests = game.state.completedQuests.filter(
    (quest) => quest.name !== 'Magnet fishing expedition',
  )
  game.state.nonActivatedQuests.push(new MagnetFishingExpeditionQuest())
  return game
}

describe('Act 1 road with the well task never started', () => {
  it('leads to the well from the map and the hint, also after a reload', () => {
    const game = gameWithTheWellTaskUnstarted()
    const reloaded = new Game([new Act1()])
    reloaded.loadSaveData(game.toSaveData())

    for (const g of [game, reloaded]) {
      expect(g.hint()).toContain(
        'The amulet is yours, but Willowbrook still holds you: far down in ' +
          'the [item_name]well[/item_name], something still glints.',
      )
      const refusal = executeCommands(g, ['use map'])
      expect(refusal).toContain(
        'unfinished: something still glints far down in the village ' +
          '[item_name]well[/item_name].',
      )
      expect(refusal).not.toContain('began')
    }
  })

  it('starts the task on the glint, so the log is never empty at the road', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.VillageWell
    executeCommands(game, ['examine well'])

    expect(game.state.activatedQuests.map((q) => q.name)).toContain(
      'Magnet fishing expedition',
    )
  })
})
