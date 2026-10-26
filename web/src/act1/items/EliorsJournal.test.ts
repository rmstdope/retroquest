import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { parseTurn } from '@/lantern/parseTurn'
import { Act1 } from '../Act1'
import { EliorsJournal } from './EliorsJournal'

describe('EliorsJournal', () => {
  it('records the three words Elior caught from the voice', () => {
    const journal = new EliorsJournal()
    const entry = journal.use(new Game([new Act1()]).state)

    expect(entry).toContain(
      'And three words at the very end, which I wrote down the moment I ' +
        'woke so I would not lose them: …and let them rest…',
    )
  })

  it('shows the journal entry as two unlabelled paragraphs, so each can be skipped', () => {
    const game = new Game([new Act1()])
    const text = new EliorsJournal().use(game.state)

    expect(findMarkupProblems(text)).toEqual([])
    const quotes = parseTurn(text).filter((b) => b.kind === 'dialogue')
    expect(quotes).toHaveLength(2)
    expect(quotes[0]).toMatchObject({ speaker: null })
    expect(quotes[1]).toMatchObject({ speaker: null })
    expect(text).toContain('[dialogue]What a night.')
    expect(text).toContain('Pulsating, almost.[/dialogue]')
    expect(text).toContain(
      '[dialogue]When I finally drifted off, the dreams came.',
    )
    expect(text).toContain('What did it mean?[/dialogue]')
  })

  it('remembers the dream voice as achingly familiar but never places it', () => {
    const game = new Game([new Act1()])
    const text = new EliorsJournal().use(game.state)

    expect(text).toContain(
      'And the strangest thing — I knew that voice. Not the way you know a ' +
        "neighbour's, but the way you know a song someone sang to you before " +
        'you had words for it. It made my chest ache. ' +
        "I just can't remember from where. What did it mean?",
    )
    expect(text).not.toMatch(/mother|father/i)
  })

  it('shows the same page every time', () => {
    const game = new Game([new Act1()])
    const journal = new EliorsJournal()

    expect(journal.use(game.state)).toBe(journal.use(game.state))
  })
})
