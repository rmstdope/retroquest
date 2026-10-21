import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import {
  FLAG_ACT3_MIRRORS_MENDED,
  FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED,
} from '../Act3StoryFlags'
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
    expect(out3).toContain('the whole face hums.')
    expect(out3).toContain(
      'The mirrors are whole. The sun is not where it needs to be. ' +
        'Perhaps rest a while, and let it climb.',
    )
    expect(out3).not.toContain('piercing ray')
    expect(state.getStoryFlag(FLAG_ACT3_MIRRORS_MENDED)).toBe(true)
    expect(state.getStoryFlag(FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED)).toBe(
      false,
    )
    expectMarkupWellFormed(out3)
  })

  it('gives a dim reminder when mended again, before and after the beam', () => {
    const game = new Game([new Act3()])
    const state = game.state
    const mount = new MirrorMount()
    for (let i = 0; i < 4; i++)
      state.addItemToInventory(new BrassMirrorSegment())
    state.addItemToInventory(new BindingResin())
    mount.useWith(state, new BrassMirrorSegment())
    mount.useWith(state, new BindingResin())
    mount.mend(state)

    const waiting = mount.mend(state)
    expect(waiting).toBe(
      '[dim]The mirrors are already whole. The sun is not where it needs ' +
        'to be. Perhaps rest a while, and let it climb.[/dim]',
    )
    expect(state.getStoryFlag(FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED)).toBe(
      false,
    )

    state.setStoryFlag(FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED, true)
    expect(mount.mend(state)).toBe(
      '[dim]The mirrors are already whole, and the way east stands open.[/dim]',
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
