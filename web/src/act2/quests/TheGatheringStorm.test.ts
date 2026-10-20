import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import {
  FLAG_DEMONSTRATED_COMBAT_SKILLS,
  FLAG_SPOKEN_TO_SIR_CEDRIC,
} from '../Act2StoryFlags'
import { TheGatheringStormQuest } from './TheGatheringStorm'

describe('The Gathering Storm log', () => {
  it('is a journal of the arrival until something happens', () => {
    const game = new Game([new Act2()])
    const quest = new TheGatheringStormQuest()

    expect(quest.checkUpdate(game.state)).toBe(false)

    expect(quest.details()).toEqual({
      kind: 'journal',
      latest: quest.description.trim(),
      earlier: [],
    })
  })

  it('moves each finished stage to the earlier entries, dimmed in the prose', () => {
    const game = new Game([new Act2()])
    const quest = new TheGatheringStormQuest()
    game.state.setStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC, true)

    expect(quest.checkUpdate(game.state)).toBe(true)
    expect(quest.checkUpdate(game.state)).toBe(false)
    game.state.setStoryFlag(FLAG_DEMONSTRATED_COMBAT_SKILLS, true)
    expect(quest.checkUpdate(game.state)).toBe(true)

    const details = quest.details()
    if (details.kind !== 'journal') throw new Error('expected a journal')
    expect(details.earlier).toHaveLength(2)
    expect(details.latest).toContain('Having proven your martial prowess')
    expect(quest.description).toContain('[dim]Having just arrived')
    expect(quest.description).toContain('allies with magical knowledge. [/dim]')
    expect(quest.description.endsWith(quest.latestStage ?? '')).toBe(true)
  })
})
