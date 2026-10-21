import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { HeartsTruth } from './HeartsTruth'
import { TrueSelf } from '../characters/TrueSelf'
import { Echoes } from '../items/Echoes'

const NOTHING =
  '[dim]You listen for a hidden heart, but there is no lie here to hear beneath.[/dim]'

describe('HeartsTruth', () => {
  it('has the agreed name and description', () => {
    const spell = new HeartsTruth()
    expect(spell.name).toBe("Heart's Truth")
    expect(spell.description).toBe('Hear the true heart beneath a lie.')
    expect(spell.answersTo("heart's truth")).toBe(true)
  })

  it('hears nothing without a target, in an item or in anyone else', () => {
    const game = new Game([new Act4()])
    const spell = new HeartsTruth()
    expect(spell.castSpell(game.state)).toBe(NOTHING)
    expect(spell.castOnItem(game.state, new Echoes())).toBe(NOTHING)
    expect(spell.castOnCharacter(game.state, new TrueSelf())).toBe(NOTHING)
  })
})
