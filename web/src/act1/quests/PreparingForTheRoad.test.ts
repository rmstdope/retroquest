import { describe, it, expect } from 'vitest'
import { characterName, Game } from '@/engine'
import { Act1 } from '../Act1'
import { GameMap } from '../items/GameMap'
import { TravelCloak } from '../items/TravelCloak'
import { Apple } from '../items/Apple'
import { Egg } from '../items/Egg'
import { Fish } from '../items/Fish'
import { FreshBread } from '../items/FreshBread'
import { WildBerries } from '../items/WildBerries'
import { WitheredCarrot } from '../items/WitheredCarrot'
import { PreparingForTheRoadQuest } from './PreparingForTheRoad'

describe('Preparing for the road checklist', () => {
  it('marks met requirements as success', () => {
    const game = new Game([new Act1()])
    game.state.addItemToInventory(new TravelCloak())
    game.state.addItemToInventory(new GameMap())
    const quest = new PreparingForTheRoadQuest()

    quest.checkCompletion(game.state)

    expect(quest.description).toContain('[success] * Warm clothing[/success]')
    expect(quest.description).toContain(
      '[success] * A map to find your way[/success]',
    )
  })

  it('marks unmet requirements as pending, never failure', () => {
    const game = new Game([new Act1()])
    game.state.addItemToInventory(new TravelCloak())
    const quest = new PreparingForTheRoadQuest()

    expect(quest.checkCompletion(game.state)).toBe(false)
    expect(quest.description).toContain('[pending] * Sturdy footwear[/pending]')
    expect(quest.description).toContain(
      '[pending] * Magical protection[/pending]',
    )
    expect(quest.description).not.toContain('[failure]')
  })

  it('lists every requirement exactly once', () => {
    const quest = new PreparingForTheRoadQuest()
    quest.checkCompletion(new Game([new Act1()]).state)
    for (const requirement of [
      'Warm clothing',
      'Magical protection',
      'Food for the road',
      'Sturdy footwear',
      'A map to find your way',
      'All basic magic learned',
    ]) {
      expect(quest.description.split(requirement).length - 1, requirement).toBe(
        1,
      )
    }
  })

  it('reports its requirements as checklist data', () => {
    const game = new Game([new Act1()])
    game.state.addItemToInventory(new TravelCloak())
    const quest = new PreparingForTheRoadQuest()

    quest.checkCompletion(game.state)
    const details = quest.details()

    expect(details.kind).toBe('checklist')
    if (details.kind !== 'checklist') return
    expect(details.intro).toBe(
      `${characterName('Mira')} has tasked you with preparing for your journey. ` +
        'She says you will need:',
    )
    expect(details.items).toHaveLength(6)
    expect(details.items[0]).toEqual({ done: true, text: 'Warm clothing' })
    expect(details.items[3]).toEqual({ done: false, text: 'Sturdy footwear' })
  })

  it('keeps its checklist current through checkUpdate without reporting news', () => {
    const game = new Game([new Act1()])
    game.state.addItemToInventory(new TravelCloak())
    const quest = new PreparingForTheRoadQuest()

    expect(quest.checkUpdate(game.state)).toBe(false)

    const details = quest.details()
    if (details.kind !== 'checklist') throw new Error('expected a checklist')
    expect(details.items[0]).toEqual({ done: true, text: 'Warm clothing' })
    expect(details.items[4].done).toBe(false)
  })
})

describe('Food for the road', () => {
  /** The food line of the checklist after the quest has looked at the game. */
  function foodLine(game: Game): { done: boolean; text: string } {
    const quest = new PreparingForTheRoadQuest()
    quest.checkCompletion(game.state)
    const details = quest.details()
    if (details.kind !== 'checklist') throw new Error('expected a checklist')
    return details.items[2]
  }

  it('counts how many of the six kinds of food are gathered', () => {
    const game = new Game([new Act1()])
    game.state.addItemToInventory(new Apple())
    game.state.addItemToInventory(new Egg())
    game.state.addItemToInventory(new FreshBread())

    expect(foodLine(game)).toEqual({
      done: false,
      text: 'Food for the road (3 of 6 kinds gathered, any 4 will do)',
    })
  })

  it("is met by any four kinds, grandmother's bread and the fish among them", () => {
    const game = new Game([new Act1()])
    game.state.addItemToInventory(new FreshBread())
    game.state.addItemToInventory(new Fish())
    game.state.addItemToInventory(new Egg())
    game.state.addItemToInventory(new WildBerries())

    expect(foodLine(game).done).toBe(true)
  })

  it('counts the carrot only once it has been revived', () => {
    const game = new Game([new Act1()])
    const carrot = new WitheredCarrot()
    game.state.addItemToInventory(carrot)

    expect(foodLine(game).text).toContain('0 of 6')
    carrot.revive()
    expect(foodLine(game).text).toContain('1 of 6')
  })
})
