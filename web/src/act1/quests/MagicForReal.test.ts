import { describe, it, expect, beforeEach } from 'vitest'
import { Game } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import { HealSpell } from '../spells/HealSpell'
import {
  FLAG_CONNECT_WITH_NATURE,
  FLAG_INVESTIGATED_WITHERED_CROPS,
  FLAG_VILLAGER_TALKED_TO,
  FLAG_WELL_EXAMINED,
  FLAG_MAGIC_FULLY_UNLOCKED,
} from '../Act1StoryFlags'

const QUEST = 'Magic for real'

describe('Magic for real', () => {
  let game: Game

  beforeEach(() => {
    game = new Game([new Act1()])
  })

  /** Plays one harmless turn, so the quests check their triggers and logs. */
  function turn(): void {
    executeCommands(game, ['look'])
  }

  /** The active quest, failing the test when it is not active. */
  function quest(target: Game = game): {
    description: string
    hint: string | null
  } {
    const found = target.state.activatedQuests.find((q) => q.name === QUEST)
    if (!found) throw new Error(`${QUEST} is not active`)
    return { description: found.description, hint: found.hint(target.state) }
  }

  it("points to Mira's way with herbs before she has asked for anything", () => {
    game.state.learnSpell(new HealSpell())
    turn()
    expect(quest().hint).toContain('a way with herbs')
  })

  it('leads to the flower once Mira has asked for it', () => {
    game.state.learnSpell(new HealSpell())
    turn()
    game.state.setStoryFlag(FLAG_CONNECT_WITH_NATURE, true)
    turn()
    expect(quest().hint).not.toContain('a way with herbs')
    expect(quest().hint).toContain('rare flower')
  })

  it('leads to the flower after Mira asks for it in her hut', () => {
    game.state.learnSpell(new HealSpell())
    turn()
    game.state.setStoryFlag(FLAG_INVESTIGATED_WITHERED_CROPS, true)
    game.state.setStoryFlag(FLAG_VILLAGER_TALKED_TO, true)
    game.state.setStoryFlag(FLAG_WELL_EXAMINED, true)
    game.state.currentRoom = game.state.allRooms.MirasHut
    executeCommands(game, ['talk to mira'])
    expect(game.state.getStoryFlag(FLAG_CONNECT_WITH_NATURE)).toBe(true)
    expect(quest().hint).toContain('rare flower')
    expect(quest().hint).toContain('magic')
  })

  it('opens at the flower when Mira asked before the first spell', () => {
    game.state.setStoryFlag(FLAG_CONNECT_WITH_NATURE, true)
    game.state.learnSpell(new HealSpell())
    turn()
    expect(quest().hint).toContain('rare flower')
  })

  it('keeps the flower stage through a save and load', () => {
    game.state.learnSpell(new HealSpell())
    turn()
    game.state.setStoryFlag(FLAG_CONNECT_WITH_NATURE, true)
    turn()
    const loaded = new Game([new Act1()])
    loaded.loadSaveData(game.toSaveData())
    expect(quest(loaded).hint).toContain('rare flower')
  })

  it('completes once the flower is given', () => {
    game.state.learnSpell(new HealSpell())
    game.state.setStoryFlag(FLAG_CONNECT_WITH_NATURE, true)
    turn()
    game.state.setStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED, true)
    turn()
    expect(game.state.completedQuests.some((q) => q.name === QUEST)).toBe(true)
  })
})
