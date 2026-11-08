import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { AncientAmulet } from '../items/AncientAmulet'
import { FLAG_ACT4_PARENTS_LEGACY_COMPLETED } from '../Act4StoryFlags'
import { MemoryEchoes } from './MemoryEchoes'

describe('MemoryEchoes', () => {
  /** A game standing in the vault, the memories not yet seen. */
  function inTheVault(): Game {
    const game = new Game([new Act4()])
    game.state.currentRoom = game.state.allRooms.ParentsVault
    return game
  }

  it('hears nothing said to them, before the memories or after', () => {
    const game = inTheVault()
    expect(game.say('hello', 'lysa')).toBe(
      'They do not turn. A memory cannot hear you.',
    )
    game.examine('memories')
    expect(game.say('hello', 'lysa')).toBe(
      'The lanterns stay dim. Nothing in them answers.',
    )
  })

  it('takes nothing, and the thing offered stays with the player', () => {
    const game = inTheVault()
    const echoes = new MemoryEchoes()
    const amulet = new AncientAmulet()
    game.state.addItemToInventory(amulet)
    expect(echoes.giveItem(game.state, amulet)).toBe(
      'Nothing in the lanterns can take it from you.',
    )
    expect(game.state.inventory).toContain(amulet)
  })

  it('answers to "memories" when spoken to, and looking still plays them', () => {
    const game = inTheVault()
    expect(game.talk('memories')).toBe(
      'They do not turn. A memory cannot hear you.',
    )
    expect(game.state.getStoryFlag(FLAG_ACT4_PARENTS_LEGACY_COMPLETED)).toBe(
      false,
    )
    expect(game.examine('memories')).toContain('Three young Wardens')
  })
})
