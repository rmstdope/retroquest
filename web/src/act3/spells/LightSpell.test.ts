import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { LightSpell } from './LightSpell'
import { LanternBracket } from '../items/LanternBracket'

describe('Act 3 Light spell', () => {
  it('returns an event when the room has no light hook', () => {
    const game = new Game([new Act3()])
    const spell = new LightSpell()
    // Ensure current room has no castLightHere hook
    game.state.currentRoom = game.state.allRooms.OuterWards

    const out = spell.castSpell(game.state)

    expect(out).toBe(
      'A warm spark flares in your palm and fades—nothing here seems to ' +
        'catch.',
    )
  })

  it('finds the writing above reach in the Echo Chambers', () => {
    const game = new Game([new Act3()])
    game.state.currentRoom = game.state.allRooms.EchoChambers

    const out = new LightSpell().castSpell(game.state)

    expect(out).toContain(
      'three hands, the same words cut over and over. The whispers hush for ' +
        'as long as it burns.',
    )
  })

  it('casting on a lantern follows the room path', () => {
    const game = new Game([new Act3()])
    const spell = new LightSpell()
    const bracket = new LanternBracket()
    game.state.currentRoom = game.state.allRooms.OuterWards

    const out = spell.castOnItem(game.state, bracket)

    expect(out).toBe(
      'A warm spark flares in your palm and fades—nothing here seems to ' +
        'catch.',
    )
  })
})
