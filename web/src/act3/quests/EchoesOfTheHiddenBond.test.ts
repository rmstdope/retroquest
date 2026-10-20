import { describe, it, expect, beforeEach } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { EchoesOfTheHiddenBondQuest } from './EchoesOfTheHiddenBond'
import {
  FLAG_ACT3_ECHOES_QUEST_STARTED,
  FLAG_ACT3_MAIN_STARTED,
  FLAG_ACT3_SEA_SEALED_LETTER_READ,
  FLAG_ACT3_CHARRED_INSCRIPTION_READ,
  FLAG_ACT3_DRAGONS_MEMORY_RECEIVED,
  FLAG_ACT3_ECHOES_QUEST_COMPLETED,
} from '../Act3StoryFlags'

describe('Echoes of the Hidden Bond quest', () => {
  let game: Game
  let quest: EchoesOfTheHiddenBondQuest

  beforeEach(() => {
    game = new Game([new Act3()])
    quest = new EchoesOfTheHiddenBondQuest()
  })

  it('initializes correctly', () => {
    expect(quest.name).toBe('Echoes of the Hidden Bond')
    expect(quest.isMain()).toBe(false)
    expect(quest.description).toContain('Your parents once walked')
  })

  it('triggers when the Act III main quest starts', () => {
    // Initially should not trigger
    expect(quest.checkTrigger(game.state)).toBe(false)

    // After main quest starts, should trigger
    game.state.setStoryFlag(FLAG_ACT3_ECHOES_QUEST_STARTED, true)
    expect(quest.checkTrigger(game.state)).toBe(true)
  })

  it('updates as discoveries are made', () => {
    // Start the quest
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)

    // Find Sea-Sealed Letter
    game.state.setStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ, true)
    let updated = quest.checkUpdate(game.state)
    expect(updated).toBe(true)
    expect(quest.description).toContain('✓ Depths of the Sunken Ruins')
    expect(quest.description).toContain("Malakar's apprentices")

    // Read Charred Inscription
    game.state.setStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ, true)
    updated = quest.checkUpdate(game.state)
    expect(updated).toBe(true)
    expect(quest.description).toContain('✓ Heights of Mount Ember')
    expect(quest.description).toContain('protective ward they forged')

    // Hear Dragon's Memory
    game.state.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)
    updated = quest.checkUpdate(game.state)
    expect(updated).toBe(true)
    expect(quest.description).toContain('✓ Shadows of the Caverns')
    expect(quest.description).toContain('ancient dragon shared memories')
  })

  it('completes when all testimonies are found', () => {
    // Initially should not be complete
    expect(quest.checkCompletion(game.state)).toBe(false)

    // With only some discoveries, should not be complete
    game.state.setStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ, true)
    game.state.setStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ, true)
    expect(quest.checkCompletion(game.state)).toBe(false)

    // With all discoveries, should be complete
    game.state.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)
    expect(quest.checkCompletion(game.state)).toBe(true)

    // Should set completion flag
    expect(game.state.getStoryFlag(FLAG_ACT3_ECHOES_QUEST_COMPLETED)).toBe(true)

    // Should not complete again
    expect(quest.checkCompletion(game.state)).toBe(false)
  })

  it('has appropriate completion text', () => {
    const completionText = quest.completion
    expect(completionText).toContain(
      'three testimonies have revealed the truth',
    )
    expect(completionText).toContain('once apprentices to Malakar')
    expect(completionText).toContain("hid Elior from Malakar's sight")
  })
})
