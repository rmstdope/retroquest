import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import { ShinyPebble } from './ShinyPebble'

describe('Shiny Pebble', () => {
  it('does not glint in sunlight in the dark glade', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.HiddenGlade
    const text = executeCommands(game, ['examine pebble'])
    expect(text).not.toContain('sunlight')
    expect(text).toContain('glints')
  })

  it('gives a pebble from an older save the current wording', () => {
    const game = new Game([new Act1()])
    const pebble = new ShinyPebble()
    pebble.description =
      'A small, smooth pebble that glints in the sunlight. It feels oddly ' +
      'warm to the touch.'
    pebble.refreshSavedText(game.state)
    expect(pebble.description).toBe(new ShinyPebble().description)
  })
})
