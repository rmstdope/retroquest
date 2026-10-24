/** The traveler's journal is the grey-cloaked stranger's notebook (rq-qme). */
import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { parseTurn } from '@/lantern/parseTurn'
import { Act2 } from '../Act2'
import { FLAG_READ_TRAVELERS_JOURNAL } from '../Act2StoryFlags'
import { TravelersJournal } from './TravelersJournal'

/** Words of the old ancestor story that must be gone from the journal. */
const OLD_LORE =
  /Lysander|Ravencrest|ancestor|bloodline|ley line|prophec|noble|crest|heritage appears/i

/** A fresh Act II game. */
function newGame(): Game {
  return new Game([new Act2()])
}

describe("The stranger's notebook", () => {
  it('keeps its name and short name', () => {
    const journal = new TravelersJournal()
    expect(journal.name).toBe("traveler's journal")
    expect(journal.shortName).toBe('journal')
  })

  it('describes plain leather with no name', () => {
    const description = new TravelersJournal().description
    expect(description).toBe(
      'A plain leather journal, its cover rubbed grey at the corners. ' +
        'There is no name inside. The pages are crowded with notes in a ' +
        'small, careful hand, and many of them look copied from somewhere else.',
    )
  })

  it('reads as a diary: narration, four writings, sketch, pointer', () => {
    const game = newGame()
    const text = new TravelersJournal().use(game.state)

    expect(findMarkupProblems(text)).toEqual([])
    expect(
      parseTurn(text).map((b) =>
        b.kind === 'dialogue' ? `dialogue:${b.speaker}` : b.kind,
      ),
    ).toEqual([
      'text',
      'dialogue:null',
      'dialogue:null',
      'dialogue:null',
      'dialogue:null',
      'text',
      'text',
    ])
    expect(text).toContain('There is no name inside the cover')
    expect(text).toContain("'Third night in Greendale.")
    expect(text).toContain('The amulet is not with her, she says.')
    expect(text).toContain("'The innkeeper grows curious. I leave tonight.'")
    expect(text).toContain(
      'a sun rising over three linked rings. Beside it, a question mark, ' +
        'pressed so hard the nib has torn the page.',
    )
    expect(text).toContain('The historians in the Great Hall would know')
    expect(text).not.toMatch(OLD_LORE)
  })

  it('sets the read flag and reads the same every time', () => {
    const game = newGame()
    const journal = new TravelersJournal()
    const first = journal.use(game.state)

    expect(game.state.getStoryFlag(FLAG_READ_TRAVELERS_JOURNAL)).toBe(true)
    expect(journal.use(game.state)).toBe(first)
  })
})
