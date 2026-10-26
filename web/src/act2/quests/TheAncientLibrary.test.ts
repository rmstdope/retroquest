import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import {
  FLAG_ANCIENT_LIBRARY_COMPLETED,
  FLAG_HEALERS_APPRENTICE_COMPLETED,
} from '../Act2StoryFlags'
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

  it('raises the completed flag when the engine settles it', () => {
    const game = new Game([new Act2()])
    const quest = new TheAncientLibraryQuest()
    game.state.activatedQuests = [quest]
    game.state.learnSpell(new DispelSpell())
    game.state.setStoryFlag(FLAG_HEALERS_APPRENTICE_COMPLETED, true)

    expect(quest.checkCompletion(game.state)).toBe(true)
    expect(game.state.settleQuests().completed).toEqual([quest])
    expect(game.state.getStoryFlag(FLAG_ANCIENT_LIBRARY_COMPLETED)).toBe(true)
  })

  it('leaves the completed flag down while the quest is unfinished', () => {
    const game = new Game([new Act2()])
    const quest = new TheAncientLibraryQuest()
    game.state.learnSpell(new DispelSpell())

    expect(quest.checkCompletion(game.state)).toBe(false)
    expect(game.state.getStoryFlag(FLAG_ANCIENT_LIBRARY_COMPLETED)).toBe(false)
  })
})
