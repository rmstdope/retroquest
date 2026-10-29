/** The Great Hall archive search names the Wardens of the Dawn (rq-roe.5). */
import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { parseTurn } from '@/lantern/parseTurn'
import { Act2 } from '../Act2'
import {
  FLAG_COURT_HERALD_FORMAL_PRESENTATION,
  FLAG_RESEARCHED_FAMILY_HERITAGE,
  FLAG_SHOWED_JOURNAL_TO_HISTORIANS,
} from '../Act2StoryFlags'
import { GreatHall } from './GreatHall'

/** A game whose state is ready to search the archive. */
function readyGame(): Game {
  const game = new Game([new Act2()])
  game.state.setStoryFlag(FLAG_COURT_HERALD_FORMAL_PRESENTATION, true)
  game.state.setStoryFlag(FLAG_SHOWED_JOURNAL_TO_HISTORIANS, true)
  return game
}

describe('Great Hall archive search', () => {
  it('keeps both failure texts unchanged', () => {
    const game = new Game([new Act2()])
    expect(new GreatHall().search(game.state)).toContain(
      'The [character_name]Court Herald[/character_name] steps between you and the shelves and holds out his hand for your pass.',
    )
    game.state.setStoryFlag(FLAG_COURT_HERALD_FORMAL_PRESENTATION, true)
    expect(new GreatHall().search(game.state)).toContain(
      'Without someone who knows them, you could read for a month and find nothing.',
    )
    expect(game.state.getStoryFlag(FLAG_RESEARCHED_FAMILY_HERITAGE)).toBe(false)
  })

  it('names the Wardens and the stranger on the first success', () => {
    const game = readyGame()
    const text = new GreatHall().search(game.state)

    expect(findMarkupProblems(text)).toEqual([])
    expect(text).not.toContain('Ravencrest')
    expect(text).toContain('the sun rising over three linked rings')
    expect(text).toContain('Of the Wardens of the Dawn.')
    expect(text).toContain(
      "The king stood with them, and lent the crown's own binding to their last great work.",
    )
    expect(text).toContain('Said he came on the business of Malakar.')
    expect(text).not.toContain('Elior')
    expect(game.state.getStoryFlag(FLAG_RESEARCHED_FAMILY_HERITAGE)).toBe(true)
    const kinds = parseTurn(text).map((b) =>
      b.kind === 'dialogue' ? `dialogue:${b.speaker}` : b.kind,
    )
    expect(kinds.filter((k) => k === 'dialogue:null')).toHaveLength(2)
  })

  it('shows only the register entry when searched again', () => {
    const game = readyGame()
    new GreatHall().search(game.state)
    const text = new GreatHall().search(game.state)

    expect(findMarkupProblems(text)).toEqual([])
    expect(text).toContain('You have already been through the archive.')
    expect(text).toContain('Said he came on the business of Malakar.')
    expect(text).not.toContain('Wardens of the Dawn')
  })

  it('opens with a success line', () => {
    const text = new GreatHall().search(readyGame().state)
    expect(text.startsWith("[success]With the historians' guidance")).toBe(true)
  })

  it('remembers the search across save and load', () => {
    const game = readyGame()
    new GreatHall().search(game.state)
    const loaded = new Game([new Act2()])
    loaded.loadSaveData(game.toSaveData())
    expect(new GreatHall().search(loaded.state)).toContain(
      'You have already been through the archive.',
    )
  })
})
