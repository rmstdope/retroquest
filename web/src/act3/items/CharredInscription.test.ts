import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { FLAG_ACT3_CHARRED_INSCRIPTION_READ } from '../Act3StoryFlags'
import { CharredInscription } from './CharredInscription'
import { parseTurn } from '@/lantern/parseTurn'
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
    expect(inscription.description).toContain(
      'Three hands wrote here, one after another.',
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
    expect(result).toContain('We are three, and we are one promise.')
    expect(result).toContain('I, Aren, pour courage into the Crystal of Light.')
    expect(result).toContain(
      "I, Lysa, pour selflessness into the Dragon's Scale.",
    )
    expect(result).toContain(
      'I, Malakar, pour wisdom into the Phoenix Feather.',
    )
    expect(result).toContain('What we pour into the ward, the ward will keep.')
    expect(result).toContain('the wisdom was his')
  })

  it('can be examined multiple times', () => {
    const { game, inscription } = setup()

    const result1 = inscription.examine(game.state)
    expect(game.state.getStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ)).toBe(
      true,
    )
    const result2 = inscription.examine(game.state)

    expect(result1.startsWith(result2)).toBe(true)
    expect(result1).not.toBe(result2)
    expect(game.state.getStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ)).toBe(
      true,
    )
  })

  it('reading uses only known, balanced tags', () => {
    const game = new Game([new Act3()])

    const answer = new CharredInscription().examine(game.state)

    expect(answer).toContain('We are three, and we are one promise.')
    expectMarkupWellFormed(answer)
  })

  it('shows the five vows exactly, with no quote marks of its own', () => {
    const { game, inscription } = setup()

    const blocks = parseTurn(inscription.examine(game.state))

    expect(
      blocks.flatMap((b) => (b.kind === 'dialogue' ? [b.markup] : [])),
    ).toEqual([
      'We are three, and we are one promise.',
      'I, Aren, pour courage into the Crystal of Light.',
      "I, Lysa, pour selflessness into the Dragon's Scale.",
      'I, Malakar, pour wisdom into the Phoenix Feather.',
      'What we pour into the ward, the ward will keep.',
    ])
  })

  it('glows the amulet after the last line the first time only', () => {
    const game = new Game([new Act3()])
    const inscription = new CharredInscription()

    const first = inscription.examine(game.state)
    const again = inscription.examine(game.state)

    expect(first).toContain('glows again, brighter than before')
    expect(first.trimEnd().endsWith('still has his back turned.[/event]')).toBe(
      true,
    )
    expect(again).not.toContain('glows again')
    expectMarkupWellFormed(first)
  })
})
