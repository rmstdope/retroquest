import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { executeCommands, expectDialogueSpeaker } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import { Locket } from '../items/Locket'
import { FadedPhotograph } from '../items/FadedPhotograph'

describe('Grandmother and the locket', () => {
  it('recognises the locket as her daughter’s founders’ heirloom', () => {
    const game = new Game([new Act1()])
    game.state.addItemToInventory(new Locket())

    const response = executeCommands(game, ['give locket to grandmother'])

    expect(response).toContain("this was your mother's")
    expect(response).toContain('all the way back to the founders')
    expect(game.state.hasItem('travel cloak')).toBe(true)
  })
})

describe('Grandmother and the faded photograph', () => {
  it('points Elior to the fisherman at the Riverbank once the message is read', () => {
    const game = new Game([new Act1()])
    game.state.addItemToInventory(new FadedPhotograph())

    executeCommands(game, ['examine faded photograph'])

    const response = executeCommands(game, [
      'give faded photograph to grandmother',
    ])

    expect(response).toContain('Your mother loved the river.')
    expect(response).toContain('[room_name]Riverbank[/room_name]')
    expectDialogueSpeaker(response, 'grandmother')
  })
})
