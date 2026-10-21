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
    expect(result).toContain("Mira's words")
    expect(result).toContain('fragments of their story')
    expect(result).toContain('three testimonies will reveal')
    expect(result).toContain('depths where courage is tested')
    expect(result).toContain('heights where wisdom burns')
    expect(result).toContain('shadows where sacrifice echoes')
    expect(result).toContain('[dim]Elior, as you journey')
    expect(result).toContain('darkest power.[/dim]')
    expect(result).toContain('purpose beyond the road ahead')
    expect(result).not.toContain('immediate quest')
  })

  it('reading uses only known, balanced tags', () => {
    const game = new Game([new Act3()])

    const answer = new KeepsakeNote().examine(game.state)

    expect(answer).toContain('keep your eyes open for traces of the past')
    expectMarkupWellFormed(answer)
  })
})
