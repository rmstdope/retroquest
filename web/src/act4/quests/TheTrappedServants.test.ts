import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import {
  FLAG_ACT4_TRAPPED_SERVANTS_STARTED,
  FLAG_ACT4_TRAPPED_SERVANTS_COMPLETED,
} from '../Act4StoryFlags'
import { TheTrappedServants } from './TheTrappedServants'

/** A fresh Act IV game, with the quest under test and no flags set. */
function setup(): { game: Game; quest: TheTrappedServants } {
  const act = new Act4()
  act.musicFile = ''
  const game = new Game([act])
  game.state.storyFlags = {}
  return { game, quest: new TheTrappedServants() }
}

describe('TheTrappedServants', () => {
  it('is named The Trapped Servants and is a side quest', () => {
    const { quest } = setup()
    expect(quest.name).toBe('The Trapped Servants')
    expect(quest.isMain()).toBe(false)
  })

  it('triggers on its start flag', () => {
    const { game, quest } = setup()
    expect(quest.checkTrigger(game.state)).toBe(false)
    game.state.setStoryFlag(FLAG_ACT4_TRAPPED_SERVANTS_STARTED, true)
    expect(quest.checkTrigger(game.state)).toBe(true)
  })

  it('completes on its completion flag, and triggers if it was missed', () => {
    const { game, quest } = setup()
    expect(quest.checkCompletion(game.state)).toBe(false)
    game.state.setStoryFlag(FLAG_ACT4_TRAPPED_SERVANTS_COMPLETED, true)
    expect(quest.checkCompletion(game.state)).toBe(true)
    expect(quest.checkTrigger(game.state)).toBe(true)
  })
})
