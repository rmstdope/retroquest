/** Greendale treats Sir Cedric as a disgraced knight until his name is cleared (rq-ghx). */
import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act2 } from './Act2'
import {
  FLAG_CEDRIC_RECOGNISED_SIGIL,
  FLAG_SPOKEN_TO_SIR_CEDRIC,
  FLAG_CEDRIKS_HONOR_ACCEPTED,
  FLAG_CEDRIKS_HONOR_COMPLETED,
  FLAG_EXAMINED_SECRET_DOCUMENTS,
} from './Act2StoryFlags'
import { SecretDocuments } from './items/SecretDocuments'
import { CityNoticeBoard } from './items/CityNoticeBoard'
import { SirCedric } from './characters/SirCedric'
import { TownCrier } from './characters/TownCrier'
import { CastleGuardCaptain } from './characters/CastleGuardCaptain'
import { Squires } from './characters/Squires'
import { TrainingMaster } from './characters/TrainingMaster'
import { LordCommander } from './characters/LordCommander'

const BOARD_EXAMINE =
  "You read through the various postings on the notice board. Most are mundane announcements about trade regulations and festival dates, but one catches your eye: a call under the Lord Commander's seal for able hands to serve the castle in these uncertain times. Beneath it, in a smaller hand, someone has written: [italic]Enquire in the training yard.[/italic]"
const BOARD_DESCRIPTION =
  "A large wooden board posted with official notices, job postings, and announcements. The most prominent posting, under the Lord Commander's seal, calls for able hands to serve the castle."
const CEDRIC_BEFORE =
  'A tall knight in old, dented mail, bearing the scars of many battles. A pale patch on his surcoat shows where his device has been unpicked, and the scabbard at his hip hangs empty. His eyes hold wisdom and determination all the same.'
const CEDRIC_AFTER =
  'A tall knight in old, dented mail, bearing the scars of many battles. His sword hangs at his hip once more, and he carries himself like a man who has been given back his name.'
const GREETING =
  "Greetings, traveler. I am [character_name]Cedric[/character_name]. Some here still call me Sir; you need not. The Lord Commander's notice asks for able hands; I ask for mine here in the yard, where I can see what they can do."
const HILT =
  "Sir Cedric's sword hangs at his hip again. He rests a hand on its hilt as you approach, as if to be sure it is real."

/** A new Act II game. */
function newGame(): Game {
  return new Game([new Act2()])
}

/** Find a content object of the given class in the game's rooms. */
function find<T>(game: Game, type: new () => T): T {
  for (const room of Object.values(game.state.allRooms)) {
    for (const c of room.characters) if (c instanceof type) return c
    for (const i of room.items) if (i instanceof type) return i
  }
  throw new Error('not found')
}

/** Clear Cedric's name through the Lord Commander, as the player does. */
function rule(game: Game): string {
  game.state.setStoryFlag(FLAG_CEDRIKS_HONOR_ACCEPTED, true)
  game.state.setStoryFlag(FLAG_EXAMINED_SECRET_DOCUMENTS, true)
  const docs = new SecretDocuments()
  game.state.inventory.push(docs)
  return new LordCommander().giveItem(game.state, docs)
}

describe('before the ruling', () => {
  it("the notice board is the Lord Commander's call", () => {
    const board = find(newGame(), CityNoticeBoard)
    expect(board.description).toBe(BOARD_DESCRIPTION)
    expect(board.examine(newGame().state)).toBe(BOARD_EXAMINE)
  })

  it('the Town Crier lowers his voice', () => {
    const text = new TownCrier().talkTo(newGame().state)
    expect(text).toContain(
      'Hear ye, hear ye! Welcome to Greendale, traveler! The Lord Commander calls for able hands to serve the realm. Read his notice on the board!',
    )
    expect(text).toContain('He lowers his bell and his voice with it.')
    expect(text).toContain(
      "If it's a sword arm they want of you, they'll send you to the training yard, to [character_name]Sir Cedric[/character_name]. [character_name]Sir Cedric[/character_name], as was. Mind your manners with him; whatever folk say, he's a fair man.",
    )
    expect(text).not.toContain('great')
  })

  it('the Captain says he holds no rank, and keeps the king aside', () => {
    const text = new CastleGuardCaptain().talkTo(newGame().state)
    expect(text).toContain('He holds no rank now, but we still call him Sir')
    expect(text).toContain('ask no questions about the king')
    expect(text).not.toContain('address him')
  })

  it('Cedric greets as plain Cedric and wears the disgrace', () => {
    const game = newGame()
    game.state.inventory.length = 0
    const cedric = find(game, SirCedric)
    expect(cedric.description).toBe(CEDRIC_BEFORE)
    const text = cedric.talkTo(game.state)
    expect(text).toContain(GREETING)
    expect(text).toContain(
      'I have been seeking individuals of courage and skill',
    )
    expect(text).not.toContain('I am [character_name]Sir')
  })
})

