import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { SirCedric } from '../characters/SirCedric'
import { Caravan } from '../items/Caravan'
import { TrainingSword } from '../items/TrainingSword'
import { MendSpell } from './MendSpell'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

/** An Act II game where the player knows the Mend spell. */
function createGameKnowingMend(): Game {
  const game = new Game([new Act2()])
  game.state.learnSpell(new MendSpell())
  return game
}

describe('Casting mend through the command parser', () => {
  it("leaves the notch in Cedric's training sword on purpose", () => {
    const game = createGameKnowingMend()
    game.state.addItemToInventory(new TrainingSword())

    const out = game.commandParser.parse('cast mend on training sword')

    expect(out).toContain(
      'Somebody cut that notch as a boy, and it is how he will know the ' +
        'blade. You leave it as it is.',
    )
    expect(out).not.toContain('restoring it to working condition')
  })

  it('has no effect on an undamaged item', () => {
    const game = createGameKnowingMend()
    game.commandParser.parse('take walking stick')

    const answer = game.commandParser.parse('cast mend on walking stick')

    expect(answer).toContain("doesn't appear to need any repairs")
    expectMarkupWellFormed(answer)
  })

  it('repairs a damaged item', () => {
    const game = createGameKnowingMend()
    game.state.currentRoom.addItem(new Caravan())

    const answer = game.commandParser.parse('cast mend on caravan')

    expect(answer).toContain('repairing damage')
    expectMarkupWellFormed(answer)
  })

  it('fizzles on a character', () => {
    const game = createGameKnowingMend()
    game.state.currentRoom.addCharacter(new SirCedric())

    const answer = game.commandParser.parse('cast mend on sir cedric')

    expect(answer).toContain('fizzles')
    expectMarkupWellFormed(answer)
  })

  it('fails on a missing target', () => {
    const game = createGameKnowingMend()

    const answer = game.commandParser.parse('cast mend on teapot')

    expect(answer).toContain("You don't see a 'teapot'")
    expectMarkupWellFormed(answer)
  })

  it('finds nothing without a target', () => {
    const game = createGameKnowingMend()

    const answer = game.commandParser.parse('cast mend')

    expect(answer).toContain('finds nothing that needs mending')
    expectMarkupWellFormed(answer)
  })
})
