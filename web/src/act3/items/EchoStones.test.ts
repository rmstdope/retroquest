import { describe, it, expect } from 'vitest'
import { Game, GameState, Item, Room } from '@/engine'
import { Act3 } from '../Act3'
import {
  FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED,
  FLAG_ACT3_OATH_OF_STILLNESS_STARTED,
} from '../Act3StoryFlags'
import { EchoStones } from './EchoStones'
import { ResonantChantRubbings } from './ResonantChantRubbings'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

/** A bare game state with no flags set. */
function createState(): GameState {
  return new GameState(new Room({ name: 'x', description: '' }), {}, [])
}

describe('EchoStones', () => {
  it('initializes with name, description and carry flag', () => {
    const stones = new EchoStones()

    expect(stones.name).toBe('echo stones')
    expect(stones.description).toContain('carved')
    expect(stones.description).toContain('channels')
    expect(stones.canBeCarried).toBe(false)
    expect(stones.areBlessed()).toBe(false)
  })

  it('is blessed by the bless spell', () => {
    const stones = new EchoStones()
    const gs = createState()
    expect(gs.getStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_STARTED)).toBe(false)

    let result = stones.receiveSpell(gs, 'bless')
    expect(result.toLowerCase()).toContain('sacred luminescence')
    expect(result.toLowerCase()).toContain('ancient chant')
    expect(stones.areBlessed()).toBe(true)
    expect(gs.getStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_STARTED)).toBe(true)

    result = stones.receiveSpell(gs, 'bless')
    expect(result.toLowerCase()).toContain('already blessed')
  })

  it('starts the quest when examined', () => {
    const stones = new EchoStones()
    const gs = createState()
    expect(gs.getStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_STARTED)).toBe(false)

    const result = stones.examine(gs)

    expect(result).toContain('carved')
    expect(result).toContain('channels')
    expect(gs.getStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_STARTED)).toBe(true)
  })

  it('ignores the wrong spell', () => {
    const stones = new EchoStones()
    const gs = createState()

    const result = stones.receiveSpell(gs, 'light')

    expect(result.toLowerCase()).toContain('no effect')
  })

  it('rejects the chant rubbings while unblessed', () => {
    const stones = new EchoStones()
    const rubbings = new ResonantChantRubbings()
    const gs = createState()

    const result = rubbings.useWith(gs, stones)

    expect(result.toLowerCase()).toContain('cold and unresponsive')
    expect(result.toLowerCase()).toContain('sanctified')
    expect(gs.getStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED)).toBe(false)
  })

  it('completes the oath with the chant rubbings once blessed', () => {
    const stones = new EchoStones()
    const rubbings = new ResonantChantRubbings()
    const gs = createState()
    stones.receiveSpell(gs, 'bless')

    const result = rubbings.useWith(gs, stones).toLowerCase()

    expect(result).toContain('recite the resonant chant')
    expect(result).toContain('harmonious silence')
    expect(result).toContain("dragon's hall now lies open")
    expect(gs.getStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED)).toBe(true)
  })

  it('chant rubbings have no effect on the wrong item', () => {
    const rubbings = new ResonantChantRubbings()
    const gs = createState()
    const dummy = new Item({ name: 'random item', description: '' })

    const result = rubbings.useWith(gs, dummy)

    expect(result.toLowerCase()).toContain('no effect')
  })

  it('delegates to the rubbings when used with them', () => {
    const stones = new EchoStones()
    const rubbings = new ResonantChantRubbings()
    const gs = createState()
    stones.receiveSpell(gs, 'bless')
    expect(stones.areBlessed()).toBe(true)

    const result = stones.useWith(gs, rubbings)

    expect(gs.getStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED)).toBe(true)
    expect(result).toContain('banishes the wandering phantoms')
  })

  it('fails gracefully with other items', () => {
    const stones = new EchoStones()
    const gs = createState()
    const mockItem = new Item({ name: 'mock item', description: '' })

    const result = stones.useWith(gs, mockItem)

    expect(result).toContain("can't use")
    expect(result).toContain('echo stones')
    expect(result).toContain('mock item')
  })

  it('blessing twice uses only known, balanced tags', () => {
    const game = new Game([new Act3()])
    const stones = new EchoStones()
    stones.receiveSpell(game.state, 'bless')

    const answer = stones.receiveSpell(game.state, 'bless')

    expect(answer).toContain('already blessed')
    expectMarkupWellFormed(answer)
  })
})
