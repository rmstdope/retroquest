import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../Act1'
import { executeCommands, expectDialogueSpeaker } from '@/testing/gameHelpers'
import { FLAG_KEPT_MOTHERS_RING } from '../Act1StoryFlags'
import { Horseshoe } from '../items/Horseshoe'
import { ShinyRing } from '../items/ShinyRing'

/** An Act I game on the Road to Greendale with the ring and the horseshoe. */
function gameAtMerchant(): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.RoadToGreendale
  game.state.addItemToInventory(new ShinyRing())
  game.state.addItemToInventory(new Horseshoe())
  return game
}

describe('Merchant', () => {
  it('asks for the ring, or failing that a horseshoe', () => {
    const answer = executeCommands(gameAtMerchant(), ['talk to merchant'])

    expect(answer).toContain('[item_name]shiny ring[/item_name]')
    expect(answer).toContain('[item_name]horseshoe[/item_name]')
    expectDialogueSpeaker(answer, 'merchant')
  })

  it('trades the boots for the ring, the golden path', () => {
    const game = gameAtMerchant()

    executeCommands(game, ['give shiny ring to merchant'])

    expect(game.state.hasItem('wandering boots')).toBe(true)
    expect(game.state.hasItem('shiny ring')).toBe(false)
    expect(game.state.getStoryFlag(FLAG_KEPT_MOTHERS_RING)).toBe(false)
  })

  it('takes the horseshoe instead, so Elior keeps the ring', () => {
    const game = gameAtMerchant()

    const answer = executeCommands(game, ['give horseshoe to merchant'])

    expectDialogueSpeaker(answer, 'merchant')
    expect(game.state.hasItem('wandering boots')).toBe(true)
    expect(game.state.hasItem('horseshoe')).toBe(false)
    expect(game.state.hasItem('shiny ring')).toBe(true)
    expect(game.state.getStoryFlag(FLAG_KEPT_MOTHERS_RING)).toBe(true)
  })

  it('trades only one pair of boots', () => {
    const game = gameAtMerchant()
    executeCommands(game, ['give horseshoe to merchant'])

    executeCommands(game, ['give shiny ring to merchant'])

    expect(game.state.hasItem('shiny ring')).toBe(true)
    expect(
      game.state.inventory.filter((i) => i.name === 'wandering boots'),
    ).toHaveLength(1)
    expect(game.state.getStoryFlag(FLAG_KEPT_MOTHERS_RING)).toBe(true)
  })
})
