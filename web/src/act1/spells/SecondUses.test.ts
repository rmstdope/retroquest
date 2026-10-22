import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../Act1'
import { FLAG_MAGIC_FULLY_UNLOCKED } from '../Act1StoryFlags'
import { Rope } from '../items/Rope'
import { ReviveSpell } from './ReviveSpell'
import { UnlockSpell } from './UnlockSpell'
import { PurifySpell } from './PurifySpell'
import { HealSpell } from './HealSpell'
import { GrowSpell } from './GrowSpell'
import { Snare } from '../items/Snare'
import { executeCommands } from '@/testing/gameHelpers'

/** An Act I game with every Act I spell known and magic unlocked, standing in the named room. */
function awakeIn(roomKey: string): Game {
  const game = new Game([new Act1()])
  game.state.setStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED, true)
  for (const spell of [
    new ReviveSpell(),
    new UnlockSpell(),
    new PurifySpell(),
    new HealSpell(),
    new GrowSpell(),
  ]) {
    game.state.learnSpell(spell)
  }
  game.state.currentRoom = game.state.allRooms[roomKey]
  return game
}

describe('each Act I spell has a second, rewarded use', () => {
  it('revive greens the bush and hints that fruit wants another spell', () => {
    const game = awakeIn('ForestPath')
    const out = executeCommands(game, ['cast revive on bush'])
    expect(out).toContain(
      'Life it has. It bears nothing; fruit wants something else of you.',
    )
    expect(game.state.currentRoom.getItemByName('wild berries')).toBeNull()
  })

  it('unlock finds no lock on the mill mechanism, before and after it is jammed', () => {
    const game = awakeIn('OldMill')
    expect(executeCommands(game, ['cast unlock on mechanism'])).toContain(
      'never meant to be opened, only to run.',
    )
    game.state.addItemToInventory(new Rope())
    executeCommands(game, ['use rope with mechanism'])
    expect(executeCommands(game, ['cast unlock on mechanism'])).toContain(
      'only to run, and now not even that.',
    )
  })

  it("purify finds the river clean and remembers Elior's mother", () => {
    const game = awakeIn('Riverbank')
    const out = executeCommands(game, ['cast purify on river'])
    expect(out).toContain('The river was never the trouble.')
    expect(out).toContain('the water remembers her better than it needs you.')
  })

  it('heal on the snared kit says the wire comes first, and finds nothing once it is cut', () => {
    const game = awakeIn('ForestPath')
    const snare = new Snare()
    game.state.currentRoom.addItem(snare)
    expect(executeCommands(game, ['cast heal on kit'])).toContain(
      'The wire is still in the leg; mending flesh around iron would be ' +
        'cruelty, and the kit knows it before you do.',
    )
    snare.freed = true
    expect(executeCommands(game, ['cast heal on snare'])).toContain(
      'The kit took its leg with it, and it was whole enough to run.',
    )
  })

  it("grow crowds Mira's herb pot and she does not complain", () => {
    const game = awakeIn('MirasHut')
    const out = executeCommands(game, ['cast grow on herb'])
    expect(out).toContain('twice what it was.')
    expect(out).toContain('Now there is more of it. I will not complain.')
  })
})
