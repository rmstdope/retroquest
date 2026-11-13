import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import {
  FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED,
  FLAG_ACT3_LANTERN_BRACKETS_FOUND,
} from '../Act3StoryFlags'
import { LanternsOfTheDeepsQuest } from './LanternsOfTheDeeps'

describe('Lanterns of the Deeps quest', () => {
  it('triggers only after the sigils and in the correct rooms', () => {
    const game = new Game([new Act3()])

    const quest = new LanternsOfTheDeepsQuest()

    // No sigils -> no trigger regardless of room
    game.state.currentRoom = game.state.allRooms.CollapsedPier
    game.state.setStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, false)
    expect(quest.checkTrigger(game.state)).toBe(false)

    // After sigils complete -> triggers in Collapsed Pier
    game.state.setStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, true)
    // But brackets not yet found -> still no trigger
    expect(quest.checkTrigger(game.state)).toBe(false)

    // Discover brackets via SubmergedAntechamber.search which should set flag
    game.state.currentRoom = game.state.allRooms.SubmergedAntechamber
    game.state.currentRoom.search(game.state)
    expect(game.state.getStoryFlag(FLAG_ACT3_LANTERN_BRACKETS_FOUND)).toBe(true)

    // Now the quest should trigger in the Collapsed Pier and the Antechamber
    game.state.currentRoom = game.state.allRooms.CollapsedPier
    expect(quest.checkTrigger(game.state)).toBe(true)

    // Triggers in Submerged Antechamber as well
    game.state.currentRoom = game.state.allRooms.SubmergedAntechamber
    expect(quest.checkTrigger(game.state)).toBe(true)
  })
})
