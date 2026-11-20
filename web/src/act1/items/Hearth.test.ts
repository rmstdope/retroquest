import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../Act1'
import { FLAG_LANTERN_LIT } from '../Act1StoryFlags'
import { executeCommands } from '@/testing/gameHelpers'
import { Lantern } from './Lantern'

/** A new Act I game standing in the cottage. */
function cottageGame(): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.EliorsCottage
  return game
}

describe('Hearth', () => {
  it.each(['hearth', 'fire'])(
    'lights the dark lantern when it is used with the %s',
    (name) => {
      const game = cottageGame()
      const answer = executeCommands(game, [`use lantern with ${name}`])
      expect(answer).toContain('You touch the wick to a coal, and it takes.')
      expect(answer).toContain('A [item_name]journal[/item_name] appears')
      expect(answer).not.toContain("can't use")
      expect(game.state.getStoryFlag(FLAG_LANTERN_LIT)).toBe(true)
      expect(
        game.state.currentRoom.items.find((i) => i instanceof Lantern)?.name,
      ).toBe('lantern (lit)')
      expect(
        game.state.currentRoom.getItemByName("Elior's Journal"),
      ).not.toBeNull()
    },
  )

  it('leaves a lit lantern with its existing answer', () => {
    const game = cottageGame()
    executeCommands(game, ['use lantern'])
    const answer = executeCommands(game, ['use lantern with hearth'])
    expect(answer).toContain('is already lit.')
    expect(answer).not.toContain('wick to a coal')
  })

  it('saves and loads a lantern lit at the hearth', () => {
    const game = cottageGame()
    executeCommands(game, ['use lantern with hearth'])
    const loaded = new Game([new Act1()])
    loaded.loadSaveData(game.toSaveData())
    const lantern = loaded.state.currentRoom.items.find(
      (i) => i instanceof Lantern,
    )
    expect((lantern as Lantern).isLit()).toBe(true)
  })
})
