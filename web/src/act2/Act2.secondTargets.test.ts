/** Greater heal on the rescued merchants and a too-early dispel on Elena (rq-39h). */
import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from './Act2'
import { Caravan } from './items/Caravan'
import { GreaterHealSpell } from './spells/GreaterHealSpell'
import { DispelSpell } from './spells/DispelSpell'
import { BarmaidElena } from './characters/BarmaidElena'
import { CrystalClearWater } from './items/CrystalClearWater'
import {
  FLAG_FOUND_LOST_CARAVAN,
  FLAG_MERCHANTS_HEALED,
  FLAG_THORNE_HEALING_TOLD,
} from './Act2StoryFlags'
import { Ravine } from './items/Ravine'
import { QualityRope } from './items/QualityRope'
import { FLAG_INNKEEPERS_DAUGHTER_COMPLETED } from './Act2StoryFlags'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

const FIRST_HEAL =
  'Golden light settles on split lips and wrenched ankles, and one by one they stop wincing.'
const TRADER_GESTURE =
  'A spice trader flexes a hand she has been cradling since the ravine.'
const TRADER_LINE =
  "Three days down there and I'd stopped feeling these fingers. Tell Thorne he owes you twice now."
const REPEAT =
  '[dim]The merchants are already on the mend. A spice trader waves you off: "Save it for someone who needs it."[/dim]'
const THORNE_LINE =
  "And my people tell me you didn't just haul them out of that hole — you mended them where they sat. One of the spice traders says her hand's never been better. I don't know how a man repays a debt twice over."
const MASK_FAILURE =
  'The counter-magic breaks against the silver mask on her wrist like water on glass, and the mask smiles wider. Whatever it wears over itself must be washed away before it can be broken.'
const NOTHING_FAILURE =
  'The counter-magic finds nothing to take hold of: whatever holds her is buried too deep to show itself. Something must draw it to the surface first.'

/** A game in the Market District knowing greater heal and dispel. */
function newGame(): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom = game.state.allRooms.MarketDistrict
  game.state.knownSpells.push(new GreaterHealSpell(), new DispelSpell())
  return game
}

/** The caravan rescued: the flag is set and the caravan stands in the room. */
function rescued(game: Game): void {
  game.state.setStoryFlag(FLAG_FOUND_LOST_CARAVAN, true)
  game.state.currentRoom.items.push(new Caravan())
}

describe('greater heal on the rescued merchants', () => {
  it('fails as today before the rescue', () => {
    const game = newGame()
    expect(
      game.commandParser.parse('cast greater_heal on merchants'),
    ).toContain("You don't see a 'merchants' to cast")
  })

  it.each(['merchants', 'caravan'])('heals them when cast on %s', (target) => {
    const game = newGame()
    rescued(game)
    const out = game.commandParser.parse(`cast greater_heal on ${target}`)
    expect(out).toContain(
      'You cast [spell_name]greater heal[/spell_name] over the merchants. ' +
        FIRST_HEAL,
    )
    expect(out).toContain(TRADER_GESTURE)
    expect(out).toContain(
      `[character_name]Spice trader[/character_name]\n[dialogue]"${TRADER_LINE}"[/dialogue]`,
    )
    expect(game.state.getStoryFlag(FLAG_MERCHANTS_HEALED)).toBe(true)
    expectMarkupWellFormed(out)
  })

  it('gives the dim refusal on a second cast', () => {
    const game = newGame()
    rescued(game)
    game.commandParser.parse('cast greater_heal on merchants')
    const out = game.commandParser.parse('cast greater_heal on caravan')
    expect(out).toBe(REPEAT)
  })

  it('records no virtue', () => {
    const game = newGame()
    rescued(game)
    game.commandParser.parse('cast greater_heal on merchants')
    expect(game.state.virtues).toEqual([])
  })
})

describe('merchants rescued with the real rope', () => {
  it('can be healed in the forest, then Thorne tells of it in town', () => {
    const game = new Game([new Act2()])
    game.state.learnSpell(new GreaterHealSpell())
    game.state.currentRoom = game.state.allRooms.ForestEntrance
    game.state.currentRoom.items.push(new Ravine())
    game.state.addItemToInventory(new QualityRope())
    game.commandParser.parse('use rope with ravine')
    const out = game.commandParser.parse('cast greater_heal on merchants')
    expect(out).toContain('over the merchants')
    game.state.currentRoom = game.state.allRooms.MarketDistrict
    const talk = game.commandParser.parse('talk to caravan master thorne')
    expect(talk).toContain('mended them where they sat')
  })
})

