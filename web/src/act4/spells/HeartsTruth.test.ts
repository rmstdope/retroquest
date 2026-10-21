import { describe, it, expect } from 'vitest'
import { Malakar } from '../characters/Malakar'
import { TrappedServants } from '../characters/TrappedServants'
import {
  FLAG_ACT4_SERVANTS_FREED,
  FLAG_ACT4_THRONE_REFRAIN_SAID,
} from '../Act4StoryFlags'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'
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

describe('HeartsTruth optional targets', () => {
  it('hears the Shadow beneath Malakar until the refrain is said, every time', () => {
    const game = new Game([new Act4()])
    const spell = new HeartsTruth()
    const malakar = new Malakar()
    const before = JSON.stringify(game.toSaveData())
    const line = spell.castOnCharacter(game.state, malakar)
    expect(line).toContain('The Shadow is here, in the room')
    expectMarkupWellFormed(line)
    expect(spell.castOnCharacter(game.state, malakar)).toBe(line)
    expect(JSON.stringify(game.toSaveData())).toBe(before)
    game.state.setStoryFlag(FLAG_ACT4_THRONE_REFRAIN_SAID, true)
    expect(spell.castOnCharacter(game.state, malakar)).toBe(NOTHING)
  })

  it('hears the freed servants, but not the trapped ones', () => {
    const game = new Game([new Act4()])
    const spell = new HeartsTruth()
    const servants = new TrappedServants()
    expect(spell.castOnCharacter(game.state, servants)).toBe(NOTHING)
    game.state.setStoryFlag(FLAG_ACT4_SERVANTS_FREED, true)
    const line = spell.castOnCharacter(game.state, servants)
    expect(line).toContain('afraid to go home and find no one waiting')
    expectMarkupWellFormed(line)
    expect(spell.castOnCharacter(game.state, servants)).toBe(line)
  })
})
