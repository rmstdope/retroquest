import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { Steles } from './Steles'

describe('Steles', () => {
  it('exist in the Shoreline Markers and can be examined', () => {
    const game = new Game([new Act3()])
    const room = game.state.allRooms.ShorelineMarkers
    const steles = room.items.find((i) => i instanceof Steles)
    expect(steles).toBeDefined()

    const out = (steles as Steles).examine(game.state)

    expect(typeof out).toBe('string')
  })
})
