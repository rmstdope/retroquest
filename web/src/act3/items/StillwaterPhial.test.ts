import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { FLAG_ACT3_POOLS_STILLED } from '../Act3StoryFlags'
import { StillwaterPhial } from './StillwaterPhial'
import { ResonantChantRubbings } from './ResonantChantRubbings'
import { executeCommands, expectItemInInventory } from '@/testing/gameHelpers'

const REFLECTION =
  'Tilted to the light, it shows not your face but a young woman at a long ' +
  'table, bent over a book, and three teachers about her: one pointing at ' +
  'the page, one laughing, one watching from the shadow by the door.'

/** A game in the Stillness Vestibule carrying the phial and the rubbings. */
function vestibule(): Game {
  const game = new Game([new Act3()])
  game.state.currentRoom = game.state.allRooms['StillnessVestibule']
  game.state.addItemToInventory(new StillwaterPhial())
  game.state.addItemToInventory(new ResonantChantRubbings())
  return game
}

describe('StillwaterPhial', () => {
  it('always shows the reflection of the young woman and her teachers', () => {
    const phial = new StillwaterPhial()
    expect(phial.description).toContain(REFLECTION)
    expect(phial.description).toContain("shouldn't be there. Tilted")
    expect(phial.description).not.toContain('Mira')
    const game = vestibule()
    expect(executeCommands(game, ['examine phial'])).toContain(REFLECTION)
    executeCommands(game, ['use stillwater phial with pool'])
    expect(executeCommands(game, ['examine phial'])).toContain(REFLECTION)
  })

  it('shows the reflection when examined on the floor', () => {
    const game = vestibule()
    executeCommands(game, ['drop phial'])
    expect(executeCommands(game, ['examine phial'])).toContain(REFLECTION)
  })

  it('stills the pools with the pool or the stones and is kept', () => {
    for (const target of ['pool', 'echo stones']) {
      const game = vestibule()
      const answer = executeCommands(game, [
        `use stillwater phial with ${target}`,
      ])
      expect(answer).toContain(
        'You unstopper the phial and let a single drop fall into the ' +
          'nearest pool. The ripple does not spread; it sinks, and the ' +
          'stillness goes down after it until the black water lies flat as ' +
          'glass, holding the stones and the dark above in perfect ' +
          'reflection.',
      )
      expect(answer).toContain('The pools are mirror-still.')
      expect(game.state.getStoryFlag(FLAG_ACT3_POOLS_STILLED)).toBe(true)
      expectItemInInventory(game.state, 'stillwater phial', true)
    }
  })

  it('says the pools are already still the second time', () => {
    const game = vestibule()
    executeCommands(game, ['use stillwater phial with pool'])
    const again = executeCommands(game, [
      'use stillwater phial with echo stones',
    ])
    expect(again).toContain('The pools are already mirror-still.')
    expect(again).not.toContain('single drop')
  })

  it('lets the pool be examined before and after stilling', () => {
    const game = vestibule()
    expect(executeCommands(game, ['examine pool'])).toContain(
      'the faintest tremor runs across it',
    )
    executeCommands(game, ['use stillwater phial with pool'])
    expect(executeCommands(game, ['examine pool'])).toContain(
      'Not a tremor crosses it.',
    )
  })

  it('keeps the pools still through a save and load', () => {
    const game = vestibule()
    executeCommands(game, ['use stillwater phial with pool'])
    const fresh = new Game([new Act3()])
    expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')
    expect(fresh.state.getStoryFlag(FLAG_ACT3_POOLS_STILLED)).toBe(true)
    expectItemInInventory(fresh.state, 'stillwater phial', true)
    expect(executeCommands(fresh, ['examine pool'])).toContain(
      'Not a tremor crosses it.',
    )
  })

  it('refuses to chant over unstilled pools but keeps rubbings and blessing', () => {
    const game = vestibule()
    executeCommands(game, ['cast bless on echo stones'])
    const failed = executeCommands(game, [
      'use resonant chant rubbings with echo stones',
    ])
    expect(failed).toContain('You recite the resonant chant at each stone.')
    expect(failed).toContain('breaks apart on a thousand tiny ripples')
    expectItemInInventory(game.state, 'Resonant Chant Rubbings', true)
    expect(game.state.getStoryFlag('act3_oath_of_stillness_completed')).toBe(
      false,
    )
    executeCommands(game, ['use stillwater phial with pool'])
    const done = executeCommands(game, [
      'use resonant chant rubbings with echo stones',
    ])
    expect(done).toContain('harmonious silence')
    expectItemInInventory(game.state, 'Resonant Chant Rubbings', false)
  })

  it('allows stilling before blessing and keeps the unblessed refusal', () => {
    const game = vestibule()
    executeCommands(game, ['use stillwater phial with pool'])
    expect(
      executeCommands(game, ['use resonant chant rubbings with echo stones']),
    ).toContain('They must be sanctified')
    expect(executeCommands(game, ['cast bless on echo stones'])).toContain(
      'sacred luminescence',
    )
  })
})
