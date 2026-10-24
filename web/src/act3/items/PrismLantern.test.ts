import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED } from '../Act3StoryFlags'
import { LanternBracket } from './LanternBracket'
import { PrismLantern } from './PrismLantern'

describe('PrismLantern', () => {
  it('can be added to the inventory and exposes a name', () => {
    const game = new Game([new Act3()])

    game.state.addItemToInventory(new PrismLantern(), 2)

    expect(game.state.getItem('Prism Lantern')).not.toBeNull()
    expect(game.state.getItem('Prism Lantern')?.name).toBe('Prism Lantern')
  })

  it('mounts on a bracket via the room hook and is consumed', () => {
    const game = new Game([new Act3()])
    const room = game.state.allRooms.SubmergedAntechamber
    game.state.setStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, true)
    game.state.currentRoom = room

    const searchResult = room.search(game.state).toLowerCase()
    expect(
      searchResult.includes('bracket') || searchResult.includes('niche'),
    ).toBe(true)

    const lantern = new PrismLantern()
    game.state.addItemToInventory(lantern)
    expect(game.state.hasItem('Prism Lantern')).toBe(true)

    const bracket = room.items.find(
      (i): i is LanternBracket => i instanceof LanternBracket && !i.hasLantern,
    )
    expect(bracket).toBeDefined()

    const result = lantern.useWith(game.state, bracket as LanternBracket)
    expect(result).toContain(
      'The prism lantern settles into the bracket; water hums softly as it ' +
        'takes the weight.',
    )

    expect(game.state.hasItem('Prism Lantern')).toBe(false)
    expect((bracket as LanternBracket).hasLantern).toBe(true)
  })
})