describe('Thorne after the merchants are healed', () => {
  function atThorne(): Game {
    const game = newGame()
    rescued(game)
    return game
  }

  it('appends his line once to the reward talk', () => {
    const game = atThorne()
    game.commandParser.parse('cast greater_heal on merchants')
    const first = game.commandParser.parse('talk to caravan master thorne')
    expect(first).toContain('As promised, here is your reward')
    expect(first.endsWith(`[dialogue]${THORNE_LINE}[/dialogue]`)).toBe(true)
    expect(game.state.getStoryFlag(FLAG_THORNE_HEALING_TOLD)).toBe(true)
    const later = game.commandParser.parse('talk to caravan master thorne')
    expect(later).not.toContain('mended them where they sat')
  })

  it('appends it after the usual reply when the reward is already paid', () => {
    const game = atThorne()
    game.commandParser.parse('talk to caravan master thorne')
    game.commandParser.parse('cast greater_heal on merchants')
    const next = game.commandParser.parse('talk to caravan master thorne')
    expect(next).toContain('Which leaves')
    expect(next.indexOf('Which leaves')).toBeLessThan(
      next.indexOf('mended them where they sat'),
    )
    expect(next.endsWith(`[dialogue]${THORNE_LINE}[/dialogue]`)).toBe(true)
    expectMarkupWellFormed(next)
    expect(
      game.commandParser.parse('talk to caravan master thorne'),
    ).not.toContain('mended them')
  })

  it('says nothing about it when the merchants were never healed', () => {
    const game = atThorne()
    const first = game.commandParser.parse('talk to caravan master thorne')
    const second = game.commandParser.parse('talk to caravan master thorne')
    expect(first + second).not.toContain('mended them')
  })

  it('keeps the healed and told state through a save', () => {
    const game = atThorne()
    game.commandParser.parse('cast greater_heal on merchants')
    game.commandParser.parse('talk to caravan master thorne')
    const restored = new Game([new Act2()])
    restored.loadSaveData(JSON.parse(JSON.stringify(game.toSaveData())))
    expect(restored.state.getStoryFlag(FLAG_MERCHANTS_HEALED)).toBe(true)
    expect(restored.state.getStoryFlag(FLAG_THORNE_HEALING_TOLD)).toBe(true)
    expect(restored.commandParser.parse('cast greater_heal on merchants')).toBe(
      REPEAT,
    )
  })
})

describe('dispel on Elena too early', () => {
  /** A game standing with Elena. */
  function withElena(): Game {
    const game = newGame()
    const room = Object.values(game.state.allRooms).find((r) =>
      r.characters.some((c) => c instanceof BarmaidElena),
    )
    if (!room) throw new Error('Elena is not in any room')
    game.state.currentRoom = room
    return game
  }

  it('finds nothing to grip before the greater heal', () => {
    const game = withElena()
    const out = game.commandParser.parse('cast dispel on barmaid elena')
    expect(out).toBe(
      `[failure]You cast [spell_name]dispel[/spell_name] on Elena. ${NOTHING_FAILURE}[/failure]`,
    )
    expectMarkupWellFormed(out)
  })

  it('lets the mask smile wider after the heal and before the water', () => {
    const game = withElena()
    game.commandParser.parse('cast greater_heal on barmaid elena')
    const out = game.commandParser.parse('cast dispel on barmaid elena')
    expect(out).toBe(
      `[failure]You cast [spell_name]dispel[/spell_name] on Elena. ${MASK_FAILURE}[/failure]`,
    )
    expect(out).not.toContain('[character_name]')
    expectMarkupWellFormed(out)
  })

  it('still cures after the water', () => {
    const game = withElena()
    game.commandParser.parse('cast greater_heal on barmaid elena')
    game.state.inventory.push(new CrystalClearWater())
    game.commandParser.parse('use crystal-clear water on barmaid elena')
    const cure = game.commandParser.parse('cast dispel on barmaid elena')
    expect(cure).toContain('shattering the evil enchantment completely')
    expect(game.state.getStoryFlag(FLAG_INNKEEPERS_DAUGHTER_COMPLETED)).toBe(
      true,
    )
    const out = game.commandParser.parse('cast dispel on barmaid elena')
    expect(out).toBe('Elena has already been completely cured of her curse.')
  })
})
