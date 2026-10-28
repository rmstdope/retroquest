import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { SilverTree } from './SilverTree'
import { AncientTreeSpirit } from '../characters/AncientTreeSpirit'
import { AncientGrove } from '../rooms/AncientGrove'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

const BANNED = /wise|wisdom|older than memory|reverent|essence|magnificent/i

/** A game standing in the Ancient Grove with a fresh silver-barked tree. */
function inGrove(): { game: Game; tree: SilverTree } {
  const game = new Game([new Act2()])
  const grove = game.state.allRooms.AncientGrove
  if (!(grove instanceof AncientGrove)) throw new Error('no Ancient Grove')
  game.state.currentRoom = grove
  return { game, tree: new SilverTree() }
}

describe('Silver-barked tree', () => {
  it('has a plain description that does not name the spirit yet', () => {
    const { tree } = inGrove()
    expect(tree.description).toBe(
      'A tree taller than any around it, with bark the colour of tarnished ' +
        'silver, warm to the touch. Something lives in it; you can feel it ' +
        'the way you feel someone in a dark room.',
    )
  })

  it('wakes the spirit by name on the first look in the grove', () => {
    const { game, tree } = inGrove()

    const answer = tree.examine(game.state)

    expect(answer).toBe(
      'The tree stands taller than anything around it. Its bark is silver, ' +
        'smooth as metal and warm under your hand. You stand there long ' +
        'enough, and something in the wood turns over, like a sleeper ' +
        'waking. The [character_name]ancient tree spirit[/character_name] ' +
        'is awake.',
    )
    expect(
      game.state.currentRoom.characters.some(
        (c) => c instanceof AncientTreeSpirit,
      ),
    ).toBe(true)
    expectMarkupWellFormed(answer)
  })

  it('says one plain thing on later looks', () => {
    const { game, tree } = inGrove()
    tree.examine(game.state)

    const answer = tree.examine(game.state)

    expect(answer).toBe(
      'The silver bark is warm under your hand. Somewhere in it, the spirit ' +
        'is listening.',
    )
    expect(answer).not.toMatch(BANNED)
  })
})
