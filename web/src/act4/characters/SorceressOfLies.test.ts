import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { ACT4_GOLDEN_PATH } from '../Act4GoldenPath'
import {
  FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED,
  FLAG_ACT4_SORCERESS_OF_LIES_STARTED,
  FLAG_ACT4_SORCERESS_TRUTH_ACQUIRED,
} from '../Act4StoryFlags'
import {
  executeCommands,
  expectDialogueSpeaker,
  expectItemInInventory,
  expectMarkupWellFormed,
  expectQuestCompleted,
  expectSpellKnown,
  expectStoryFlag,
} from '@/testing/gameHelpers'

/** The golden path as far as the redeemed knight. */
const TO_KNIGHT = ACT4_GOLDEN_PATH.slice(
  0,
  ACT4_GOLDEN_PATH.indexOf('say redemption to knight') + 1,
)

const NAME_FRIENDS = [
  'say mira to whispers',
  'say cedric to whispers',
  'say nyx to whispers',
]

const STUMBLE =
  'You set your foot on the stair, and the whispers close in: your friends have left you, no one is coming, you were always alone. You stumble back down.'
const FIRST_LOOK =
  "At the chamber's heart the Sorceress of Lies waits, her staff crowned with a small silver mask. Your breath catches: it is the mask from Elena's wrist."
const LAUGHS =
  'She laughs, and the chamber laughs with her. Your word is lost among the whispers.'
const LISTEN_FIRST =
  'You cannot answer a pain you cannot hear. Beneath the whispers her heart is saying something, too quietly for ears alone.'
const SOME_HEARD =
  'You have heard some of her, but not all. There is more in this chamber that is hers to listen to.'
const THREE_HEARTS = [
  "cast heart's truth on sorceress",
  "cast heart's truth on staff",
  "cast heart's truth on whispers",
]
const SMILES = 'The Sorceress only smiles.'
const NORTH_WALL =
  'The north arch is a wall of whispering crystal. It will not open while the Sorceress holds the chamber.'

/** A game with the knight redeemed and Elior in the tower, token not raised. */
function inTower(): Game {
  const game = new Game([new Act4()])
  executeCommands(game, [...TO_KNIGHT, 'e'])
  return game
}

/** A game with Elior in the chamber. */
function inChamber(): Game {
  const game = inTower()
  executeCommands(game, NAME_FRIENDS)
  executeCommands(game, ['up'])
  return game
}

function reload(game: Game): void {
  expect(game.loadSaveData(game.toSaveData())).toContain(
    'Game loaded successfully.',
  )
}

