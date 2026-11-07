import { describe, it, expect, vi } from 'vitest'
import { characterName, Game, GameController } from '@/engine'
import { Act1 } from '../Act1'
import { WanderingBoots } from '../items/WanderingBoots'
import { FLAG_JOURNEY_BLESS_COMPLETED } from '../Act1StoryFlags'
import { GameMap } from '../items/GameMap'
import { TravelCloak } from '../items/TravelCloak'
import { Apple } from '../items/Apple'
import { Bread } from '../items/Bread'
import { Egg } from '../items/Egg'
import { Fish } from '../items/Fish'
import { FreshBread } from '../items/FreshBread'
import { WildBerries } from '../items/WildBerries'
import { WitheredCarrot } from '../items/WitheredCarrot'
import { PreparingForTheRoadQuest } from './PreparingForTheRoad'

/** The food requirement as the checklist, the card and the narration read it. */
const FOOD_LINE =
  'Food for the road (any four kinds: bread, apple, egg, carrot ' +
  'or berries)'

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

  it('names every need exactly once as first shown, before any check', () => {
    const quest = new PreparingForTheRoadQuest()
    for (const need of [
      'Warm clothing',
      'Magical protection',
      'Food for the road',
      'Sturdy footwear',
      'A map to find your way',
      'basic magic',
    ]) {
      expect(quest.description.split(need).length - 1, need).toBe(1)
    }
    expect(quest.description).toContain(' - A map to find your way -\n')
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

describe('A finished Preparing for the road', () => {
  it('keeps the list it had at completion', () => {
    const game = new Game([new Act1()])
    vi.spyOn(game.state, 'hasSpell').mockReturnValue(true)
    game.state.setStoryFlag(FLAG_JOURNEY_BLESS_COMPLETED, true)
    for (const item of [
      new TravelCloak(),
      new GameMap(),
      new WanderingBoots(),
      new Apple(),
      new Egg(),
      new FreshBread(),
      new WildBerries(),
    ])
      game.state.addItemToInventory(item)
    game.state.nonActivatedQuests = []
    game.state.activatedQuests = [new PreparingForTheRoadQuest()]

    game.state.settleQuests()
    expect(game.state.completedQuests).toHaveLength(1)

    const summarise = (g: Game) => {
      const [done] = new GameController(g).getCompletedQuests()
      return done.details
    }
    const frozen = summarise(game)
    expect(frozen).toMatchObject({ kind: 'checklist' })
    const food =
      frozen.kind === 'checklist' ? frozen.items[2].text : 'not a checklist'
    expect(food).toBe(FOOD_LINE)

    // Eating something afterwards changes nothing.
    game.state.removeItemFromInventory('apple')
    game.state.settleQuests()
    game.state.refreshQuestLogs()
    expect(summarise(game)).toEqual(frozen)

    const reloaded = new Game([new Act1()])
    reloaded.loadSaveData(game.toSaveData())
    expect(summarise(reloaded)).toEqual(frozen)
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

  it('reads the same however much food is gathered, so one recording fits', () => {
    const game = new Game([new Act1()])
    expect(foodLine(game)).toEqual({ done: false, text: FOOD_LINE })

    game.state.addItemToInventory(new Apple())
    game.state.addItemToInventory(new Egg())
    game.state.addItemToInventory(new FreshBread())
    expect(foodLine(game)).toEqual({ done: false, text: FOOD_LINE })
  })

  it("is met by any four kinds, grandmother's bread among them", () => {
    const game = new Game([new Act1()])
    game.state.addItemToInventory(new FreshBread())
    game.state.addItemToInventory(new Apple())
    game.state.addItemToInventory(new Egg())
    game.state.addItemToInventory(new WildBerries())

    expect(foodLine(game).done).toBe(true)
  })

  it('does not count the fish, which goes to the fisherman', () => {
    const game = new Game([new Act1()])
    game.state.addItemToInventory(new FreshBread())
    game.state.addItemToInventory(new Fish())
    game.state.addItemToInventory(new Egg())
    game.state.addItemToInventory(new WildBerries())

    expect(foodLine(game).done).toBe(false)
  })

  it('counts both loaves of bread as one kind', () => {
    const game = new Game([new Act1()])
    game.state.addItemToInventory(new FreshBread())
    game.state.addItemToInventory(new Bread())
    game.state.addItemToInventory(new Apple())
    game.state.addItemToInventory(new Egg())
    expect(foodLine(game).done).toBe(false)
  })

  it('counts the carrot only once it has been revived', () => {
    const game = new Game([new Act1()])
    const carrot = new WitheredCarrot()
    game.state.addItemToInventory(carrot)
    game.state.addItemToInventory(new Apple())
    game.state.addItemToInventory(new Egg())
    game.state.addItemToInventory(new WildBerries())

    expect(foodLine(game).done).toBe(false)
    carrot.revive()
    expect(foodLine(game).done).toBe(true)
  })
})

describe('Preparing for the road completion', () => {
  it('speaks in the story, not as a system message', () => {
    const completion = new PreparingForTheRoadQuest().completion

    expect(completion).not.toMatch(/gathered all the items/i)
    expect(completion).toContain('The road is next.')
  })
})
