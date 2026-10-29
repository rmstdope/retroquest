import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { parseTurn } from '@/lantern/parseTurn'
import { executeCommands } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import { EliorsJournal } from './EliorsJournal'

describe('EliorsJournal', () => {
  it('records the three words Elior caught from the voice', () => {
    const journal = new EliorsJournal()
    const entry = journal.use(new Game([new Act1()]).state)

    expect(entry).toContain(
      'it said three words more, and I wrote them down the moment I woke so ' +
        'I would not lose them: …and let them rest…',
    )
  })

  it('shows the entry as four unlabelled paragraphs, so each can be skipped', () => {
    const game = new Game([new Act1()])
    const text = new EliorsJournal().use(game.state)

    expect(findMarkupProblems(text)).toEqual([])
    const quotes = parseTurn(text).filter((b) => b.kind === 'dialogue')
    expect(quotes).toHaveLength(4)
    for (const quote of quotes) expect(quote).toMatchObject({ speaker: null })
    expect(text).toContain('[dialogue]The storm kept me up half the night.')
    expect(text).toContain('and it was not lightning.[/dialogue]')
    expect(text).toContain('[dialogue]When I slept, I dreamed.')
    expect(text).toContain("A man's hand lifted a child out of the dark.")
    expect(text).toContain('three notes up and home again')
    expect(text).toContain('[dialogue]I knew that voice.')
    expect(text).toContain('[dialogue]When I woke, the tune was still going.')
    expect(text).toContain(
      'Someone out by the hearth was humming it.[/dialogue]',
    )
  })

  it('remembers the dream voice as achingly familiar but never places it', () => {
    const game = new Game([new Act1()])
    const text = new EliorsJournal().use(game.state)

    expect(text).toContain(
      'I knew that voice. Not the way you know a ' +
        "neighbour's, but the way you know a song someone sang to you before " +
        'you had words for it. It made my chest ache. ' +
        "I can't think from where.",
    )
    expect(text).not.toMatch(/mother|father/i)
  })

  it('is refused by name, as Elior\'s Journal and without a "the"', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.EliorsCottage
    const answer = executeCommands(game, ['use lantern', 'take journal'])

    expect(answer).toContain(
      "[failure]You can't take [item_name]Elior's Journal[/item_name].[/failure]",
    )
  })

  it('is named the same way when used with itself or with nothing here', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.EliorsCottage
    const answer = executeCommands(game, [
      'use lantern',
      'use journal with journal',
      'use journal with xyz',
    ])

    expect(answer).toContain(
      "You can't use [item_name]Elior's Journal[/item_name] with itself.",
    )
    expect(answer).toContain(
      "to use with [item_name]Elior's Journal[/item_name].",
    )
    expect(answer).not.toContain("elior's journal")
  })

  it('shows the same page every time', () => {
    const game = new Game([new Act1()])
    const journal = new EliorsJournal()

    expect(journal.use(game.state)).toBe(journal.use(game.state))
  })
})
