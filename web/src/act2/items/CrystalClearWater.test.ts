import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { AncientTreeSpirit } from '../characters/AncientTreeSpirit'
import { BarmaidElena } from '../characters/BarmaidElena'
import { CrystalClearWater } from './CrystalClearWater'
import { Moonflowers } from './Moonflowers'
import { FLAG_WHISPERS_IN_WIND_COMPLETED } from '../Act2StoryFlags'

/** A game with the water and the moonflowers in the bag and the spirit in the room. */
function gameWithGifts(): Game {
  const game = new Game([new Act2()])
  game.state.addItemToInventory(new CrystalClearWater())
  game.state.addItemToInventory(new Moonflowers())
  game.state.currentRoom.addCharacter(new AncientTreeSpirit())
  return game
}

describe('CrystalClearWater used with a character', () => {
  it('finishes Whispers in the Wind when used with the Ancient Tree Spirit', () => {
    const game = gameWithGifts()
    const answer = game.use('crystal-clear water', 'ancient tree spirit')
    expect(answer).toContain('You pour some of the crystal-clear water')
    expect(game.state.getStoryFlag(FLAG_WHISPERS_IN_WIND_COMPLETED)).toBe(true)
  })

  it('no longer says it glows for someone afflicted by dark magic', () => {
    const game = new Game([new Act2()])
    game.state.addItemToInventory(new CrystalClearWater())
    game.state.currentRoom.addCharacter(new BarmaidElena())
    const answer = game.use('crystal-clear water', 'barmaid elena')
    expect(answer).not.toContain('glows faintly')
  })
})
