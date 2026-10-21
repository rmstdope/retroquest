import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import {
  FLAG_ACT4_SHATTERED_WARD_GUARDIANS_STARTED,
  FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED,
} from '../Act4StoryFlags'
import { ShatteredWardGuardians } from './ShatteredWardGuardians'

/** A fresh Act IV game, with the quest under test and no flags set. */
function setup(): { game: Game; quest: ShatteredWardGuardians } {
  const act = new Act4()
  act.musicFile = ''
  const game = new Game([act])
  game.state.storyFlags = {}
  return { game, quest: new ShatteredWardGuardians() }
}

describe('ShatteredWardGuardians', () => {
  it('is named Shattered Ward Guardians and is a side quest', () => {
    const { quest } = setup()
    expect(quest.name).toBe('Shattered Ward Guardians')
    expect(quest.isMain()).toBe(false)
  })

  it('triggers on its start flag', () => {
    const { game, quest } = setup()
    expect(quest.checkTrigger(game.state)).toBe(false)
    game.state.setStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_STARTED, true)
    expect(quest.checkTrigger(game.state)).toBe(true)
  })

  it('completes on its completion flag, and triggers if it was missed', () => {
    const { game, quest } = setup()
    expect(quest.checkCompletion(game.state)).toBe(false)
    game.state.setStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED, true)
    expect(quest.checkCompletion(game.state)).toBe(true)
    expect(quest.checkTrigger(game.state)).toBe(true)
  })
})
