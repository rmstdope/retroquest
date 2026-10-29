import { describe, it, expect } from 'vitest'
import { GameState, Item, Room } from '@/engine'
import {
  FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED,
  FLAG_ACT3_POOLS_STILLED,
} from '../Act3StoryFlags'
import { ResonantChantRubbings } from './ResonantChantRubbings'
import { EchoStones } from './EchoStones'
import { StillnessVestibule } from '../rooms/StillnessVestibule'
import { WanderingPhantoms } from '../characters/WanderingPhantoms'

/** A bare game state in the given room. */
function createState(
  room: Room = new Room({ name: 'x', description: '' }),
): GameState {
  return new GameState(room, {}, [])
}

describe('ResonantChantRubbings', () => {
  it('initializes with name, description and carry flag', () => {
    const rubbings = new ResonantChantRubbings()

    expect(rubbings.name).toBe('Resonant Chant Rubbings')
    expect(rubbings.canBeCarried).toBe(true)
    expect(rubbings.description).toContain(
      'Let stillness echo, let silence bind',
    )
  })

  it('removes the phantoms when used with blessed stones', () => {
    const rubbings = new ResonantChantRubbings()
    const echoStones = new EchoStones()
    const room = new StillnessVestibule()
    const gs = createState(room)
    echoStones.receiveSpell(gs, 'bless')
    gs.setStoryFlag(FLAG_ACT3_POOLS_STILLED, true)
    expect(echoStones.areBlessed()).toBe(true)
    expect(room.characters.some((c) => c instanceof WanderingPhantoms)).toBe(
      true,
    )

    const result = rubbings.useWith(gs, echoStones)

    expect(gs.getStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED)).toBe(true)
    expect(room.characters.some((c) => c instanceof WanderingPhantoms)).toBe(
      false,
    )
    expect(result).toContain(
      'The phantoms stop where they stand, and fade into it.',
    )
  })

  it('fails with unblessed stones', () => {
    const rubbings = new ResonantChantRubbings()
    const echoStones = new EchoStones()
    const gs = createState()
    expect(echoStones.areBlessed()).toBe(false)

    const result = rubbings.useWith(gs, echoStones)

    expect(gs.getStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED)).toBe(false)
    expect(result).toContain('must be sanctified')
  })

  it('fails with other items', () => {
    const rubbings = new ResonantChantRubbings()
    const gs = createState()
    const mockItem = new Item({ name: 'mock item', description: '' })

    const result = rubbings.useWith(gs, mockItem)

    expect(result).toContain('has no effect')
  })

  it('breaks apart on ripples when blessed stones stand over unstilled pools', () => {
    const rubbings = new ResonantChantRubbings()
    const echoStones = new EchoStones()
    const room = new StillnessVestibule()
    const gs = createState(room)
    gs.addItemToInventory(rubbings)
    echoStones.receiveSpell(gs, 'bless')

    const result = rubbings.useWith(gs, echoStones)

    expect(
      result.startsWith(
        '[effect]You recite the resonant chant at each stone.[/effect]\n',
      ),
    ).toBe(true)
    expect(result).toContain(
      'The words leave the stones and skim out across the pools. Water that ' +
        'looked frozen shivers under them, and the chant breaks apart on a ' +
        'thousand tiny ripples. It will not carry over water that is not ' +
        'truly still.',
    )
    expect(result).toContain('[failure]')
    expect(gs.getStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED)).toBe(false)
    expect(gs.inventory).toContain(rubbings)
    expect(echoStones.areBlessed()).toBe(true)
    expect(room.characters.some((c) => c instanceof WanderingPhantoms)).toBe(
      true,
    )
  })
})
