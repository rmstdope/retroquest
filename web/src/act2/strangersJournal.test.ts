/** The traveler's journal is the grey-cloaked stranger's notebook (rq-qme). */
import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { parseTurn } from '@/lantern/parseTurn'
import { Act2 } from './Act2'
import {
  FLAG_COURT_HERALD_FORMAL_PRESENTATION,
  FLAG_READ_TRAVELERS_JOURNAL,
  FLAG_RESEARCHED_FAMILY_HERITAGE,
  FLAG_SHOWED_JOURNAL_TO_HISTORIANS,
} from './Act2StoryFlags'
import { TravelersJournal } from './items/TravelersJournal'
import { Historians } from './characters/Historians'
import { InnkeeperMarcus } from './characters/InnkeeperMarcus'
import { GreatHall } from './rooms/GreatHall'
import { Coins } from './items/Coins'

/** Words of the old ancestor story that must be gone from the journal and the Historians. */
const OLD_LORE =
  /Lysander|Ravencrest|ancestor|bloodline|ley line|prophec|noble|crest|heritage appears/i
const LODGER_LINE = 'Its last lodger was a man in a grey cloak.'

/** A fresh Act II game. */
function newGame(): Game {
  return new Game([new Act2()])
}

describe('Marcus and the last lodger', () => {
  /** A game with enough coins to rent the room. */
  function richGame(coins: number): Game {
    const game = newGame()
    for (let i = 0; i < coins; i++) {
      game.state.addItemToInventory(new Coins())
    }
    return game
  }

  it('mentions the lodger once, after the purchase text', () => {
    const game = richGame(20)
    const text = new InnkeeperMarcus().buyItem(game.state, 'room key')

    expect(findMarkupProblems(text)).toEqual([])
    expect(text).toContain(LODGER_LINE)
    expect(text).toContain('It was the week the king went.')
    expect(text.indexOf(LODGER_LINE)).toBeGreaterThan(
      text.indexOf('remaining.'),
    )
    expect(text.split(LODGER_LINE)).toHaveLength(2)
  })

  it('stays silent when the purchase is refused', () => {
    const poor = new InnkeeperMarcus().buyItem(richGame(0).state, 'room key')
    expect(poor).not.toContain(LODGER_LINE)

    const game = richGame(30)
    const marcus = new InnkeeperMarcus()
    marcus.buyItem(game.state, 'room key')
    expect(marcus.buyItem(game.state, 'room key')).not.toContain(LODGER_LINE)
  })

  it('says nothing about the lodger in ordinary talk', () => {
    expect(new InnkeeperMarcus().talkTo(newGame().state)).not.toContain(
      'grey cloak',
    )
  })
})

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
      'event',
      'dialogue:null',
      'dialogue:null',
      'dialogue:null',
      'dialogue:null',
      'text',
      'event',
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

describe('The Historians recognise their own shelves', () => {
  it('keeps the refusal for an unread journal and the welcome', () => {
    const game = newGame()
    const historians = new Historians()

    const refusal = historians.giveItem(game.state, new TravelersJournal())
    expect(refusal).toContain('You should not give things away')
    expect(game.state.getStoryFlag(FLAG_SHOWED_JOURNAL_TO_HISTORIANS)).toBe(
      false,
    )
    expect(historians.talkTo(game.state)).toContain('Welcome to the historical')
  })

  it('shows the birth rolls on giving the journal', () => {
    const game = newGame()
    game.state.setStoryFlag(FLAG_READ_TRAVELERS_JOURNAL, true)
    const text = new Historians().giveItem(game.state, new TravelersJournal())

    expect(findMarkupProblems(text)).toEqual([])
    expect(text).toContain(
      'They turn the pages slowly at first, then faster. One of them goes pale.',
    )
    expect(text).toContain('These are our birth rolls.')
    expect(text).toContain('Nobody has leave to copy the birth rolls. Nobody!')
    expect(text).toContain(
      'Search the archive with us; we will show you what he read.',
    )
    expect(text).not.toContain('Wardens')
    expect(text).not.toMatch(OLD_LORE)
    expect(game.state.getStoryFlag(FLAG_SHOWED_JOURNAL_TO_HISTORIANS)).toBe(
      true,
    )
  })

  it('invites the search every time until the archive is searched', () => {
    const game = newGame()
    game.state.setStoryFlag(FLAG_SHOWED_JOURNAL_TO_HISTORIANS, true)
    const historians = new Historians()

    for (let i = 0; i < 2; i++) {
      const text = historians.talkTo(game.state)
      expect(text).toContain(
        'Search the archive with us. If a thief has been at our shelves, ' +
          'we want to know what else he read.',
      )
      expect(text).not.toContain('One page is gone')
    }
  })

  it('names the missing page every time after the archive search', () => {
    const game = newGame()
    game.state.setStoryFlag(FLAG_COURT_HERALD_FORMAL_PRESENTATION, true)
    game.state.setStoryFlag(FLAG_SHOWED_JOURNAL_TO_HISTORIANS, true)
    new GreatHall().search(game.state)
    expect(game.state.getStoryFlag(FLAG_RESEARCHED_FAMILY_HERITAGE)).toBe(true)
    const historians = new Historians()

    for (let i = 0; i < 2; i++) {
      const text = historians.talkTo(game.state)
      expect(findMarkupProblems(text)).toEqual([])
      expect(text).toContain(
        'We checked the Willowbrook roll against his notes. One page is gone ' +
          'from it, cut out at the binding, and long ago by the look of it. ' +
          'The year you were born. His notes stop at the same place. Whatever ' +
          'he came for, someone hid it from him before he ever sat down.',
      )
      expect(text).not.toMatch(OLD_LORE)
    }
  })
})
