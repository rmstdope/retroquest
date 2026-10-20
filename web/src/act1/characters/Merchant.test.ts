import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../Act1'
import { executeCommands, expectDialogueSpeaker } from '@/testing/gameHelpers'
import {
  FLAG_KEPT_MOTHERS_RING,
  FLAG_MERCHANT_NEWS_HEARD,
} from '../Act1StoryFlags'
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

  it('tells the news of the ill king once, before his usual offer', () => {
    const game = gameAtMerchant()

    const first = executeCommands(game, ['talk to merchant'])
    const second = executeCommands(game, ['talk to merchant'])

    expect(first).toContain('King Alden has fallen ill')
    expect(first.indexOf('Keep to the daylight, friend.')).toBeLessThan(
      first.indexOf('[item_name]shiny ring[/item_name]'),
    )
    expectDialogueSpeaker(first, 'merchant')
    expect(first.match(/\[dialogue\]/g)).toHaveLength(1)
    expect(game.state.getStoryFlag(FLAG_MERCHANT_NEWS_HEARD)).toBe(true)
    expect(second).not.toContain('King Alden')
    expect(second).toContain('[item_name]shiny ring[/item_name]')
  })

  it('tells the news before the boots line when the boots were traded first', () => {
    const game = gameAtMerchant()
    executeCommands(game, ['give shiny ring to merchant'])

    const first = executeCommands(game, ['talk to merchant'])

    expect(first).toContain('King Alden has fallen ill')
    expect(first.indexOf('Keep to the daylight, friend.')).toBeLessThan(
      first.indexOf('should serve you well'),
    )
    expect(executeCommands(game, ['talk to merchant'])).not.toContain('Alden')
  })

  it('adds the news to Shadows Over Willowbrook and keeps it through a save', () => {
    const game = gameAtMerchant()
    game.state.settleQuests()
    game.commandParser.parse('talk to merchant')
    const changes = game.state.settleQuests()
    expect(changes.updated.map((q) => q.name)).toEqual([
      'Shadows Over Willowbrook',
    ])

    const fresh = new Game([new Act1()])
    fresh.loadSaveData(game.toSaveData())
    const quest = fresh.state.activatedQuests.find(
      (q) => q.name === 'Shadows Over Willowbrook',
    )

    expect(quest?.description).toContain('King Alden lies ill')
    expect(executeCommands(fresh, ['talk to merchant'])).not.toContain('Alden')
  })
})
