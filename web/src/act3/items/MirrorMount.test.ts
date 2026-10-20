import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED } from '../Act3StoryFlags'
import { BindingResin } from './BindingResin'
import { BrassMirrorSegment } from './BrassMirrorSegment'
import { MirrorMount } from './MirrorMount'
import { MendSpell } from '../spells/MendSpell'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

const SEGMENT = 'Brass Mirror Segment'

describe('MirrorMount', () => {
  it('reveals a brass mirror segment once when examined', () => {
    const game = new Game([new Act3()])
    const mount = new MirrorMount()
    const room = game.state.currentRoom
    expect(room.items.every((i) => i.name !== SEGMENT)).toBe(true)

    const out = mount.examine(game.state)
    expect(out.toLowerCase()).toContain('brass mirror segment')
    expect(room.items.some((i) => i.name === SEGMENT)).toBe(true)

    const out2 = mount.examine(game.state)
    expect(out2.toLowerCase()).not.toContain('brass mirror segment')
    expect(room.items.filter((i) => i.name === SEGMENT)).toHaveLength(1)
  })

  it('runs the install, resin and mend flow', () => {
    const game = new Game([new Act3()])
    const state = game.state
    const mount = new MirrorMount()
    for (let i = 0; i < 4; i++)
      state.addItemToInventory(new BrassMirrorSegment())
    state.addItemToInventory(new BindingResin())

    const res = mount.useWith(state, new BrassMirrorSegment())
    expect(res.toLowerCase()).toContain('success')
    expect(state.getItemCount(SEGMENT)).toBe(0)

    const mend = new MendSpell()
    const out = mend.castOnItem(state, mount).toLowerCase()
    expect(
      out.includes('apply binding resin') || out.includes('should apply'),
    ).toBe(true)

    const out2 = mount.useWith(state, new BindingResin())
    expect(out2.toLowerCase()).toContain('success')

    const out3 = mend.castOnItem(state, mount)
    expect(out3.toLowerCase()).toContain('success')
    expect(state.getStoryFlag(FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED)).toBe(
      true,
    )
  })

  it('refusals use only known, balanced tags', () => {
    const game = new Game([new Act3()])
    const mount = new MirrorMount()

    const unprepared = mount.mend(game.state)
    game.state.addItemToInventory(new BrassMirrorSegment(), 4)
    mount.useWith(game.state, new BrassMirrorSegment())
    const loose = mount.mend(game.state)
    game.state.addItemToInventory(new BindingResin())
    mount.useWith(game.state, new BindingResin())
    const resinAgain = mount.useWith(game.state, new BindingResin())

    expect(unprepared).toContain('nothing to mend')
    expect(loose).toContain('still loose')
    expect(resinAgain).toContain('already been applied')
    for (const answer of [unprepared, loose, resinAgain]) {
      expectMarkupWellFormed(answer)
    }
  })
})
