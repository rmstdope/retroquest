import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from './Act2'
import { AncientTreeSpirit } from './characters/AncientTreeSpirit'
import { EnchantedAcorn } from './items/EnchantedAcorn'

/** An Act II game with the player standing in the Ancient Grove. */
function setupGameInAncientGrove(): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom = game.state.allRooms.AncientGrove
  return game
}

describe('Act 2 steps 18-19', () => {
  it('spawns silver leaves in the room after giving the enchanted acorn', () => {
    // The cheat sequence includes 'take silver leaves' immediately after giving
    // the acorn, so the spirit must place them in the room as part of that exchange.
    const game = setupGameInAncientGrove()
    const spirit = new AncientTreeSpirit()
    game.state.currentRoom.characters.push(spirit)
    const acorn = new EnchantedAcorn()
    game.state.addItemToInventory(acorn)

    spirit.giveItem(game.state, acorn)

    const roomItemNames = game.state.currentRoom.items.map((i) =>
      i.name.toLowerCase(),
    )
    expect(
      roomItemNames,
      'Silver leaves should appear in the Ancient Grove after giving the enchanted acorn.',
    ).toContain('silver leaves')
  })
})
