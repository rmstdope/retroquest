import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { MAIN_SQUARE_DESCRIPTION } from './MainSquare'
import { HEALERS_HOUSE_DESCRIPTION } from './HealersHouse'
import { RESIDENTIAL_QUARTER_DESCRIPTION } from './ResidentialQuarter'

const MAIN_SQUARE =
  'The heart of Greendale: a great fountain of old heroes fighting beasts, ' +
  'stalls under bright awnings, red roofs all round. The square is crowded, ' +
  'but the talk is low, and it stops when a guard walks past. Castle towers ' +
  'rise to the north.'
const HEALERS_HOUSE =
  'A small stone house that smells of crushed herbs. A few bundles of dried ' +
  'plants still hang from the rafters, but the shelves below them are nearly ' +
  'bare: rows of empty bottles, rinsed and waiting. A fire burns in the ' +
  'hearth, and a door at the back stands half shut.'
const RESIDENTIAL_QUARTER =
  'Quiet lanes of two-storey houses, each with a small garden and a ' +
  'workshop. Craftsmen work at benches in the open doorways, and neighbours ' +
  'sit on their steps. Half the garden plots have gone grey.'

describe('Greendale room texts', () => {
  it('describe the rooms as their people do', () => {
    const game = new Game([new Act2()])
    const rooms = game.state.allRooms
    expect(rooms.MainSquare.description).toBe(MAIN_SQUARE)
    expect(rooms.HealersHouse.description).toBe(HEALERS_HOUSE)
    expect(rooms.ResidentialQuarter.description).toBe(RESIDENTIAL_QUARTER)
  })

  it('give older saves the current wording on load', () => {
    const game = new Game([new Act2()])
    const rooms = game.state.allRooms
    rooms.MainSquare.description = 'old'
    rooms.HealersHouse.description = 'old'
    rooms.ResidentialQuarter.description = 'old'
    new Act2().afterLoad(game.state)
    expect(rooms.MainSquare.description).toBe(MAIN_SQUARE_DESCRIPTION)
    expect(rooms.HealersHouse.description).toBe(HEALERS_HOUSE_DESCRIPTION)
    expect(rooms.ResidentialQuarter.description).toBe(
      RESIDENTIAL_QUARTER_DESCRIPTION,
    )
    expect(rooms.MainSquare.description).toBe(MAIN_SQUARE)
  })

  it('has the search open the old cellar door without naming a command', () => {
    const game = new Game([new Act2()])
    const room = game.state.allRooms.ResidentialQuarter
    const text = room.search(game.state)
    expect(text).toBe(
      '[success]You work at the bricks of the old cellar door. The mortar is ' +
        'soft, and they come away in your hands. Behind them, steps lead down ' +
        'into the cold, to a passage under the city and a room full of ' +
        'books.[/success]',
    )
    expect(text).not.toContain('go secret_passage')
    expect(room.exits.secret_passage).toBe('HiddenLibrary')
  })
})
