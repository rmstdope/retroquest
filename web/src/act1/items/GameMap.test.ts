import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../Act1'
import { AncientAmulet } from './AncientAmulet'
import { GameMap } from './GameMap'

function setupGameAtRoad(): {
  act: Act1
  game: Game
  map: GameMap
} {
  const act = new Act1()
  const game = new Game([act])
  const map = new GameMap()
  game.state.currentRoom = act.rooms.RoadToGreendale
  game.state.addItemToInventory(map)
  return { act, game, map }
}

function completeSideQuestsExcept(
  game: Game,
  incompleteQuestName?: string,
): void {
  const sideQuests = [
    ...game.state.nonActivatedQuests,
    ...game.state.activatedQuests,
  ].filter((quest) => !quest.isMain())
  const incompleteQuest = sideQuests.find(
    (quest) => quest.name === incompleteQuestName,
  )

  game.state.completedQuests.push(
    ...sideQuests.filter((quest) => quest !== incompleteQuest),
  )
  game.state.nonActivatedQuests = game.state.nonActivatedQuests.filter(
    (quest) => quest.isMain() || quest === incompleteQuest,
  )
  game.state.activatedQuests = game.state.activatedQuests.filter(
    (quest) => quest.isMain() || quest === incompleteQuest,
  )
}

describe('GameMap act completion', () => {
  it('does not complete the act without the Ancient Amulet', () => {
    const { act, game, map } = setupGameAtRoad()
    completeSideQuestsExcept(game)

    const response = map.use(game.state)

    expect(response).toContain('[failure]')
    expect(act.isCompleted(game.state)).toBe(false)
  })

  it('requires the Preparing for the road quest to be complete', () => {
    const { act, game, map } = setupGameAtRoad()
    completeSideQuestsExcept(game, 'Preparing for the road')
    game.state.addItemToInventory(new AncientAmulet())

    const response = map.use(game.state)

    expect(response).toContain('[failure]')
    expect(act.isCompleted(game.state)).toBe(false)
  })

  it('requires every other side quest to be complete', () => {
    const { act, game, map } = setupGameAtRoad()
    completeSideQuestsExcept(game, 'The Faded Photograph')
    game.state.addItemToInventory(new AncientAmulet())

    const response = map.use(game.state)

    expect(response).toContain('[failure]')
    expect(act.isCompleted(game.state)).toBe(false)
  })

  it('completes the act after the amulet and all side quests are secured', () => {
    const { act, game, map } = setupGameAtRoad()
    completeSideQuestsExcept(game)
    game.state.addItemToInventory(new AncientAmulet())

    map.use(game.state)

    expect(act.isCompleted(game.state)).toBe(true)
  })
})
