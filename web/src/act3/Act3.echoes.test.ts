import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from './Act3'
import {
  FLAG_ACT3_ECHOES_QUEST_STARTED,
  FLAG_ACT3_SEA_SEALED_LETTER_READ,
  FLAG_ACT3_CHARRED_INSCRIPTION_READ,
  FLAG_ACT3_DRAGONS_MEMORY_RECEIVED,
} from './Act3StoryFlags'

const ECHOES = 'Echoes of the Hidden Bond'

describe('Echoes of the Hidden Bond integration', () => {
  it('is included in the Act 3 quest list', () => {
    const questNames = new Act3().quests.map((quest) => quest.name)
    expect(questNames).toContain(ECHOES)
  })

  it('gives the keepsake note during the first conversation with Mira', () => {
    const game = new Game([new Act3()])
    // First conversation should give the keepsake note
    const mira = game.state.allRooms.MirasHut.getCharacterByName('Mira')
    expect(mira, 'Mira should be in her hut').not.toBeNull()
    if (!mira) return
    mira.talkTo(game.state)

    // Check that the note is now in inventory
    const itemNames = game.state.inventory.map((item) => item.name)
    expect(itemNames).toContain('Keepsake Note')
  })

  it('has the charred inscription in Mirror Terraces', () => {
    const game = new Game([new Act3()])
    const mirrorTerraces = game.state.allRooms.MirrorTerraces
    const itemNames = mirrorTerraces.items.map((item) => item.name)
    expect(itemNames).toContain('Charred Inscription')
  })

  it('progresses through the three discoveries to completion', () => {
    const game = new Game([new Act3()])
    const state = game.state

    // Start main quest to trigger Echoes quest
    state.setStoryFlag(FLAG_ACT3_ECHOES_QUEST_STARTED, true)

    // Process quest activations (might need multiple calls)
    state.settleQuests()

    // Find the Echoes quest
    const echoesQuest = state.activatedQuests.find(
      (quest) => quest.name === ECHOES,
    )
    expect(echoesQuest, 'Echoes quest should be activated').toBeDefined()
    if (!echoesQuest) return

    // Test discovery progression
    state.setStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ, true)
    echoesQuest.checkUpdate(state)
    expect(echoesQuest.description).toContain('✓ In the Sunken Ruins')

    state.setStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ, true)
    echoesQuest.checkUpdate(state)
    expect(echoesQuest.description).toContain('✓ On Mount Ember')

    state.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)
    echoesQuest.checkUpdate(state)
    expect(echoesQuest.description).toContain('✓ In the Caverns of Shadow')

    // Test completion
    expect(echoesQuest.checkCompletion(state)).toBe(true)
  })
})
