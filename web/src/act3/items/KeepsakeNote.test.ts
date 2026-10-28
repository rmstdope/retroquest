import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { FLAG_ACT3_ECHOES_QUEST_STARTED } from '../Act3StoryFlags'
import { KeepsakeNote } from './KeepsakeNote'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

describe('KeepsakeNote', () => {
  it('initializes correctly', () => {
    const note = new KeepsakeNote()

    expect(note.name).toBe('Keepsake Note')
    expect(note.shortName).toBe('note')
    expect(note.canBeCarried).toBe(true)
    expect(note.description).toContain('small, worn piece of parchment')
  })

  it('starts the echoes quest when examined', () => {
    const game = new Game([new Act3()])
    const note = new KeepsakeNote()
    expect(game.state.getStoryFlag(FLAG_ACT3_ECHOES_QUEST_STARTED)).toBe(false)

    const result = note.examine(game.state)

    expect(game.state.getStoryFlag(FLAG_ACT3_ECHOES_QUEST_STARTED)).toBe(true)
    expect(result).not.toContain('You unfold')
    expect(result).toContain(
      '[dialogue]Elior. The people who made the relics left words behind them',
    )
    expect(result).toContain('before you judge anyone.[/dialogue]')
    expect(result).toContain('She has underlined the last line twice.')
    expect(result).not.toContain('[dim]')
    expect(result).not.toContain('immediate quest')
  })

  it('does not give away how the parents hid Elior (Red Line)', () => {
    const game = new Game([new Act3()])

    const result = new KeepsakeNote().examine(game.state)

    expect(result).not.toContain('hid you')
    expect(result).not.toContain('his sight')
    expect(result).not.toContain('— M.')
  })

  it('reading uses only known, balanced tags', () => {
    const game = new Game([new Act3()])

    const answer = new KeepsakeNote().examine(game.state)

    expect(answer).toContain('Keep your eyes open for traces of the past')
    expectMarkupWellFormed(answer)
  })
})
