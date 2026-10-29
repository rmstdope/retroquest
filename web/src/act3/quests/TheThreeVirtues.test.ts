import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { TheThreeVirtuesQuest } from './TheThreeVirtues'
import {
  FLAG_ACT3_MAIN_STARTED,
  FLAG_ACT3_MAIN_COMPLETED,
  FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED,
  FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED,
  FLAG_ACT3_DRAGONS_SCALE_ACQUIRED,
} from '../Act3StoryFlags'

function createGame(): Game {
  return new Game([new Act3()])
}

describe('The Three Virtues quest', () => {
  it('triggers on the main started flag and completes on the main completed flag', () => {
    const game = createGame()

    const quest = new TheThreeVirtuesQuest()

    // Not started by default
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, false)
    expect(quest.checkTrigger(game.state)).toBe(false)

    // When main started flag set -> triggers
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    expect(quest.checkTrigger(game.state)).toBe(true)

    // Completion follows main completed flag
    game.state.setStoryFlag(FLAG_ACT3_MAIN_COMPLETED, false)
    expect(quest.checkCompletion(game.state)).toBe(false)

    game.state.setStoryFlag(FLAG_ACT3_MAIN_COMPLETED, true)
    expect(quest.checkCompletion(game.state)).toBe(true)
  })

  it('updates once when the crystal of light is acquired', () => {
    const game = createGame()

    const quest = new TheThreeVirtuesQuest()

    // Initially no crystal -> no update
    expect(quest.checkUpdate(game.state)).toBe(false)

    // Now acquire the crystal -> should update once
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    const updated = quest.checkUpdate(game.state)
    expect(updated).toBe(true)
    // Description should mention that the Crystal was claimed
    expect(quest.description).toContain('crystal of light')

    // Subsequent calls should not report another update
    expect(quest.checkUpdate(game.state)).toBe(false)
  })

  it('updates once when the phoenix feather is acquired', () => {
    const game = createGame()
    const quest = new TheThreeVirtuesQuest()

    // Initially no feather -> no update
    expect(quest.checkUpdate(game.state)).toBe(false)

    // Now acquire the feather -> should update once
    game.state.setStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, true)
    const updated = quest.checkUpdate(game.state)
    expect(updated).toBe(true)
    // Description should mention that the Phoenix Feather was obtained
    expect(quest.description).toContain('phoenix feather')
    expect(quest.description).toContain('wisdom is patience')

    // Subsequent calls should not report another update
    expect(quest.checkUpdate(game.state)).toBe(false)
  })

  it('acknowledges both the Crystal and the phoenix feather', () => {
    const game = createGame()
    const quest = new TheThreeVirtuesQuest()
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, true)
    const updated = quest.checkUpdate(game.state)
    expect(updated).toBe(true)
    expect(quest.description).toContain('crystal of light')
    expect(quest.description).toContain('phoenix feather')
    expect(quest.description).toContain('wisdom is patience')
  })

  it("updates once when the dragon's scale is acquired", () => {
    const game = createGame()
    const quest = new TheThreeVirtuesQuest()

    // Initially no scale -> no update
    expect(quest.checkUpdate(game.state)).toBe(false)

    // Now acquire the scale -> should update once
    game.state.setStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED, true)
    const updated = quest.checkUpdate(game.state)
    expect(updated).toBe(true)
    // Description should mention that the Dragon's Scale was claimed
    expect(quest.description).toContain("dragon's scale")
    expect(quest.description).toContain('heavy in your pack')
    expect(quest.description).toContain('all three relics')

    // Subsequent calls should not report another update
    expect(quest.checkUpdate(game.state)).toBe(false)
  })

  it('acknowledges all three relics', () => {
    const game = createGame()
    const quest = new TheThreeVirtuesQuest()

    // Set all three flags
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED, true)

    const updated = quest.checkUpdate(game.state)
    expect(updated).toBe(true)

    // All three relics should be mentioned
    expect(quest.description).toContain('crystal of light')
    expect(quest.description).toContain('phoenix feather')
    expect(quest.description).toContain("dragon's scale")

    // Final message should indicate all relics are obtained
    expect(quest.description).toContain('all three relics')
    expect(quest.description).toContain(
      "Mira's Warding Rite is all that is left",
    )
  })

  it('updates correctly when the relics are acquired sequentially', () => {
    const game = createGame()
    const quest = new TheThreeVirtuesQuest()

    // First acquire Crystal
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    expect(quest.checkUpdate(game.state)).toBe(true)
    expect(quest.description).toContain('crystal of light')
    expect(quest.description).toContain('the black water')
    expect(quest.description).toContain(
      'Sir Cedric has said little since it asked him the same question.',
    )
    expect(quest.description).not.toContain('allies skilled in magic')
    // Should not have specific messages for other relics yet
    expect(quest.description).not.toContain('You answered the phoenix')
    expect(quest.description).not.toContain(
      "dragon's scale, heavy in your pack",
    )

    // Then acquire Phoenix Feather
    game.state.setStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, true)
    expect(quest.checkUpdate(game.state)).toBe(true)
    expect(quest.description).toContain('the black water')
    expect(quest.description).toContain('You answered the phoenix')
    // Should not have Dragon's Scale specific message yet
    expect(quest.description).not.toContain(
      "dragon's scale, heavy in your pack",
    )

    // Finally acquire Dragon's Scale
    game.state.setStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED, true)
    expect(quest.checkUpdate(game.state)).toBe(true)
    expect(quest.description).toContain('the black water')
    expect(quest.description).toContain('You answered the phoenix')
    expect(quest.description).toContain("dragon's scale, heavy in your pack")
    expect(quest.description).toContain('all three relics')
  })

  it('keeps earlier entries apart from the newest as data', () => {
    const quest = new TheThreeVirtuesQuest()
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    quest.checkUpdate(game.state)

    const details = quest.details()
    if (details.kind !== 'journal') throw new Error('expected a journal')
    expect(details.earlier).toHaveLength(1)
    expect(details.earlier[0]).toMatch(/^Mira says Malakar is draining/)
    expect(details.latest).toMatch(/^You walked into the black water/)
  })

  it('tells the crystal and the feather as what happened at each trial', () => {
    const quest = new TheThreeVirtuesQuest()
    const game = new Game([new Act3()])
    expect(quest.description).toBe(
      'Mira says Malakar is draining the life out of King Alden. Three relics ' +
        'can stand against him: the crystal of light, the phoenix feather and ' +
        "the dragon's scale.",
    )
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, true)
    quest.checkUpdate(game.state)
    const details = quest.details()
    if (details.kind !== 'journal') throw new Error('expected a journal')
    expect(details.earlier[1].trim()).toBe(
      'You walked into the black water and named what you did not abandon: ' +
        'yourself. The guardian gave you the crystal of light. Sir Cedric has ' +
        'said little since it asked him the same question.',
    )
    expect(details.latest.trim()).toBe(
      'You answered the phoenix: wisdom is patience, even when the world ' +
        'burns. It gave you a feather, and told you of a Warden who had none.',
    )
  })
})
