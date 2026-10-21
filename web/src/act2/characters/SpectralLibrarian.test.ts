import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { AncientAmulet } from '../items/AncientAmulet'
import {
  FLAG_LIBRARIAN_CONFESSED,
  FLAG_LIBRARIAN_NOTICED_AMULET,
  FLAG_MENDED_LIBRARY_ENCHANTMENTS,
  FLAG_READ_ANCIENT_CHRONICLE,
  FLAG_SPECTRAL_LIBRARIAN_FRIENDLY,
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

    expect(answer).toContain('We wrote it, and our mark is on its cover.')
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

    expect(answer).toContain('You have read what we left.')
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
      "'I am a keeper, not a teller. The answer you came for is in that chronicle. We wrote it, and our mark is on its cover. Read it, and you will learn the [spell_name]dispel[/spell_name] spell.'",
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

const GLANCE_NARRATION =
  'The [character_name]Spectral Librarian[/character_name] turns toward you, and stops. Their eyes have found the [item_name]Ancient Amulet[/item_name] at your throat.'
const GLANCE_LINE =
  'I have not seen that worn since the last hand wrote in that chronicle.'
const CONFESSION =
  'I wore that mark once, when I had a body to wear it in. Whose yours was, I cannot tell you; only that the Wardens did not give them away. We taught the unbinding to those we trusted, and wrote it down for the rest.'
const GREETING_START = "'Mind the shelves."
const THANKS =
  "'You mended the wards with your [spell_name]mend[/spell_name] spell. They have been failing longer than I care to count; thank you. Now, what you came for.'"

/** A game with the librarian, optionally with the wards mended and the amulet carried. */
function setup(options: { amulet: boolean; mended?: boolean }) {
  const game = createGame()
  game.state.inventory = game.state.inventory.filter(
    (item) => !(item instanceof AncientAmulet),
  )
  if (options.amulet) game.state.inventory.push(new AncientAmulet())
  if (options.mended)
    game.state.setStoryFlag(FLAG_MENDED_LIBRARY_ENCHANTMENTS, true)
  return { game, librarian: new SpectralLibrarian() }
}

/** Assert the fragments appear in order in the answer. */
function expectInOrder(answer: string, fragments: string[]): void {
  let from = 0
  for (const fragment of fragments) {
    const at = answer.indexOf(fragment, from)
    expect(at, fragment).toBeGreaterThanOrEqual(from)
    from = at + fragment.length
  }
}

describe('Spectral Librarian notices the amulet', () => {
  it('glances once at the first greeting while the amulet is carried', () => {
    const { game, librarian } = setup({ amulet: true })

    const first = librarian.talkTo(game.state)
    const second = librarian.talkTo(game.state)

    expectInOrder(first, [GLANCE_NARRATION, GLANCE_LINE, GREETING_START])
    expect(second).toContain(GREETING_START)
    expect(second).not.toContain(GLANCE_LINE)
    expectMarkupWellFormed(first)
  })

  it('greets without a glance when the amulet is not carried', () => {
    const { game, librarian } = setup({ amulet: false })

    const answer = librarian.talkTo(game.state)

    expect(answer).toContain(GREETING_START)
    expect(answer).not.toContain(GLANCE_LINE)
    expect(game.state.getStoryFlag(FLAG_LIBRARIAN_NOTICED_AMULET)).toBe(false)
  })

  it('confesses in the mending talk after the glance was heard', () => {
    const { game, librarian } = setup({ amulet: true })
    librarian.talkTo(game.state)
    game.state.setStoryFlag(FLAG_MENDED_LIBRARY_ENCHANTMENTS, true)

    const answer = librarian.talkTo(game.state)

    expectInOrder(answer, [
      THANKS,
      ' Their eyes go back to the [item_name]Ancient Amulet[/item_name]. ',
      `'${CONFESSION}'`,
      " The spirit's eyes glow brighter as they speak: ",
      "'I am a keeper, not a teller.",
      ' They gesture to a crystal resting on the shelf: ',
    ])
    expect(answer.startsWith('[success]')).toBe(true)
    expect(game.state.getStoryFlag(FLAG_LIBRARIAN_CONFESSED)).toBe(true)
    expect(game.state.currentRoom.items.map((i) => i.name)).toContain(
      'Crystal Focus',
    )
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, librarian.name)
  })

  it('speaks glance and confession as one speech when the glance was never heard', () => {
    const { game, librarian } = setup({ amulet: true, mended: true })

    const answer = librarian.talkTo(game.state)

    expectInOrder(answer, [
      THANKS,
      ' Their eyes find the [item_name]Ancient Amulet[/item_name] at your throat, and stay there. ',
      `'${GLANCE_LINE} ${CONFESSION}'`,
      " The spirit's eyes glow brighter as they speak: ",
    ])
  })

  it('mends without a confession when the amulet is not carried', () => {
    const { game, librarian } = setup({ amulet: false, mended: true })

    const answer = librarian.talkTo(game.state)

    expect(answer).toContain(THANKS)
    expect(answer).not.toContain('I wore that mark')
    expect(answer).not.toContain('Their eyes')
    expect(answer).toContain('We wrote it, and our mark is on its cover.')
    expect(game.state.getStoryFlag(FLAG_LIBRARIAN_CONFESSED)).toBe(false)
  })

  it('plays the confession once on the first later talk with the amulet', () => {
    const { game, librarian } = setup({ amulet: false, mended: true })
    librarian.talkTo(game.state)
    game.state.inventory.push(new AncientAmulet())

    const delayed = librarian.talkTo(game.state)
    const again = librarian.talkTo(game.state)

    expectInOrder(delayed, [
      "The [character_name]Spectral Librarian[/character_name]'s eyes go to the [item_name]Ancient Amulet[/item_name].",
      `'${GLANCE_LINE} ${CONFESSION}'`,
      "'The chronicle is waiting on its shelf. We wrote it for whoever would read it; I cannot read it for you.'",
    ])
    expect(again).not.toContain('I wore that mark')
    expectMarkupWellFormed(delayed)
  })

  it('uses the read line in the delayed confession once the chronicle is read', () => {
    const { game, librarian } = setup({ amulet: false, mended: true })
    librarian.talkTo(game.state)
    game.state.setStoryFlag(FLAG_READ_ANCIENT_CHRONICLE, true)
    game.state.inventory.push(new AncientAmulet())

    const delayed = librarian.talkTo(game.state)

    expectInOrder(delayed, [
      CONFESSION,
      "'You have read what we left. The rest is not written on any shelf of mine. Use this knowledge wisely.'",
    ])
  })

  it('keeps Act III facts reserved in every line', () => {
    const { game, librarian } = setup({ amulet: true })
    const lines = [librarian.talkTo(game.state)]
    game.state.setStoryFlag(FLAG_MENDED_LIBRARY_ENCHANTMENTS, true)
    lines.push(librarian.talkTo(game.state), librarian.talkTo(game.state))
    game.state.setStoryFlag(FLAG_READ_ANCIENT_CHRONICLE, true)
    lines.push(librarian.talkTo(game.state))

    for (const line of lines) {
      expect(line).not.toMatch(/Aren|Lysa|Malakar|friend|three|newer ink/i)
    }
  })

  it('remembers what was heard across a save and a reload', () => {
    const { game, librarian } = setup({ amulet: true })
    librarian.talkTo(game.state)
    const fresh = createGame()
    expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')

    expect(fresh.state.getStoryFlag(FLAG_LIBRARIAN_NOTICED_AMULET)).toBe(true)
    const again = new SpectralLibrarian().talkTo(fresh.state)
    expect(again).not.toContain(GLANCE_LINE)
  })

  it('plays the confession for a save made after mending without the new flags', () => {
    const { game } = setup({ amulet: true, mended: true })
    game.state.setStoryFlag(FLAG_SPECTRAL_LIBRARIAN_FRIENDLY, true)
    const fresh = createGame()
    fresh.loadSaveData(game.toSaveData())

    const answer = new SpectralLibrarian().talkTo(fresh.state)

    expect(answer).toContain(`'${GLANCE_LINE} ${CONFESSION}'`)
  })
})
