import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { FLAG_ACT3_CHARRED_INSCRIPTION_READ } from '../Act3StoryFlags'
import { CharredInscription } from './CharredInscription'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

/** An Act III game and a fresh inscription. */
function setup(): { game: Game; inscription: CharredInscription } {
  return { game: new Game([new Act3()]), inscription: new CharredInscription() }
}

describe('CharredInscription', () => {
  it('initializes correctly', () => {
    const { inscription } = setup()

    expect(inscription.name).toBe('Charred Inscription')
    expect(inscription.shortName).toBe('inscription')
    expect(inscription.canBeCarried).toBe(false)
    expect(inscription.description).toContain(
      'Words burned deep into cooled lava',
    )
  })

  it('sets the story flag when examined', () => {
    const { game, inscription } = setup()
    expect(game.state.getStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ)).toBe(
      false,
    )

    const result = inscription.examine(game.state)

    expect(game.state.getStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ)).toBe(
      true,
    )
    expect(result).toContain('In fire and flame we forge the final ward')
    expect(result).toContain('Should our son face the darkness')
    expect(result).toContain('courage from the depths')
    expect(result).toContain('wisdom from the heights')
    expect(result).toContain('sacrifice from the heart')
  })

  it('can be examined multiple times', () => {
    const { game, inscription } = setup()

    const result1 = inscription.examine(game.state)
    expect(game.state.getStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ)).toBe(
      true,
    )
    const result2 = inscription.examine(game.state)

    expect(result1).toBe(result2)
    expect(game.state.getStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ)).toBe(
      true,
    )
  })

  it('reading uses only known, balanced tags', () => {
    const game = new Game([new Act3()])

    const answer = new CharredInscription().examine(game.state)

    expect(answer).toContain('In fire and flame we forge the final ward')
    expectMarkupWellFormed(answer)
  })
})
