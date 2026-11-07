import { describe, it, expect } from 'vitest'
import { setupForestEntrance } from '../ravineTestSupport'

describe('examining the rescued caravan', () => {
  it('agrees with the rescue: the wagon stayed at the bottom of the ravine', () => {
    const game = setupForestEntrance()
    game.commandParser.parse('cast nature_sense')
    game.commandParser.parse('use quality rope with ravine')

    const out = game.commandParser.parse('examine caravan')

    expect(out).not.toContain('structure is sound')
    expect(out).toContain('The wagon is still at the bottom of the ravine')
  })

  it('does not describe the merchants around a wagon they left below', () => {
    const game = setupForestEntrance()
    game.commandParser.parse('cast nature_sense')
    game.commandParser.parse('use quality rope with ravine')

    const caravan = game.state.currentRoom.items.find(
      (i) => i.name === 'caravan',
    )

    expect(caravan?.description).not.toContain('around their damaged wagon')
  })
})
