import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { RunicWalls } from './RunicWalls'
import { EchoChambers } from '../rooms/EchoChambers'
import { FLAG_ACT3_ECHO_HEARD } from '../Act3StoryFlags'
import { expectMarkupWellFormed, expectStoryFlag } from '@/testing/gameHelpers'

describe('RunicWalls markup', () => {
  it('examining the walls uses only known, balanced tags', () => {
    const game = new Game([new Act3()])

    const answer = new RunicWalls().examine(game.state)

    expect(answer).toContain('chant to quiet the phantoms')
    expectMarkupWellFormed(answer)
  })
})

describe('RunicWalls echo', () => {
  const CHANT =
    "The runes describe a chant to quiet the phantoms: 'Let stillness echo, let silence bind.'"
  const ECHO = 'It is a wound. You know it is. Stay. Wait with us.'

  it('reveals the chant first and plays the echo on the second examine only', () => {
    const game = new Game([new Act3()])
    game.state.currentRoom = new EchoChambers()
    const walls = new RunicWalls()

    expect(walls.examine(game.state)).toContain(CHANT)
    const second = walls.examine(game.state)
    expect(second).toContain(ECHO)
    expect(second).not.toContain(CHANT)
    expectMarkupWellFormed(second)
    expectStoryFlag(game.state, FLAG_ACT3_ECHO_HEARD, true)

    expect(walls.examine(game.state)).toContain(CHANT)
    expect(walls.examine(game.state)).toContain(CHANT)
  })

  it('gives the usual reply every time once the echo was heard by listening', () => {
    const game = new Game([new Act3()])
    game.state.currentRoom = new EchoChambers()
    const walls = new RunicWalls()

    game.listen()
    expect(walls.examine(game.state)).toContain(CHANT)
    expect(walls.examine(game.state)).toContain(CHANT)
  })
})
