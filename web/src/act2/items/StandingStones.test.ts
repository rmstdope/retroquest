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

  it('names the spell exactly as the spell list does', () => {
    const game = new Game([new Act2()])

    const answer = new StandingStones().examine(game.state)

    expect(answer).toContain(
      'suddenly you understand how to cast the [spell_name]nature sense[/spell_name] spell![/success]',
    )
    expect(answer).toContain(
      'You have learned the spell: [spell_name]nature sense[/spell_name]!',
    )
    expect(
      answer.match(/\[spell_name\]nature sense\[\/spell_name\]/g),
    ).toHaveLength(2)
    expect(answer.toLowerCase()).not.toContain("nature's sense")
    expect(answer.toLowerCase()).not.toContain('nature sense spell')
  })

  it('answers a second look with the short line', () => {
    const game = new Game([new Act2()])
    const stones = new StandingStones()
    stones.examine(game.state)

    expect(stones.examine(game.state)).toBe(
      'The standing stones continue to pulse with ancient magic, their druidic runes a ' +
        'testament to the old ways.',
    )
  })

  it('does not teach nature sense again when it is already known', () => {
    const game = new Game([new Act2()])
    game.state.learnSpell(new NatureSenseSpell())

    const answer = new StandingStones().examine(game.state)

    expect(answer).not.toContain('You have learned the spell')
    expect(game.state.knownSpells).toHaveLength(1)
  })
})
