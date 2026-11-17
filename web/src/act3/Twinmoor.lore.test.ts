import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from './Act3'
import {
  FLAG_ACT3_DRAGON_MESSAGE_GIVEN,
  FLAG_ACT3_DRAGON_MOOR_LINE_SAID,
  FLAG_ACT3_DRAGON_VOICE_HEARD,
  FLAG_ACT3_DRAGONS_MEMORY_RECEIVED,
  FLAG_ACT3_DRAGONS_SCALE_ACQUIRED,
} from './Act3StoryFlags'
import { AncientDragon } from './characters/AncientDragon'
import { CharredNotebook } from './items/CharredNotebook'
import { Steles } from './items/Steles'

const DRAGON_LINE =
  'I saw the first of them come down off the moor, with wet feet and one ' +
  'relic between them. They were fewer than your songs say.'

describe('Twinmoor lore in Act III', () => {
  it("puts the walk onto the moor in the middle of Malakar's notebook", () => {
    const text = new CharredNotebook().examine(new Game([new Act3()]).state)
    const mirror = text.indexOf('Lysa says I measure the light')
    const moor = text.indexOf(
      'We walked up onto the moor tonight, the four of us, to see the two ' +
        'moons. Mira fell asleep in the heather. Lysa says the founders ' +
        'crossed here. I kept watch till dawn and never once wished the ' +
        'night shorter.',
    )
    const wasting = text.indexOf('The Wasting has reached Willowbrook')
    expect(mirror).toBeGreaterThan(-1)
    expect(moor).toBeGreaterThan(mirror)
    expect(wasting).toBeGreaterThan(moor)
    expect(text).toContain('three survive')
  })

  it('shows two moons on the steles, like the mark at home', () => {
    const text = new Steles().examine(new Game([new Act3()]).state)
    expect(text).toContain(
      'Each sigil is two moons, one cut fainter beneath the other, like ' +
        'the mark over the chapel door at home.',
    )
  })

  it('has the dragon speak of the first Wardens once, after the scale is taken', () => {
    const game = new Game([new Act3()])
    const state = game.state
    state.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)
    state.setStoryFlag(FLAG_ACT3_DRAGON_VOICE_HEARD, true)
    state.setStoryFlag(FLAG_ACT3_DRAGON_MESSAGE_GIVEN, true)
    const dragon = new AncientDragon()
    expect(dragon.talkTo(state)).not.toContain(DRAGON_LINE)
    state.setStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED, true)
    expect(dragon.talkTo(state)).toContain(DRAGON_LINE)
    expect(dragon.talkTo(state)).not.toContain(DRAGON_LINE)
    const loaded = new Game([new Act3()])
    loaded.loadSaveData(game.toSaveData())
    expect(loaded.state.getStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED)).toBe(
      true,
    )
    expect(loaded.state.getStoryFlag(FLAG_ACT3_DRAGON_MOOR_LINE_SAID)).toBe(
      true,
    )
    expect(new AncientDragon().talkTo(loaded.state)).not.toContain(DRAGON_LINE)
  })
})