describe('The Sorceress of Lies', () => {
  it('bars the stair until the token is raised', () => {
    const game = inTower()
    expect(executeCommands(game, ['go up'])).toContain(STUMBLE)
    expect(game.state.currentRoom.name).toBe('Tower of Shadows')
    expect(executeCommands(game, ['use loyalty token'])).toContain(
      'Say their names.',
    )
    expect(executeCommands(game, ['go up'])).toContain(STUMBLE)
    executeCommands(game, NAME_FRIENDS)
    expect(executeCommands(game, ['go up'])).toContain('Chamber of Whispers')
  })

  it('shows her and the mask on the first look, and starts the quest on entering', () => {
    const game = inChamber()
    expect(game.state.getStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_STARTED)).toBe(
      true,
    )
    expect(game.state.activatedQuests.map((q) => q.name)).toContain(
      'The Sorceress of Lies',
    )
    const look = game.state.currentRoom.describe(game.state)
    expect(look).toContain('the only beautiful room in the fortress')
    expect(look).toContain(FIRST_LOOK)
    expectMarkupWellFormed(look)
  })

  it('starts the quest on a look or a talk in a game saved inside the chamber', () => {
    for (const command of [
      'examine staff',
      'examine sorceress of lies',
      'talk to sorceress',
    ]) {
      const game = inChamber()
      game.state.setStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_STARTED, false)
      executeCommands(game, [command])
      expectStoryFlag(game.state, FLAG_ACT4_SORCERESS_OF_LIES_STARTED, true)
    }
  })

  it('says the token is still warm in the chamber', () => {
    const game = inChamber()
    expect(executeCommands(game, ['use loyalty token'])).toContain(
      'The token is still warm against your heart. Her whispers cannot reach you.',
    )
  })

  it('looks and talks before the badge', () => {
    const game = inChamber()
    expect(executeCommands(game, ['examine staff'])).toContain(
      "The mask is smooth and smiling, with no eyes behind it. It is the very mark that sat beneath Elena's curse in Greendale. This is the hand that cursed her.",
    )
    expect(executeCommands(game, ['examine sorceress of lies'])).toContain(
      'She is beautiful in the way the chamber is beautiful: a little too perfect, a little wrong. Her smile never reaches her eyes.',
    )
    const talk = executeCommands(game, ['talk to sorceress'])
    expectDialogueSpeaker(talk, 'Sorceress of Lies')
    expect(talk).toContain(
      'Little Elior. Your parents sold you to save themselves, did you know? Malakar told me so himself. Turn back.',
    )
    expect(executeCommands(game, ['say understanding to sorceress'])).toContain(
      LAUGHS,
    )
    expect(executeCommands(game, ['go north'])).toContain(NORTH_WALL)
    expect(game.state.currentRoom.name).toBe('Chamber of Whispers')
  })

  it("teaches Heart's Truth when the badge is shown, once", () => {
    const game = inChamber()
    const shown = executeCommands(game, ["use knight's redemption"])
    expect(shown).toContain(
      "You hold up the knight's badge. The Sorceress stares at it, and for the first time her smile slips. Beneath the whispers you hear something else: a voice, very small, that is not lying.",
    )
    expect(shown).toContain("Heart's Truth")
    expect(shown).toContain('Hear the true heart beneath a lie.')
    expectSpellKnown(game.state, 'hearts_truth')
    expectMarkupWellFormed(shown)
    expect(executeCommands(game, ["use knight's redemption"])).toContain(
      'She has seen the badge. She cannot stop looking at it.',
    )
    const talk = executeCommands(game, ['talk to sorceress'])
    expectDialogueSpeaker(talk, 'Sorceress of Lies')
    expect(talk).toContain(
      'He turned? Then he is a fool. Everyone lies, little Elior.',
    )
    expect(executeCommands(game, ['say understanding to sorceress'])).toContain(
      LISTEN_FIRST,
    )
    expect(executeCommands(game, ['say hello to sorceress'])).toContain(SMILES)
  })

  it('leaves the badge without a use elsewhere', () => {
    const game = inTower()
    expect(executeCommands(game, ["use knight's redemption"])).toContain(
      "can't use",
    )
  })

  it("casts Heart's Truth on her, once, and fizzles elsewhere", () => {
    const game = inChamber()
    executeCommands(game, ["use knight's redemption"])
    expect(executeCommands(game, ["cast heart's truth"])).toContain(
      'You listen for a hidden heart, but there is no lie here to hear beneath.',
    )
    expect(executeCommands(game, ["cast heart's truth on staff"])).toContain(
      'It was made to be looked at',
    )
    expect(executeCommands(game, ["cast heart's truth on tree"])).toContain(
      "You don't see",
    )
    const cast = executeCommands(game, ["cast heart's truth on sorceress"])
    expect(cast).toContain(
      'The whispers fall away. Beneath them the Sorceress is alone, as she has always been: no one has ever spoken to her without a lie, and she has never answered with anything else.',
    )
    expect(cast).toContain(
      'And under the loneliness, older and smaller: a girl in a hungry winter, and the parents who sold her for a sack of grain. She tells you the lie because she believes it. It is the only story about parents she has ever known.',
    )
    expectMarkupWellFormed(cast)
    const again = executeCommands(game, ["cast heart's truth on sorceress"])
    expect(again).toContain('You already hear her heart beneath the lies.')
    expect(again).not.toContain('a girl in a hungry winter')
  })

  it('hears the staff and the whispers in any order, once each', () => {
    const game = inChamber()
    executeCommands(game, ["use knight's redemption"])
    expect(executeCommands(game, ['examine whispers'])).toContain(
      'You lean close to a crystal.',
    )
    const whispers = executeCommands(game, ["cast heart's truth on crystals"])
    expect(whispers).toContain('They are one: hers')
    expectMarkupWellFormed(whispers)
    expect(executeCommands(game, ["cast heart's truth on whispers"])).toBe(
      '[dim]You have already heard whose voice the whispers are.[/dim]',
    )
    expect(executeCommands(game, ['say understanding to sorceress'])).toContain(
      SOME_HEARD,
    )
    executeCommands(game, ["cast heart's truth on staff"])
    expect(executeCommands(game, ["cast heart's truth on staff"])).toBe(
      '[dim]You have already heard what the mask hides.[/dim]',
    )
    expect(executeCommands(game, ['say understanding to sorceress'])).toContain(
      SOME_HEARD,
    )
    executeCommands(game, [THREE_HEARTS[0]])
    expect(executeCommands(game, ['say understanding to sorceress'])).toContain(
      'I understand',
    )
  })

  it('is redeemed by understanding, with one scene of confession', () => {
    const game = inChamber()
    executeCommands(game, ["use knight's redemption", ...THREE_HEARTS])
    const said = executeCommands(game, ['say understanding to sorceress'])
    expect(said).toContain(
      '“I understand,” you say. “You have been alone in here a long time.” The Sorceress goes very still. One by one the crystals stop whispering, until the chamber is silent for the first time in years.',
    )
    expectDialogueSpeaker(said, 'Sorceress of Lies')
    const first = said.indexOf('Elena. The girl at the inn.')
    const second = said.indexOf('I told the king')
    const third = said.indexOf('No one has ever spoken to me without a lie.')
    const gift = said.indexOf('She lifts the silver mask from her staff')
    const received = said.indexOf('You received')
    expect(said).toContain(
      'I have told so many lies that I forgot what my own voice sounds like. And I told you your parents sold you. Mine did. I wanted it to be true of everyone, so that it would not only be true of me.',
    )
    expect(first).toBeGreaterThan(0)
    expect(second).toBeGreaterThan(first)
    expect(third).toBeGreaterThan(second)
    expect(gift).toBeGreaterThan(third)
    expect(received).toBeGreaterThan(gift)
    expect(said).toContain("Sorceress's Truth")
    expectMarkupWellFormed(said)
    expectItemInInventory(game.state, "Sorceress's Truth", true)
    expectQuestCompleted(game.state, 'The Sorceress of Lies')
    expectStoryFlag(game.state, FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED, true)
    expectStoryFlag(game.state, FLAG_ACT4_SORCERESS_TRUTH_ACQUIRED, true)
    expect(executeCommands(game, ['go north'])).toContain('Memory Vault')
  })

  it('stays as the Unmasked Sorceress by the open arch', () => {
    const game = inChamber()
    executeCommands(game, [
      "use knight's redemption",
      ...THREE_HEARTS,
      'say understanding to sorceress',
    ])
    const look = game.state.currentRoom.describe(game.state)
    expect(look).toContain(
      'The chamber is still now. The crystals have stopped whispering, and the floor lies flat and plain beneath your feet. The Sorceress sits by the open north arch; her staff lies across her knees, bare where the mask once sat.',
    )
    expect(look).not.toContain(FIRST_LOOK)
    for (const name of [
      'sorceress',
      'sorceress of lies',
      'unmasked sorceress',
    ]) {
      expect(executeCommands(game, [`examine ${name}`])).toContain(
        "Without the chamber's glamour she looks tired and ordinary",
      )
    }
    const talk = executeCommands(game, ['talk to sorceress'])
    expectDialogueSpeaker(talk, 'Unmasked Sorceress')
    expect(talk).toContain('tell Elena I am sorry.')
    expect(executeCommands(game, ['say understanding to sorceress'])).toContain(
      'She has already been heard. She nods to you, once.',
    )
    expect(executeCommands(game, ['examine staff'])).toContain(
      'Her staff lies across her knees, bare where the mask once sat.',
    )
    expect(executeCommands(game, ['examine whispers'])).toBe(
      '[event]The crystals are silent now.[/event]',
    )
    expect(executeCommands(game, ["cast heart's truth on whispers"])).toContain(
      'You have already heard whose voice',
    )
    expect(executeCommands(game, ["examine sorceress's truth"])).toContain(
      'The silver mask from her staff, smooth and smiling, with no eyes behind it.',
    )
    expect(executeCommands(game, ["use sorceress's truth"])).toContain(
      'Somewhere ahead is someone who needs to see that a liar can choose the truth.',
    )
  })

  it('keeps every state through a save and load', () => {
    const game = inTower()
    reload(game)
    expect(executeCommands(game, ['go up'])).toContain(STUMBLE)
    executeCommands(game, NAME_FRIENDS)
    reload(game)
    expect(executeCommands(game, ['go up'])).toContain('Chamber of Whispers')
    reload(game)
    expect(executeCommands(game, ['go north'])).toContain(NORTH_WALL)
    executeCommands(game, ["use knight's redemption"])
    reload(game)
    expectSpellKnown(game.state, 'hearts_truth')
    expect(executeCommands(game, ['say understanding to sorceress'])).toContain(
      LISTEN_FIRST,
    )
    executeCommands(game, ["cast heart's truth on sorceress"])
    reload(game)
    expect(
      executeCommands(game, ["cast heart's truth on sorceress"]),
    ).toContain('already hear her heart')
    expect(executeCommands(game, ['say understanding to sorceress'])).toContain(
      SOME_HEARD,
    )
    executeCommands(game, THREE_HEARTS.slice(1))
    reload(game)
    executeCommands(game, ['say understanding to sorceress'])
    reload(game)
    expectItemInInventory(game.state, "Sorceress's Truth", true)
    expectQuestCompleted(game.state, 'The Sorceress of Lies')
    const talk = executeCommands(game, ['talk to unmasked sorceress'])
    expectDialogueSpeaker(talk, 'Unmasked Sorceress')
    expect(talk).toContain('tell Elena I am sorry')
    expect(game.state.currentRoom.describe(game.state)).toContain(
      'The chamber is still now.',
    )
    expect(executeCommands(game, ['go north'])).toContain('Memory Vault')
  })
})
