import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { TheParentsLegacy } from './TheParentsLegacy'
import {
  FLAG_ACT4_PARENTS_LEGACY_COMPLETED,
  FLAG_ACT4_PARENTS_LEGACY_STARTED,
} from '../Act4StoryFlags'

describe('TheParentsLegacy', () => {
  it('has the agreed card and completion text', () => {
    const quest = new TheParentsLegacy()
    expect(quest.name).toBe("The Parent's Legacy")
    expect(quest.description).toBe(
      "Behind the sealed door, Aren and Lysa's last memories wait. Look into them, and learn the whole truth before the throne room.",
    )
    expect(quest.completion).toBe(
      "Elior sees the whole truth: his parents' friendship with Malakar, the wound, and the ward they became. The way north to the Throne Chamber opens.",
    )
  })

  it('starts and completes with its flags', () => {
    const game = new Game([new Act4()])
    const quest = new TheParentsLegacy()
    expect(quest.checkTrigger(game.state)).toBe(false)
    game.state.setStoryFlag(FLAG_ACT4_PARENTS_LEGACY_STARTED, true)
    expect(quest.checkTrigger(game.state)).toBe(true)
    expect(quest.checkCompletion(game.state)).toBe(false)
    game.state.setStoryFlag(FLAG_ACT4_PARENTS_LEGACY_COMPLETED, true)
    expect(quest.checkCompletion(game.state)).toBe(true)
  })
})
