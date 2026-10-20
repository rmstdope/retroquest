import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { parseTurn } from '@/lantern/parseTurn'
import { Act1 } from '../Act1'
import { EliorsJournal } from './EliorsJournal'

describe('EliorsJournal', () => {
  it('shows the journal entry as one unlabelled quote', () => {
    const game = new Game([new Act1()])
    const text = new EliorsJournal().use(game.state)

    expect(findMarkupProblems(text)).toEqual([])
    const quotes = parseTurn(text).filter((b) => b.kind === 'dialogue')
    expect(quotes).toHaveLength(1)
    expect(quotes[0]).toMatchObject({ speaker: null })
    expect(text).toContain('[dialogue]What a night.')
    expect(text).toContain('What did it mean?[/dialogue]')
  })

  it('remembers the dream voice as familiar but never places it', () => {
    const game = new Game([new Act1()])
    const text = new EliorsJournal().use(game.state)

    expect(text).toContain(
      'And the strangest thing — I knew that voice. ' +
        "I just can't remember from where.",
    )
    expect(text).not.toMatch(/mother|father/i)
  })
})
