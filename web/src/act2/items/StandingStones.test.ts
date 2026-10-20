import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { NatureSenseSpell } from '../spells/NatureSenseSpell'
import { StandingStones } from './StandingStones'

describe('StandingStones', () => {
  it('teaches nature sense on the first examine', () => {
    const game = new Game([new Act2()])

    const answer = new StandingStones().examine(game.state)

    expect(answer).toContain('You have learned the spell')
    expect(game.state.hasSpell('nature_sense')).toBe(true)
  })

  it('does not teach nature sense again when it is already known', () => {
    const game = new Game([new Act2()])
    game.state.learnSpell(new NatureSenseSpell())

    const answer = new StandingStones().examine(game.state)

    expect(answer).not.toContain('You have learned the spell')
    expect(game.state.knownSpells).toHaveLength(1)
  })
})
