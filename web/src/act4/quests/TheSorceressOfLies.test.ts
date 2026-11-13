import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { TheSorceressOfLies } from './TheSorceressOfLies'
import {
  FLAG_ACT4_BADGE_SHOWN,
  FLAG_ACT4_HEARTS_TRUTH_CAST,
  FLAG_ACT4_STAFF_HEARD,
  FLAG_ACT4_WHISPERS_HEARD,
} from '../Act4StoryFlags'

describe('TheSorceressOfLies', () => {
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