describe('the first meeting while carrying the amulet', () => {
  it('uses the new introduction and still breaks off at the sigil', () => {
    const game = newGame()
    const text = find(game, SirCedric).talkTo(game.state)
    expect(text).toContain(GREETING)
    expect(text).toContain('a matter of great—')
    expect(text).not.toContain('I am [character_name]Sir')
  })
})

describe('the ruling', () => {
  it('sends a page to the armoury and gives the sword order', () => {
    const game = newGame()
    const text = rule(game)
    expect(text).toContain(
      'I hereby restore his knighthood and strike the charge from the record.',
    )
    expect(text).toContain(
      'He beckons a page and speaks a few quiet words. The boy runs off toward the armoury, and returns carrying a long bundle wrapped in oilcloth.',
    )
    expect(text).toContain(
      'Take this to the training yard. A knight should not stand among his squires with an empty scabbard.',
    )
    expect(find(game, SirCedric).description).toBe(CEDRIC_AFTER)
  })
})

describe('after the ruling', () => {
  it('Cedric rests a hand on the hilt once, before the charm scene', () => {
    const game = newGame()
    rule(game)
    game.state.setStoryFlag(FLAG_CEDRIC_RECOGNISED_SIGIL, true)
    game.state.setStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC, true)
    const cedric = find(game, SirCedric)
    const first = cedric.talkTo(game.state)
    expect(first).toContain(HILT)
    expect(first.indexOf(HILT)).toBeLessThan(first.indexOf('Malakar'))
    expect(cedric.talkTo(game.state)).not.toContain(HILT)
  })

  it('the town has after lines on every talk', () => {
    const game = newGame()
    rule(game)
    for (let i = 0; i < 2; i++) {
      const crier = new TownCrier().talkTo(game.state)
      expect(crier).toContain('He rings his bell twice, with relish.')
      expect(crier).toContain(
        "The Lord Commander has cleared [character_name]Sir Cedric[/character_name]'s name and given him back his sword. [character_name]Sir Cedric[/character_name], and no 'as was' about it!",
      )
      const captain = new CastleGuardCaptain().talkTo(game.state)
      expect(captain).toContain("Sir by right again, and I'm glad to say it.")
      expect(captain).toContain('ask no questions about the king')
      const squires = new Squires().talkTo(game.state)
      expect(squires).toContain(
        'The squires have abandoned their drill and crowd together, grinning.',
      )
      expect(squires).toContain(
        'He said it was you who found the papers. Thank you.',
      )
      expect(squires).toContain('Did you see? They gave')
      expect(squires).not.toContain('diary')
      expect(crier).not.toContain('as was.')
      expect(captain).not.toContain('no rank')
      const master = new TrainingMaster().talkTo(game.state)
      expect(master).toContain(
        "You've seen it, then? His sword at his hip again.",
      )
      expect(master).toContain('Greendale owes you, and so do I.')
    }
  })

  it('opens the charm scene with the hilt line when the amulet is recognised on the way', () => {
    const game = newGame()
    game.state.setStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC, true)
    rule(game)
    const text = find(game, SirCedric).talkTo(game.state)
    expect(text.startsWith(HILT)).toBe(true)
    expect(text).toContain('Malakar')
  })

  it('does not show the hilt line in a talk without the charm scene', () => {
    const game = newGame()
    game.state.setStoryFlag(FLAG_CEDRIC_RECOGNISED_SIGIL, true)
    game.state.setStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC, true)
    rule(game)
    const cedric = find(game, SirCedric)
    cedric.receivedNaturesCharm = true // a save made after the charm was given
    expect(cedric.talkTo(game.state)).not.toContain(HILT)
  })

  it('a talk in the game flow shows the hilt line through the parser', () => {
    const game = newGame()
    game.state.currentRoom = game.state.allRooms.CastleCourtyard
    game.state.setStoryFlag(FLAG_CEDRIC_RECOGNISED_SIGIL, true)
    game.state.setStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC, true)
    rule(game)
    expect(executeCommands(game, ['talk to sir cedric'])).toContain(HILT)
  })
})

describe('saves', () => {
  it('round-trips the sword state through a save', () => {
    const game = newGame()
    rule(game)
    const loaded = newGame()
    loaded.loadSaveData(game.toSaveData())
    const cedric = find(loaded, SirCedric)
    expect(cedric.description).toBe(CEDRIC_AFTER)
    expect(new TownCrier().talkTo(loaded.state)).toContain('relish')
  })

  it('a save made before the change loads with the right descriptions', () => {
    for (const cleared of [false, true]) {
      const game = newGame()
      if (cleared) game.state.setStoryFlag(FLAG_CEDRIKS_HONOR_COMPLETED, true)
      find(game, SirCedric).description = 'A noble knight in gleaming armor.'
      find(game, CityNoticeBoard).description = 'old'
      new Act2().afterLoad(game.state)
      expect(find(game, SirCedric).description).toBe(
        cleared ? CEDRIC_AFTER : CEDRIC_BEFORE,
      )
      expect(find(game, CityNoticeBoard).description).toBe(BOARD_DESCRIPTION)
    }
  })
})
