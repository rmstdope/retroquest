import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { RedemptionsLight } from './RedemptionsLight'
import { GhostlyWarriors } from '../characters/GhostlyWarriors'
import { KnightOfDespair } from '../characters/KnightOfDespair'
import { TrueSelf } from '../characters/TrueSelf'
import { FLAG_ACT4_WARRIORS_AT_PEACE } from '../Act4StoryFlags'
import { executeCommands, expectMarkupWellFormed } from '@/testing/gameHelpers'

const NOTHING =
  '[dim]Soft light gathers in your hand and fades. There is no fallen soul here to remember itself.[/dim]'

/** A game in the Hall of Echoes where the knight is already redeemed. */
function createRedeemedGame(): Game {
  const act = new Act4()
  act.musicFile = ''
  const game = new Game([act])
  game.state.currentRoom = game.state.allRooms.HallOfEchoes
  game.state.setStoryFlag('act4_guardians_chain_raised', true)
  game.state.setStoryFlag('act4_knight_seen_through', true)
  game.commandParser.parse('say redemption to knight')
  return game
}

describe('RedemptionsLight', () => {
  it('has the agreed name and description', () => {
    const spell = new RedemptionsLight()
    expect(spell.name).toBe("Redemption's Light")
    expect(spell.description).toBe(
      'Light that reminds a fallen soul of who it was.',
    )
    expect(spell.answersTo("redemption's light")).toBe(true)
  })

  it('has nothing to redeem without a target or on the knight', () => {
    const game = new Game([new Act4()])
    const spell = new RedemptionsLight()
    expect(spell.castSpell(game.state)).toBe(NOTHING)
    expect(spell.castOnCharacter(game.state, new KnightOfDespair())).toBe(
      NOTHING,
    )
    expectMarkupWellFormed(NOTHING)
  })

  it('fizzles on other characters', () => {
    const game = new Game([new Act4()])
    expect(
      new RedemptionsLight().castOnCharacter(game.state, new TrueSelf()),
    ).toContain('fizzles')
  })

  it('puts the warriors at peace, records mercy once', () => {
    const game = createRedeemedGame()
    const hall = game.state.currentRoom
    expect(hall.characters.some((c) => c instanceof GhostlyWarriors)).toBe(true)
    const cast = executeCommands(game, [
      "cast redemption's light on ghostly warriors",
    ])
    expect(cast).toContain(
      'Soft light spills from your hands across the hall. One by one the ghostly warriors lower their blades and look at one another as if for the first time. Then they fade, at peace.',
    )
    expect(cast).toContain('[dim]Elior will remember this.[/dim]')
    expect(game.state.hasVirtue('mercy')).toBe(true)
    expect(game.state.virtues.filter((v) => v === 'mercy')).toHaveLength(1)
    expect(game.state.getStoryFlag(FLAG_ACT4_WARRIORS_AT_PEACE)).toBe(true)
    expect(hall.characters.some((c) => c instanceof GhostlyWarriors)).toBe(
      false,
    )
    expect(hall.description).not.toContain('ghostly warriors')
    expect(hall.description).toContain('the knight kneels')
    expect(
      executeCommands(game, ["cast redemption's light on ghostly warriors"]),
    ).toContain("You don't see a 'ghostly warriors'")
  })

  it('is unknown before the knight is redeemed', () => {
    const game = new Game([new Act4()])
    game.state.currentRoom = game.state.allRooms.HallOfEchoes
    expect(
      executeCommands(game, ["cast redemption's light on ghostly warriors"]),
    ).toContain("You don't know any spell called")
  })
})
