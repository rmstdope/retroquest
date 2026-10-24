import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { Miners } from './Miners'
import { SirCedric } from './SirCedric'
import { Tobin } from './Tobin'
import { AncientAmulet } from '../items/AncientAmulet'
import {
  FLAG_ACT3_DRAGONS_MEMORY_RECEIVED,
  FLAG_ACT3_TOBIN_GIVEN_CHARM,
} from '../Act3StoryFlags'
import { QuietCharm } from '../items/QuietCharm'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

describe('Miners dialogue markup', () => {
  it('attributes the rescue thanks and the later update to the miners', () => {
    const game = new Game([new Act3()])
    const miners = new Miners()
    game.state.currentRoom = game.state.allRooms.CollapsedGalleries

    const answers = [miners.talkTo(game.state), miners.talkTo(game.state)]

    for (const answer of answers) {
      expectMarkupWellFormed(answer)
      expectDialogueSpeaker(answer, miners.name)
    }
  })

  it('has Sir Cedric offer to stay, once, only with the rescue', () => {
    const game = new Game([new Act3()])
    game.state.currentRoom = game.state.allRooms.CollapsedGalleries
    game.state.currentRoom.addCharacter(new SirCedric())
    const miners = new Miners()

    const first = miners.talkTo(game.state)
    const second = miners.talkTo(game.state)

    expect(first).toContain('Someone should stay until the braces settle')
    expect(first).toContain(
      'oldest miner[/character_name] puts a grey hand on his arm',
    )
    expect(first).toMatch(/then nods\.(\[\/event\])?$/)
    expectMarkupWellFormed(first)
    expect(second).not.toContain('Sir Cedric')
  })
})

describe('Miners and Tobin', () => {
  const setup = (): { game: Game; miners: Miners } => {
    const game = new Game([new Act3()])
    game.state.currentRoom = game.state.allRooms.CollapsedGalleries
    return { game, miners: new Miners() }
  }

  it('points out Tobin between the second miner and the thanks, and brings him in', () => {
    const { game, miners } = setup()
    expect(game.state.currentRoom.getCharacterByName('tobin')).toBeNull()

    const first = miners.talkTo(game.state)

    const second = first.indexOf('come down on our heads')
    const tobin = first.indexOf("That's Tobin. Youngest of us.")
    const thanks = first.indexOf('The lead miner nods gratefully')
    expect(second).toBeGreaterThan(-1)
    expect(tobin).toBeGreaterThan(second)
    expect(thanks).toBeGreaterThan(tobin)
    expect(first).toContain(
      'The lead miner lowers his voice and nods toward a boy sitting apart',
    )
    expect(first).toContain("Hasn't said a word since. Not one.")
    expectMarkupWellFormed(first)
    expect(
      game.state.currentRoom.getCharacterByName('young miner'),
    ).toBeInstanceOf(Tobin)
  })

  it('keeps the old line before the Dragon\u2019s Memory', () => {
    const { game, miners } = setup()
    miners.talkTo(game.state)
    expect(miners.talkTo(game.state)).toContain('Still here, Elior?')
  })

  it('speaks about the silence after the memory, the same every time', () => {
    const { game, miners } = setup()
    miners.talkTo(game.state)
    game.state.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)

    const a = miners.talkTo(game.state)
    const b = miners.talkTo(game.state)

    expect(a).toContain(
      'the rock always talked back — creaks, drips, the little groans before a fall.',
    )
    expect(a).toContain('The picks stopped ringing.')
    expect(a).toContain('Like something down here forgot how to breathe.')
    expect(a).not.toContain('Still here, Elior?')
    expect(b).toBe(a)
    expectMarkupWellFormed(a)
    expectDialogueSpeaker(a, 'lead miner')
  })

  it('still shows the rescue on the first talk after the memory', () => {
    const { game, miners } = setup()
    game.state.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)
    expect(miners.talkTo(game.state)).toContain('Thank the gods you found us')
  })

  it('hands the charm back and nods toward the boy, every time', () => {
    const { game, miners } = setup()
    miners.talkTo(game.state)
    const charm = new QuietCharm()
    const a = miners.giveItem(game.state, charm)
    expect(a).not.toContain('You offer the')
    expect(a).toContain(
      'The [character_name]lead miner[/character_name] turns the [item_name]quiet charm[/item_name] over and hands it back:',
    )
    expect(a).toContain('Pretty thing. Not much use to an old man with a pick')
    expect(a).toContain('I know who needs it.')
    expect(miners.giveItem(game.state, charm)).toBe(a)
    expectMarkupWellFormed(a)
    expect(game.state.virtueCount('selfless')).toBe(0)
  })

  it('declines other items as usual', () => {
    const { game, miners } = setup()
    expect(miners.giveItem(game.state, new AncientAmulet())).toContain(
      "doesn't seem interested",
    )
  })

  it('thanks the player once after the gift, then goes back to the usual line', () => {
    const { game, miners } = setup()
    miners.talkTo(game.state)
    game.state.setStoryFlag(FLAG_ACT3_TOBIN_GIVEN_CHARM, true)

    const thanks = miners.talkTo(game.state)
    expect(thanks).toContain('He talked to me. Asked me how long till we')
    expect(thanks).toContain('Thank you, Elior.')
    expectMarkupWellFormed(thanks)
    expectDialogueSpeaker(thanks, 'lead miner')
    expect(miners.talkTo(game.state)).toContain('Still here, Elior?')
  })

  it('shows the thanks before the silence speech when the memory came first', () => {
    const { game, miners } = setup()
    miners.talkTo(game.state)
    game.state.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)
    game.state.setStoryFlag(FLAG_ACT3_TOBIN_GIVEN_CHARM, true)
    expect(miners.talkTo(game.state)).toContain('Thank you, Elior.')
    expect(miners.talkTo(game.state)).toContain('The picks stopped ringing.')
  })
})
