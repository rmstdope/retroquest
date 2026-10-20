import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import {
  FLAG_ACT3_TIDEWARD_SIGILS_STARTED,
  FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED,
} from '../Act3StoryFlags'
import { TidewardSigilsQuest } from './TidewardSigils'

describe('Tideward Sigils quest', () => {
  it('triggers on the started flag and completes on the completed flag', () => {
    const game = new Game([new Act3()])

    const quest = new TidewardSigilsQuest()

    // By default, not started
    game.state.setStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_STARTED, false)
    expect(quest.checkTrigger(game.state)).toBe(false)

    // When started flag set -> trigger true
    game.state.setStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_STARTED, true)
    expect(quest.checkTrigger(game.state)).toBe(true)

    // Completion follows completed flag
    game.state.setStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, false)
    expect(quest.checkCompletion(game.state)).toBe(false)

    game.state.setStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, true)
    expect(quest.checkCompletion(game.state)).toBe(true)
  })
})
