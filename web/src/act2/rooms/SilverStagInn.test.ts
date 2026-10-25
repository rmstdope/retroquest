import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'

describe('The Silver Stag Inn', () => {
  it('is searched with a single "the" before its name', () => {
    const game = new Game([new Act2()])
    const inn = game.state.allRooms.SilverStagInn
    expect(inn.search(game.state)).toBe(
      'You search around the [room_name]Silver Stag Inn[/room_name], but find ' +
        'nothing of interest beyond what you can already see.',
    )
  })
})
