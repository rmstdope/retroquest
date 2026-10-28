import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { ForestHermit } from './ForestHermit'
import { FLAG_HERMITS_WARNING_COMPLETED } from '../Act2StoryFlags'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

/** A game running Act II. */
function createGame(): Game {
  return new Game([new Act2()])
}

describe('Forest hermit', () => {
  it('tells the first talk in the agreed order', () => {
    const game = createGame()
    const answer = new ForestHermit().talkTo(game.state)

    const lines = [
      'looks at the treeline first, and only then at you.',
      "You're going in. She's in a sour mood this season, so mind yourself.",
      "She moves her paths when she's bored, and she keeps old things in her that don't care for strangers. Everything that lives in there is hers. Ask before you take, and never take more than you give.",
      "But you... there is old magic on you, and not of your own making. She'll notice it. Take this charm—it's my mark; it tells her you're under my protection. And don't walk in tonight. Make camp out here first, where she can get a look at you.",
      'You receive a [item_name]protective charm[/item_name].',
    ]
    let from = 0
    for (const line of lines) {
      const at = answer.indexOf(line, from)
      expect(at, line).toBeGreaterThanOrEqual(from)
      from = at + line.length
    }
    expectMarkupWellFormed(answer)
    expect(answer).not.toMatch(/ancient|wisdom|destiny|spirits/i)
  })

  it('repeats the camp clue on later talks before the camp', () => {
    const game = createGame()
    const hermit = new ForestHermit()
    hermit.talkTo(game.state)

    const answer = hermit.talkTo(game.state)

    expect(answer).toContain('looks at the treeline, then at your pack.')
    expect(answer).toContain(
      'Not tonight. Make camp first; let her get a look at you.',
    )
    expect(answer).not.toContain('Go on')
    expectMarkupWellFormed(answer)
  })

  it('gives one narration line and one speech on later talks after the camp', () => {
    const game = createGame()
    const hermit = new ForestHermit()
    hermit.talkTo(game.state)
    game.state.setStoryFlag(FLAG_HERMITS_WARNING_COMPLETED, true)

    const answer = hermit.talkTo(game.state)

    expect(answer).toContain('tilts their head toward the trees.')
    expect(answer).toContain(
      "She knows you're coming now. Go on, before she changes her mind.",
    )
    expectMarkupWellFormed(answer)
    expect(answer).not.toMatch(/knowingly|wisdom|spirits/i)
  })

  it('has a plain description', () => {
    const game = createGame()
    const hermit = new ForestHermit()

    const answer = hermit.examine(game.state)

    expect(answer).toContain(
      'A thin figure in moss-green robes, weathered by years outdoors. ' +
        'Charms of bark, bone and braided grass hang from their belt. Every ' +
        'so often they glance at the treeline, the way you would at someone ' +
        'who might be listening.',
    )
    expect(answer).not.toMatch(/wisdom|mysterious/i)
  })
})
