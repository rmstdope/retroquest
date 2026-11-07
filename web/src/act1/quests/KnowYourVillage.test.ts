import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
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

  describe('naming the places still unvisited', () => {
    const ORDER = [
      "Elior's Cottage",
      'Village Square',
      'Vegetable Field',
      'Chicken Coop',
      "Mira's Hut",
      'General Store',
      "Blacksmith's Forge",
      'Village Well',
      'Abandoned Shed',
      'Old Mill',
      'Riverbank',
      'Forest Path',
      'Hidden Glade',
      'Village Chapel',
      'Road to Greendale',
    ]

    /** An active quest with every room visited but the named ones, Elior in `at`. */
    function setup(unvisited: string[], at: string): Game {
      const game = new Game([new Act1()])
      executeCommands(game, ['talk to voice'])
      for (const room of Object.values(game.state.allRooms)) {
        if (!(room instanceof TheDream) && !unvisited.includes(room.name))
          game.state.markVisited(room)
      }
      game.state.visitedRooms = game.state.visitedRooms.filter(
        (name) => !unvisited.includes(name),
      )
      game.state.currentRoom = Object.values(game.state.allRooms).find(
        (room) => room.name === at,
      )!
      game.state.settleQuests()
      return game
    }

    function quest(game: Game): KnowYourVillageQuest {
      const found = game.state.activatedQuests.find((q) => q.name === QUEST)
      expect(found).toBeInstanceOf(KnowYourVillageQuest)
      return found as KnowYourVillageQuest
    }

    it('names the unvisited place fewest steps from Elior', () => {
      const game = setup(['Chicken Coop', 'Hidden Glade'], 'Village Square')
      expect(KnowYourVillageQuest.nearestUnvisited(game.state)?.name).toBe(
        'Chicken Coop',
      )
      game.state.currentRoom = game.state.allRooms.ForestPath
      expect(KnowYourVillageQuest.nearestUnvisited(game.state)?.name).toBe(
        'Hidden Glade',
      )
    })

    it('gives the same place from the same spot, and none when all are visited', () => {
      const game = setup(['Chicken Coop', 'Hidden Glade'], 'Village Square')
      const hint = quest(game).hint(game.state)
      expect(quest(game).hint(game.state)).toBe(hint)
      const done = setup([], 'Village Square')
      expect(KnowYourVillageQuest.nearestUnvisited(done.state)).toBeNull()
      expect(
        done.state.completedQuests
          .find((q) => q.name === QUEST)
          ?.hint(done.state),
      ).toBeNull()
    })

    it('breaks a tie by walking order', () => {
      // From the square the cottage and Mira's Hut are both one step away.
      const game = setup(["Mira's Hut", "Elior's Cottage"], 'Village Square')
      expect(KnowYourVillageQuest.nearestUnvisited(game.state)?.name).toBe(
        "Elior's Cottage",
      )
    })

    it('has a hint line for each of the fifteen places, in room-name markup', () => {
      for (const place of ORDER) {
        const game = setup(
          [place],
          place === 'Village Square' ? 'Vegetable Field' : 'Village Square',
        )
        const line = quest(game).hint(game.state)
        expect(line, place).toContain(`[room_name]${place}[/room_name]`)
        expect(findMarkupProblems(line ?? '')).toEqual([])
      }
    })

    it('uses the agreed line for the Chicken Coop', () => {
      const game = setup(['Chicken Coop'], 'Village Square')
      expect(quest(game).hint(game.state)).toBe(
        'You have not looked in on the hens at the ' +
          '[room_name]Chicken Coop[/room_name] in a long while.',
      )
    })

    it('shows in the hint command beside the quest name', () => {
      const game = setup(['Chicken Coop'], 'Village Square')
      expect(executeCommands(game, ['hint'])).toContain(
        '[bold]Know your village:[/bold] You have not looked in on the hens',
      )
    })

    it('logs a checklist of all fifteen places in walking order, ticked as visited', () => {
      const game = setup(['Chicken Coop', 'Hidden Glade'], 'Village Square')
      const details = quest(game).details()
      expect(details.kind).toBe('checklist')
      if (details.kind !== 'checklist') return
      expect(details.intro).toBe(
        'Something pulls at you to walk every lane of Willowbrook, ' +
          'and to look properly at the places you have passed a thousand times.\n' +
          'You have yet to look properly at:',
      )
      expect(details.items.map((item) => item.text)).toEqual(ORDER)
      expect(
        details.items.filter((item) => !item.done).map((item) => item.text),
      ).toEqual(['Chicken Coop', 'Hidden Glade'])
    })

    it('completes once the last unvisited place is entered', () => {
      const game = setup(['Chicken Coop'], 'Village Square')
      game.state.markVisited(game.state.allRooms.ChickenCoop)
      game.state.settleQuests()
      expect(game.state.completedQuests.map((q) => q.name)).toContain(QUEST)
    })

    it('shows the same hint and ticks after a save and load', () => {
      const game = setup(['Chicken Coop', 'Hidden Glade'], 'Village Square')
      const loaded = new Game([new Act1()])
      loaded.loadSaveData(game.toSaveData())
      expect(quest(loaded).hint(loaded.state)).toBe(
        quest(game).hint(game.state),
      )
      expect(quest(loaded).details()).toEqual(quest(game).details())
    })
  })
})
