import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { TheShadowOfThePast } from './TheShadowOfThePast'
import {
  FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED,
  FLAG_ACT4_SHADOW_OF_THE_PAST_STARTED,
} from '../Act4StoryFlags'

describe('TheShadowOfThePast', () => {
  it('has the agreed card and completion text', () => {
    const quest = new TheShadowOfThePast()
    expect(quest.name).toBe('The Shadow of the Past')
    expect(quest.description).toBe(
      'Among the broken memories a shadow reaches for scenes it cannot hold. Mend what it has lost, and learn whose voice it is.',
    )
    expect(quest.completion).toBe(
      "Elior learns that the voice from his dreams is what remains of Malakar's better self. The sealed door to the east now answers to the amulet.",
    )
  })

  it('starts and completes with its flags', () => {
    const game = new Game([new Act4()])
    const quest = new TheShadowOfThePast()
    expect(quest.checkTrigger(game.state)).toBe(false)
    game.state.setStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_STARTED, true)
    expect(quest.checkTrigger(game.state)).toBe(true)
    expect(quest.checkCompletion(game.state)).toBe(false)
    game.state.setStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED, true)
    expect(quest.checkCompletion(game.state)).toBe(true)
  })
})
