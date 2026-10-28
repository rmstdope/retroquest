import { describe, it, expect, beforeEach } from 'vitest'
import { Game } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import { Matches } from '../items/Matches'
import { FLAG_PRIEST_BLESSED, FLAG_PRIEST_TALKED_TO } from '../Act1StoryFlags'

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

  it('points to what the candlelight revealed before the locket is taken', () => {
    lightCandle()

    const response = executeCommands(game, ['talk to priest'])

    expect(response).toContain('The light has found something')
  })

  it('sends Elior to the grandmother while he carries the locket', () => {
    lightCandle()
    executeCommands(game, ['take locket'])

    const response = executeCommands(game, ['talk to priest'])

    expect(response).toContain('the tree and the two moons on it')
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
    executeCommands(game, ['take locket', 'cast bless'])

    const response = executeCommands(game, ['talk to priest'])

    expect(response).toContain('The blessing sits well on you')
  })

  it('remembers being blessed by Elior', () => {
    lightCandle()
    executeCommands(game, ['take locket', 'cast bless', 'cast bless on priest'])

    expect(game.state.getStoryFlag(FLAG_PRIEST_BLESSED)).toBe(true)
    const response = executeCommands(game, ['talk to priest'])

    expect(response).toContain('never once received it')
  })
})
