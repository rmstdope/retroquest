import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { FLAG_ACT4_REDEMPTION_ENDING } from '../Act4StoryFlags'
import { Nyx } from './Nyx'
import {
  executeCommands,
  expectItemInInventory,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

/** An Act IV game standing in Willowbrook Field after the Redemption ending. */
function home(): Game {
  const game = new Game([new Act4()])
  game.state.setStoryFlag(FLAG_ACT4_REDEMPTION_ENDING, true)
  game.state.currentRoom = game.state.allRooms.WillowbrookField
  return game
}

describe('Nyx at the hedge', () => {
  it('takes her token back once and the light comes back brighter', () => {
    const game = home()
    expectItemInInventory(game.state, "Nyx's Token", true)

    const given = executeCommands(game, ["give nyx's token to nyx"])

    expect(given).toContain('the two of them are gone into the hedge together')
    expectItemInInventory(game.state, "Nyx's Token", false)
    expectMarkupWellFormed(given)
    expect(executeCommands(game, ['examine nyx'])).toContain(
      'her pendant is where it belongs now.',
    )
  })

  it('takes the crystal into the hedge, and remembers both across a reload', () => {
    const game = home()
    executeCommands(game, [
      "give nyx's token to nyx",
      'give forest heart crystal to nyx',
    ])
    expectItemInInventory(game.state, 'Forest Heart Crystal', false)
    const loaded = new Game([new Act4()])
    expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')
    const nyx = loaded.state.currentRoom.characters.find(
      (c) => c instanceof Nyx,
    ) as Nyx
    expect(nyx.tokenReturned).toBe(true)
    expect(nyx.crystalReturned).toBe(true)
    expect(executeCommands(loaded, ['examine nyx'])).toContain(
      'her pendant and the crystal with the forest in it are where they belong now.',
    )
  })

  it('leaves anything else in your hand', () => {
    const game = home()
    const out = executeCommands(game, ['give ancient amulet to nyx'])
    expect(out).toContain('leaves it in your hand. It is yours.')
    expectItemInInventory(game.state, 'Ancient Amulet', true)
  })
})

describe('Nyx and Grandmother described at home', () => {
  const NYX =
    'A small light in the hedge. The leaves are greener where it has settled.'
  const GRANDMOTHER =
    'Your grandmother at the gate, flour still on her apron. For once her hands are still.'

  it('describes them with the current words', () => {
    const game = home()
    expect(executeCommands(game, ['examine nyx'])).toContain(NYX)
    expect(executeCommands(game, ['examine grandmother'])).toContain(
      GRANDMOTHER,
    )
  })

  it('uses the current words in a save made before the rewrite', () => {
    const game = home()
    const field = game.state.allRooms.WillowbrookField
    const nyx = field.getCharacterByName('Nyx')
    const grandmother = field.getCharacterByName('Grandmother')
    if (!nyx || !grandmother) throw new Error('missing a character')
    nyx.description = 'A small light that flickers in the hedge, keeping close.'
    grandmother.description =
      'Your grandmother, waiting at the gate with her hands folded.'
    const loaded = new Game([new Act4()])
    expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')
    expect(executeCommands(loaded, ['examine nyx'])).toContain(NYX)
    expect(executeCommands(loaded, ['examine grandmother'])).toContain(
      GRANDMOTHER,
    )
  })
})
