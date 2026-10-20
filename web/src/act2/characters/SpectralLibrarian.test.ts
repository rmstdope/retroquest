import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { FLAG_MENDED_LIBRARY_ENCHANTMENTS } from '../Act2StoryFlags'
import { SpectralLibrarian } from './SpectralLibrarian'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

/** A game running Act II. */
function createGame(): Game {
  return new Game([new Act2()])
}

describe('Spectral Librarian dialogue markup', () => {
  it('tags the greeting before mending as dialogue', () => {
    const game = createGame()
    const librarian = new SpectralLibrarian()

    const answer = librarian.talkTo(game.state)

    expect(answer).toContain('Prove your worthiness')
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, librarian.name)
  })

  it('tags the revelation after mending as dialogue', () => {
    const game = createGame()
    game.state.setStoryFlag(FLAG_MENDED_LIBRARY_ENCHANTMENTS, true)
    const librarian = new SpectralLibrarian()

    const answer = librarian.talkTo(game.state)

    expect(answer).toContain('Your bloodline traces back')
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, librarian.name)
  })

  it('tags the follow-up after the revelation as dialogue', () => {
    const game = createGame()
    game.state.setStoryFlag(FLAG_MENDED_LIBRARY_ENCHANTMENTS, true)
    const librarian = new SpectralLibrarian()
    librarian.talkTo(game.state)

    const answer = librarian.talkTo(game.state)

    expect(answer).toContain('You have proven yourself worthy')
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, librarian.name)
  })
})
