import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { TruthSight } from './TruthSight'
import { Mirrors } from '../items/Mirrors'
import { KnightOfDespair } from '../characters/KnightOfDespair'
import { TrueSelf } from '../characters/TrueSelf'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

describe('TruthSight', () => {
  it('has the agreed name and description and answers to its name', () => {
    const spell = new TruthSight()
    expect(spell.name).toBe('Truth Sight')
    expect(spell.description).toBe(
      'See through illusion to what is really there.',
    )
    expect(spell.answersTo('truth sight')).toBe(true)
    expect(spell.answersTo('truth_sight')).toBe(true)
  })

  it('finds nothing hidden in anything but the knight', () => {
    const game = new Game([new Act4()])
    const spell = new TruthSight()
    const answers = [
      spell.castSpell(game.state),
      spell.castOnItem(game.state, new Mirrors()),
      spell.castOnCharacter(game.state, new TrueSelf()),
    ]
    for (const answer of answers) {
      expect(answer).toBe(
        '[dim]Your sight sharpens, but there is no illusion here to see through.[/dim]',
      )
      expectMarkupWellFormed(answer)
    }
  })

  it('shows the knight as he is, and says so once', () => {
    const game = new Game([new Act4()])
    const spell = new TruthSight()
    const knight = new KnightOfDespair()
    expect(spell.castOnCharacter(game.state, knight)).toContain(
      'Behind the visor, the knight is weeping.',
    )
    expect(spell.castOnCharacter(game.state, knight)).toBe(
      '[dim]You have already seen the knight as he truly is.[/dim]',
    )
  })
})
