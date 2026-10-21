import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { FLAG_ACT4_MAIN_STARTED } from '../Act4StoryFlags'
import { TheFinalStand } from './TheFinalStand'

/** A fresh Act IV game, with the quest under test and no flags set. */
function setup(): { game: Game; quest: TheFinalStand } {
  const act = new Act4()
  act.musicFile = ''
  const game = new Game([act])
  game.state.storyFlags = {}
  return { game, quest: new TheFinalStand() }
}

describe('TheFinalStand', () => {
  it('is named The Final Stand and is the main quest', () => {
    const { quest } = setup()
    expect(quest.name).toBe('The Final Stand')
    expect(quest.isMain()).toBe(true)
  })

  it('triggers on its start flag', () => {
    const { game, quest } = setup()
    expect(quest.checkTrigger(game.state)).toBe(false)
    game.state.setStoryFlag(FLAG_ACT4_MAIN_STARTED, true)
    expect(quest.checkTrigger(game.state)).toBe(true)
  })
})
