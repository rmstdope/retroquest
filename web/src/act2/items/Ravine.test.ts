import { describe, it, expect } from 'vitest'
import { reload, setupForestEntrance } from '../ravineTestSupport'

describe('examining the ravine', () => {
  it('hears voices calling for help before the rescue', () => {
    const game = setupForestEntrance()
    game.commandParser.parse('cast nature_sense')

    expect(game.commandParser.parse('examine ravine')).toContain(
      'faint voices calling for help',
    )
  })

  it('is quiet once the rope has brought the merchants up', () => {
    const game = setupForestEntrance()
    game.commandParser.parse('cast nature_sense')
    game.commandParser.parse('use quality rope with ravine')

    const out = game.commandParser.parse('examine ravine')

    expect(out).not.toMatch(/calling for help|trapped/)
    expect(out).toContain('the wagon lies on its side')
  })

  it('stays quiet after a save and load', () => {
    const game = setupForestEntrance()
    game.commandParser.parse('cast nature_sense')
    game.commandParser.parse('use quality rope with ravine')

    const out = reload(game).commandParser.parse('examine ravine')

    expect(out).not.toContain('calling for help')
  })
})
