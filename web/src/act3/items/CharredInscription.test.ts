import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import {
  FLAG_ACT3_CHARRED_INSCRIPTION_READ,
  FLAG_ACT3_INSCRIPTION_MENDED,
  VIRTUE_MERCY,
} from '../Act3StoryFlags'
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
    expect(result).toContain('I, Aren, pour courage into the crystal of light.')
    expect(result).toContain(
      "I, Lysa, pour selflessness into the dragon's scale.",
    )
    expect(result).toContain(
      'I, Malakar, pour wisdom into the phoenix feather.',
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
      'I, Aren, pour courage into the crystal of light.',
      "I, Lysa, pour selflessness into the dragon's scale.",
      'I, Malakar, pour wisdom into the phoenix feather.',
      'What we pour into the ward, the ward will keep.',
    ])
  })

  it('glows the amulet after the last line the first time only', () => {
    const game = new Game([new Act3()])
    const inscription = new CharredInscription()

    const first = inscription.examine(game.state)
    const again = inscription.examine(game.state)

    expect(first).toContain('glows again, brighter than before')
    expect(first.indexOf('still has his back turned.')).toBeLessThan(
      first.indexOf('Ash begins to fall'),
    )
    expect(again).not.toContain('glows again')
    expectMarkupWellFormed(first)
  })
})

const MENDED_CLOSING =
  'The three names sit level in the stone, as they did the day the promise ' +
  'was made. Your parents and Malakar made this promise together, and the ' +
  'wisdom was his.'

describe('CharredInscription mending', () => {
  it('only nudges toward reading it before it has been read', () => {
    const { game, inscription } = setup()

    const answer = inscription.receiveSpell(game.state, 'mend', 'mend')

    expect(answer).toBe(
      'The magic settles over the blackened letters and waits. You have ' +
        'not read them yet; you do not know what in them is broken.',
    )
    expect(game.state.getStoryFlag(FLAG_ACT3_INSCRIPTION_MENDED)).toBe(false)
    expect(game.state.virtueCount(VIRTUE_MERCY)).toBe(0)
    expectMarkupWellFormed(answer)
  })

  it('restores the name, records one mercy and says it is remembered', () => {
    const { game, inscription } = setup()
    inscription.examine(game.state)

    const answer = inscription.receiveSpell(game.state, 'mend', 'mend')

    expect(answer).toContain(
      "The deeper cut fills. Malakar's name sits level with your parents' " +
        'again, as it was the day they wrote it.',
    )
    expect(answer).toBe(
      "The deeper cut fills. Malakar's name sits level with your parents' " +
        'again, as it was the day they wrote it.\n' +
        '[event]✦ Mercy — this will be remembered[/event]',
    )
    expect(game.state.getStoryFlag(FLAG_ACT3_INSCRIPTION_MENDED)).toBe(true)
    expect(game.state.virtueCount(VIRTUE_MERCY)).toBe(1)
    expectMarkupWellFormed(answer)
  })

  it('still allows the mercy after an early cast once it has been read', () => {
    const { game, inscription } = setup()
    inscription.receiveSpell(game.state, 'mend', 'mend')
    inscription.examine(game.state)

    inscription.receiveSpell(game.state, 'mend', 'mend')
    inscription.receiveSpell(game.state, 'mend', 'mend')

    expect(game.state.virtueCount(VIRTUE_MERCY)).toBe(1)
  })

  it('says nothing is left to mend the second time, recording nothing', () => {
    const { game, inscription } = setup()
    inscription.examine(game.state)
    inscription.receiveSpell(game.state, 'mend', 'mend')

    const answer = inscription.receiveSpell(game.state, 'mend', 'mend')

    expect(answer).toContain(
      'The three names sit level and whole. There is nothing left to mend.',
    )
    expect(answer).not.toContain('remembered')
    expect(game.state.virtueCount(VIRTUE_MERCY)).toBe(1)
  })

  it('ignores spells other than mend', () => {
    const { game, inscription } = setup()
    inscription.examine(game.state)

    const answer = inscription.receiveSpell(game.state, 'bless', 'bless')

    expect(answer).toBe(
      '[failure][clue]The letters stay as the fire left them.[/clue][/failure]',
    )
    expect(inscription.receiveSpell(game.state, 'light', 'light')).toBe(answer)
    expect(game.state.getStoryFlag(FLAG_ACT3_INSCRIPTION_MENDED)).toBe(false)
  })

  it('opens the reading with the letters and the motifs, without felt heat', () => {
    const { game, inscription } = setup()

    const answer = inscription.examine(game.state)

    expect(answer).toContain(
      'You trace the charred letters with your finger. Above the words, cut ' +
        'shallow, is the sun over three rings; beneath it, older and nearly ' +
        'gone, a tree under two moons. The inscription reads:',
    )
    expect(answer).not.toContain('heat that once shaped them')
  })

  it('ends the reading on the level-names line once mended, without a new glow', () => {
    const { game, inscription } = setup()
    inscription.examine(game.state)
    inscription.receiveSpell(game.state, 'mend', 'mend')

    const answer = inscription.examine(game.state)

    expect(answer).toContain(MENDED_CLOSING)
    expect(answer).not.toContain('burned deeper')
    expect(answer).not.toContain('glows again')
    expectMarkupWellFormed(answer)
  })
})
