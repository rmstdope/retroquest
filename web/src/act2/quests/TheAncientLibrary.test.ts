import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { FLAG_HEALERS_APPRENTICE_COMPLETED } from '../Act2StoryFlags'
import { DispelSpell } from '../spells/DispelSpell'
import { TheAncientLibraryQuest } from './TheAncientLibrary'

describe('The Ancient Library completion', () => {
  it('counts the Crystal Focus after it has been given to Lyria', () => {
    const game = new Game([new Act2()])
    const quest = new TheAncientLibraryQuest()
    game.state.learnSpell(new DispelSpell())
    game.state.setStoryFlag(FLAG_HEALERS_APPRENTICE_COMPLETED, true)

    expect(game.state.hasItem('Crystal Focus')).toBe(false)
    expect(quest.checkCompletion(game.state)).toBe(true)
  })

  it('still requires learning Dispel after giving Lyria the focus', () => {
    const game = new Game([new Act2()])
    const quest = new TheAncientLibraryQuest()
    game.state.setStoryFlag(FLAG_HEALERS_APPRENTICE_COMPLETED, true)

    expect(quest.checkCompletion(game.state)).toBe(false)
  })
})
