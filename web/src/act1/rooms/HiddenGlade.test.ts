import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../Act1'
import { LightSpell } from '../spells/LightSpell'

/** An Act I game standing in the Hidden Glade, knowing `light`. */
function gameInGlade(): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.HiddenGlade
  game.state.learnSpell(new LightSpell())
  return game
}

describe('Hidden Glade', () => {
  it('is dim and overgrown until light is cast', () => {
    const game = gameInGlade()
    const before = game.state.currentRoom.describe(game.state)
    expect(before).toContain('dim')
    expect(before).not.toContain('golden sunlight')

    game.commandParser.parse('cast light')

    const after = game.state.currentRoom.describe(game.state)
    expect(after).toContain('golden sunlight')
    expect(after).not.toContain('darkness')
  })
})
