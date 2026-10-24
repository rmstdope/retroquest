import { describe, it, expect } from 'vitest'
import { Game, type Room } from '@/engine'
import { Act3 } from '../Act3'
import {
  FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED,
  FLAG_ACT3_WARDING_PILLARS_PURIFIED,
} from '../Act3StoryFlags'
import { MoonRuneShards } from './MoonRuneShards'
import { WardingPillars } from './WardingPillars'
import { expectMarkupWellFormed, expectStoryFlag } from '@/testing/gameHelpers'

/** An Act III game, the Outer Wards and its pillars. */
function setup(): { game: Game; room: Room; pillars: WardingPillars } {
  const game = new Game([new Act3()])
  const room = game.state.allRooms.OuterWards
  const pillars = room.items.find((i) => i instanceof WardingPillars) as
    | WardingPillars
    | undefined
  expect(pillars).toBeDefined()
  return { game, room, pillars: pillars as WardingPillars }
}

describe('WardingPillars', () => {
  it('sets the purification flag when purified', () => {
    const { game, pillars } = setup()

    const out = pillars.purify(game.state).toLowerCase()

    expect(
      out.includes('clean') || out.includes('rins') || out.includes('breathe'),
    ).toBe(true)
    expectStoryFlag(game.state, FLAG_ACT3_WARDING_PILLARS_PURIFIED, true)
  })

  it('examine changes with purification', () => {
    const { game, room, pillars } = setup()

    const outBefore = pillars.examine(game.state).toLowerCase()
    expect(outBefore.includes('crust') || outBefore.includes('mute')).toBe(true)

    game.state.currentRoom = room
    const purifyOut = pillars.purify(game.state).toLowerCase()
    expect(purifyOut.includes('rins') || purifyOut.includes('cleans')).toBe(
      true,
    )

    const outAfter = pillars.examine(game.state).toLowerCase()
    expect(outAfter.includes('pulse') || outAfter.includes('radiant')).toBe(
      true,
    )
  })

  it('changes its name on purify', () => {
    const { game, room, pillars } = setup()
    expect(pillars.name).toBe('Warding Pillars')

    game.state.currentRoom = room
    pillars.purify(game.state)

    expect(pillars.name).toBe('Warding Pillars (purified)')
    expect(pillars.shortName).toBe('Pillars')
  })

  it('accepts the shards only after purification', () => {
    const { game, room, pillars } = setup()
    const shards = new MoonRuneShards()
    game.state.addItemToInventory(shards)

    const failOut = shards.useWith(game.state, pillars)
    expect(failOut).toContain('[failure]')
    expect(game.state.getItemCount('Moon Rune Shards')).toBeGreaterThan(0)

    game.state.currentRoom = room
    pillars.purify(game.state)

    const successOut = shards.useWith(game.state, pillars)
    expect(successOut).not.toContain('[event]')
    expect(successOut).toContain('You press the pale shards')
    expect(game.state.getItemCount('Moon Rune Shards')).toBe(0)
    expectStoryFlag(game.state, FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, true)
  })

  it('purifying twice uses only known, balanced tags', () => {
    const game = new Game([new Act3()])
    const pillars = new WardingPillars()
    pillars.purify(game.state)

    const answer = pillars.purify(game.state)

    expect(answer).toContain('already cleansed')
    expectMarkupWellFormed(answer)
  })
})
