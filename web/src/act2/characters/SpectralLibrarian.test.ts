import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import {
  FLAG_MENDED_LIBRARY_ENCHANTMENTS,
  FLAG_READ_ANCIENT_CHRONICLE,
} from '../Act2StoryFlags'
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

    expect(answer).toContain(
      "'Mind the shelves. Everything here has been kept a long time, and the wards on the oldest texts are failing. I can keep a book; I cannot mend one. Mend the wards, and I will show you where to look for the mark you carry.'",
    )
    expect(answer).not.toMatch(/eternal|worthiness/i)
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, librarian.name)
  })

  it('tags the revelation after mending as dialogue', () => {
    const game = createGame()
    game.state.setStoryFlag(FLAG_MENDED_LIBRARY_ENCHANTMENTS, true)
    const librarian = new SpectralLibrarian()

    const answer = librarian.talkTo(game.state)

    expect(answer).toContain('The Wardens of the Dawn wrote it')
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, librarian.name)
  })

  it('tags the follow-up after the revelation as dialogue', () => {
    const game = createGame()
    game.state.setStoryFlag(FLAG_MENDED_LIBRARY_ENCHANTMENTS, true)
    const librarian = new SpectralLibrarian()
    librarian.talkTo(game.state)

    const answer = librarian.talkTo(game.state)

    expect(answer).toContain('The chronicle is waiting on its shelf')
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, librarian.name)
  })

  it('closes the matter once the chronicle has been read', () => {
    const game = createGame()
    game.state.setStoryFlag(FLAG_MENDED_LIBRARY_ENCHANTMENTS, true)
    const librarian = new SpectralLibrarian()
    librarian.talkTo(game.state)
    game.state.setStoryFlag(FLAG_READ_ANCIENT_CHRONICLE, true)

    const answer = librarian.talkTo(game.state)

    expect(answer).toContain('You have read what the Wardens left.')
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, librarian.name)
  })

  it('never calls Elior chosen, fated or descended from ancient mages', () => {
    const game = createGame()
    const librarian = new SpectralLibrarian()
    const lines = [librarian.talkTo(game.state)]
    game.state.setStoryFlag(FLAG_MENDED_LIBRARY_ENCHANTMENTS, true)
    lines.push(librarian.talkTo(game.state), librarian.talkTo(game.state))
    game.state.setStoryFlag(FLAG_READ_ANCIENT_CHRONICLE, true)
    lines.push(librarian.talkTo(game.state))

    for (const line of lines) {
      expect(line).not.toMatch(/chosen|destiny|prophec|ancient mages|Malakar/i)
    }
  })

  it('tells the reveal in the agreed order', () => {
    const game = createGame()
    game.state.setStoryFlag(FLAG_MENDED_LIBRARY_ENCHANTMENTS, true)

    const answer = new SpectralLibrarian().talkTo(game.state)

    const lines = [
      "'You mended the wards with your [spell_name]mend[/spell_name] spell. They have been failing longer than I care to count; thank you. Now, what you came for.'",
      " The spirit's eyes glow brighter as they speak: ",
      "'I am a keeper, not a teller. The answer you came for is in that chronicle. The Wardens of the Dawn wrote it, and their mark is on its cover, the same mark you wear at your throat. Read it, and you will learn the [spell_name]dispel[/spell_name] spell.'",
      ' They gesture to a crystal resting on the shelf: ',
      "'And take this [item_name]Crystal Focus[/item_name]. What you do with them is yours to choose.'",
    ]
    let from = 0
    for (const line of lines) {
      const at = answer.indexOf(line, from)
      expect(at, line).toBeGreaterThanOrEqual(from)
      from = at + line.length
    }
  })

  it('examines as a working scholar who watches hands', () => {
    const game = createGame()
    const answer = new SpectralLibrarian().examine(game.state)

    expect(answer).toContain(
      "Up close, the [character_name]Spectral Librarian[/character_name]'s robes are worn thin at the cuffs, " +
        "the way a working scholar's are. They watch your hands more than " +
        'your face, the way a librarian watches anyone standing near the books.',
    )
    expect(answer).not.toMatch(/wisdom|ancient|eternal|vigil/i)
  })
})
