import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { TheSorceressOfLies } from './TheSorceressOfLies'
import {
  FLAG_ACT4_BADGE_SHOWN,
  FLAG_ACT4_HEARTS_TRUTH_CAST,
  FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED,
  FLAG_ACT4_SORCERESS_OF_LIES_STARTED,
  FLAG_ACT4_STAFF_HEARD,
  FLAG_ACT4_WHISPERS_HEARD,
} from '../Act4StoryFlags'

describe('TheSorceressOfLies', () => {
  it('has the agreed card and completion text', () => {
    const quest = new TheSorceressOfLies()
    expect(quest.name).toBe('The Sorceress of Lies')
    expect(quest.description).toBe(
      "At the top of the tower the Sorceress of Lies holds court, and the mask on her staff is the mark from Elena's wrist. Listen past her lies, to what is under them.",
    )
    expect(quest.completion).toBe(
      "Elior listens past the Sorceress's lies and answers the loneliness beneath them. She confesses the curse on Elena, and the arch to the north opens.",
    )
  })

  it('starts and completes with its flags', () => {
    const game = new Game([new Act4()])
    const quest = new TheSorceressOfLies()
    expect(quest.checkTrigger(game.state)).toBe(false)
    game.state.setStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_STARTED, true)
    expect(quest.checkTrigger(game.state)).toBe(true)
    expect(quest.checkCompletion(game.state)).toBe(false)
    game.state.setStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED, true)
    expect(quest.checkCompletion(game.state)).toBe(true)
  })

  it('moves its hint on at each stage: the badge, a heart, all three', () => {
    const game = new Game([new Act4()])
    game.state.storyFlags = {}
    const quest = new TheSorceressOfLies()
    const hintAfter = (flags: string[]): string | null => {
      for (const flag of flags) game.state.setStoryFlag(flag, true)
      quest.checkUpdate(game.state)
      return quest.hint(game.state)
    }
    const hints = [
      hintAfter([]),
      hintAfter([FLAG_ACT4_BADGE_SHOWN]),
      hintAfter([FLAG_ACT4_HEARTS_TRUTH_CAST]),
      hintAfter([FLAG_ACT4_STAFF_HEARD, FLAG_ACT4_WHISPERS_HEARD]),
    ]
    expect(new Set(hints).size).toBe(hints.length)
  })
})
