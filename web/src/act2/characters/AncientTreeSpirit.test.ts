import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { AncientTreeSpirit } from './AncientTreeSpirit'
import { CrystalClearWater } from '../items/CrystalClearWater'
import { Moonflowers } from '../items/Moonflowers'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

/** A game running Act II. */
function createGame(): Game {
  return new Game([new Act2()])
}

describe('Ancient Tree Spirit dialogue markup', () => {
  it('names the spirit before its dialogue when giving the glade gifts', () => {
    const game = createGame()
    const spirit = new AncientTreeSpirit()
    const moonflowers = new Moonflowers()
    game.state.addItemToInventory(new CrystalClearWater())
    game.state.addItemToInventory(moonflowers)

    const answer = spirit.giveItem(game.state, moonflowers)

    expect(answer).toContain('Heart of the Forest')
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, spirit.name)
  })
})
