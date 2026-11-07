import { describe, it, expect, beforeEach } from 'vitest'
import { Game } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import { Candle } from '../items/Candle'
import { Matches } from '../items/Matches'
import { Stick } from '../items/Stick'
import {
  FLAG_MAGIC_FULLY_UNLOCKED,
  FLAG_PRIEST_BLESSED,
  FLAG_PRIEST_TALKED_TO,
} from '../Act1StoryFlags'

describe('Priest dialogue', () => {
  let game: Game

  beforeEach(() => {
    game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.VillageChapel
  })

  /** Talk to the priest once, bring matches and light the candle. */
  function lightCandle(): void {
    executeCommands(game, ['talk to priest'])
    game.state.addItemToInventory(new Matches())
    executeCommands(game, ['use candle with matches'])
  }

  it('tells the story of the founders, the relic and the bell at the first talk', () => {
    const response = executeCommands(game, ['talk to priest'])

    expect(response).toContain('founders')
    expect(response).toContain('relic')
    expect(response).toContain('bell rang at midnight')
    expect(game.state.getStoryFlag(FLAG_PRIEST_TALKED_TO)).toBe(true)
  })

  it('asks Elior to get matches from the General Store', () => {
    const response = executeCommands(game, ['talk to priest'])

    expect(response).toContain('out of matches')
    expect(response).toContain('General Store')
  })

  it('asks after the matches without retelling the story while the candle is cold', () => {
    executeCommands(game, ['talk to priest'])

    const response = executeCommands(game, ['talk to priest'])

    expect(response).toContain('Any luck with those matches')
    expect(response).not.toContain('founders')
  })

  it('turns Elior to the cold candle once the matches are in hand (rq-h94j)', () => {
    executeCommands(game, ['talk to priest'])
    game.state.addItemToInventory(new Matches())

    const response = executeCommands(game, ['talk to priest'])

    expect(response).not.toContain('Any luck with those matches')
    expect(response).not.toContain('General Store')
    expect(response).toContain('sees the box in your hand')
  })

  it('points to what the candlelight revealed before the locket is taken', () => {
    lightCandle()

    const response = executeCommands(game, ['talk to priest'])

    expect(response).toContain('The light has found something')
  })

  it('sends Elior to the grandmother while he carries the locket', () => {
    lightCandle()
    executeCommands(game, ['take locket'])

    const response = executeCommands(game, ['talk to priest'])

    expect(response).toContain('the tree under two moons on it')
    expect(response).toContain('[character_name]grandmother[/character_name]')
  })

  it('thanks Elior for the light once the locket has gone home', () => {
    lightCandle()
    executeCommands(game, ['take locket'])
    game.state.removeItemFromInventory('locket')

    const response = executeCommands(game, ['talk to priest'])

    expect(response).toContain('The chapel is brighter for your kindness')
  })

  it('sees the blessing on Elior after he casts bless on himself', () => {
    lightCandle()
    game.state.setStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED, true)
    executeCommands(game, ['take locket', 'cast bless'])

    const response = executeCommands(game, ['talk to priest'])

    expect(response).toContain('The blessing sits well on you')
  })

  it('remembers being blessed by Elior', () => {
    lightCandle()
    game.state.setStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED, true)
    executeCommands(game, ['take locket', 'cast bless', 'cast bless on priest'])

    expect(game.state.getStoryFlag(FLAG_PRIEST_BLESSED)).toBe(true)
    const response = executeCommands(game, ['talk to priest'])

    expect(response).toContain('never once received it')
  })
})

describe('The priest speaks to Elior as a neighbour (rq-m3fy)', () => {
  it('names the General Store only in the closing pointer', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.VillageChapel

    const response = executeCommands(game, ['talk to priest'])

    expect(response).toContain('keeps a box for me under his counter')
    expect(response).not.toContain('[/character_name] at the')
    expect(response).toMatch(/If you're passing the .*General Store.*\.\.\./)
  })
})

describe('The priest answers the matches he asked for (rq-dmwp)', () => {
  const STOCK = 'The road will want it more than I do.'
  let game: Game

  beforeEach(() => {
    game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.VillageChapel
    executeCommands(game, ['talk to priest'])
    game.state.addItemToInventory(new Matches())
  })

  it('hands the matches back and asks Elior to light the cold candle', () => {
    const response = executeCommands(game, ['give matches to priest'])

    expect(response).not.toContain(STOCK)
    expect(response).toContain('Will you light it for me?')
    expect(game.state.inventory.some((item) => item instanceof Matches)).toBe(
      true,
    )
    const candle = game.state.getItem('candle')
    expect(candle instanceof Candle && candle.isLit).toBe(false)
  })

  it('still lets Elior light the candle after the matches are handed back', () => {
    executeCommands(game, ['give matches to priest'])

    const response = executeCommands(game, ['use matches with candle'])

    expect(response).toContain('now casts a warm glow')
  })

  it('lets Elior keep the matches once the candle is lit', () => {
    executeCommands(game, ['use matches with candle'])

    const response = executeCommands(game, ['give matches to priest'])

    expect(response).not.toContain(STOCK)
    expect(response).toContain('that was your doing')
  })

  it('keeps his stock give-back line for other things', () => {
    game.state.addItemToInventory(new Stick())

    const response = executeCommands(game, ['give stick to priest'])

    expect(response).toContain(STOCK)
  })
})
