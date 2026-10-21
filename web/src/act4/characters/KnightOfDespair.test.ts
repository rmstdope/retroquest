import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { KnightOfDespair } from './KnightOfDespair'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

describe('KnightOfDespair', () => {
  it('answers to knight and turns Elior away', () => {
    const game = new Game([new Act4()])
    const knight = new KnightOfDespair()
    expect(knight.answersTo('knight')).toBe(true)
    expect(knight.answersTo('Knight of Despair')).toBe(true)
    expect(knight.answersTo('captain')).toBe(false)
    const talk = knight.talkTo(game.state)
    expectDialogueSpeaker(talk, 'Knight of Despair')
    expect(talk).toContain('Return when you have the truth.')
    const look = knight.examine(game.state)
    expect(look).toContain('His visor is down')
    expectMarkupWellFormed(look)
  })
})
