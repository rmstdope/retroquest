import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../Act1'
import { executeCommands } from '@/testing/gameHelpers'

/** An Act I game standing in the named room. */
function gameIn(room: string): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms[room]
  return game
}

describe('Act I set-up descriptions', () => {
  it('names the bend and the flat stone at the Riverbank, without a mood line', () => {
    const game = gameIn('Riverbank')
    const text = game.state.currentRoom.describe(game.state)
    expect(text).toContain(
      'A gentle river flows past the village and makes a slow bend here, ' +
        "past the reeds and a broad, flat stone at the water's edge. " +
        'Insects hum over the water. A weathered ',
    )
    expect(text).toContain(
      'sits on an upturned crate at the bend, his line in.',
    )
    expect(text).not.toContain('humming')
    expect(text).not.toContain('time seems to slow')
  })

  it('shows the fisherman with a stiff arm and no humming', () => {
    const game = gameIn('Riverbank')
    const text = executeCommands(game, ['examine fisherman'])
    expect(text).toContain(
      'An old man on an upturned crate at the bend, his line in the water ' +
        'and his bad arm held close to his side.',
    )
    expect(text).not.toContain('humming')
  })

  it('shows the bell rope in the chapel', () => {
    const game = gameIn('VillageChapel')
    const text = game.state.currentRoom.describe(game.state)
    expect(text).toContain(
      'A small stone chapel. Its stained glass windows cast colours across ' +
        'the worn pews, and the air is cool and smells of candle wax. A kindly ',
    )
    expect(text).toContain(
      'tends the altar. By the door the bell rope hangs straight and still. ' +
        'Over the door a shape is cut into the stone, worn almost smooth. ' +
        'A dark corner by the altar swallows the light.',
    )
    expect(text).not.toContain('quiet dignity')
  })
})
