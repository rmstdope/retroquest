import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from './Act2'
import { SquiresDiary } from './items/SquiresDiary'
import { StandingStones } from './items/StandingStones'
import { Ravine } from './items/Ravine'
import { ProtectiveEnchantments } from './items/ProtectiveEnchantments'
import { MendSpell } from './spells/MendSpell'
import { NatureSenseSpell } from './spells/NatureSenseSpell'

describe('Act II rooms and items keep the voice rules', () => {
  it('describes the forest edge without mood', () => {
    const game = new Game([new Act2()])
    const text = game.state.allRooms.ForestTransition.descriptionFor(game.state)
    expect(text).not.toContain('ancient power')
  })

  it('teaches nature sense once, in one announcement', () => {
    const game = new Game([new Act2()])
    const text = new StandingStones().examine(game.state)
    expect(text.match(/You have learned/g)).toHaveLength(1)
    expect(game.state.hasSpell(new NatureSenseSpell().id)).toBe(true)
  })

  it('lets the diary go back under the bench without explaining itself', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.CastleCourtyard
    const text = new SquiresDiary().use(game.state)
    expect(text).toContain('You put the diary back under the bench')
    expect(text).not.toContain('Heavensforth by a watchman')
    expect(text).not.toContain('keeps the information safe')
  })

  it('lets the ravine refuse without naming rope', () => {
    const game = new Game([new Act2()])
    expect(new Ravine().examine(game.state)).not.toContain(
      'rope or other climbing',
    )
  })

  it('mends the wards without calling the player worthy', () => {
    const game = new Game([new Act2()])
    const text = new MendSpell().castOnItem(
      game.state,
      new ProtectiveEnchantments(),
    )
    expect(text).toContain('now glow steadily.[/success]')
    expect(text).not.toContain('worthiness')
  })
})
