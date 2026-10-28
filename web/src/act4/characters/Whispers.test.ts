import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { LoyaltyToken } from '../items/LoyaltyToken'
import { ACT4_GOLDEN_PATH } from '../Act4GoldenPath'
import {
  executeCommands,
  expectCharacterInRoom,
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

/** The golden path as far as the redeemed knight. */
const TO_KNIGHT = ACT4_GOLDEN_PATH.slice(
  0,
  ACT4_GOLDEN_PATH.indexOf('say redemption to knight') + 1,
)

const STUMBLE = 'You stumble back down.'
const HINT =
  'They do not answer you. They only say it again, closer: your friends have left you. No one is coming. Name one who stayed. You cannot.'
const FIRST = 'The token warms against your palm, and the whispers falter.'
const SECOND = 'The token warms again. The whispers draw back from the stair.'
const NYX_LEAD =
  'The token warms against your palm. A small light flickers at the edge of ' +
  "your eye, and in your pack the crystalline pendant she gave you, Nyx's " +
  'Token, is warm too.'
const OPEN =
  'The whispers have nothing left to say. They thin like smoke, and the stair above lies open.'
const MIRA_LINE =
  "I'm at the gate, Elior. I said I'd hold it, and I'm holding it."
const CEDRIC_LINE =
  'I am in the hall below you, Elior. I have not left. Go on up.'
const NYX_LINE = "Left? I'm right here. I never was anywhere else."
const GRANDMOTHER =
  '[effect]You say it into the dark, and something in you steadies — but she is far from here, and the whispers know it.[/effect] She did not come to the gate, they say. Who did? No one.'
const SWALLOWED =
  'The whispers swallow the word and go on: no one stayed. Name one, if you can.'
const MYSELF =
  'The whispers like that answer. Yes, they say: you, and only you, alone on a stair.'
const AFTER =
  'The whispers are gone. The stair winds up into the dark, and it is only a stair.'

/** A game with Elior in the tower, nobody named yet. */
function inTower(): Game {
  const game = new Game([new Act4()])
  executeCommands(game, [...TO_KNIGHT, 'e'])
  return game
}

describe('The whispers in the Tower of Shadows', () => {
  it('are listed in the room and bar the stair', () => {
    const game = inTower()
    const room = game.state.currentRoom.describe(game.state)
    expect(room).toContain('Whispers')
    expect(room).not.toContain('(Chamber')
    expect(executeCommands(game, ['go up'])).toContain(STUMBLE)
  })

  it('point at naming when talked to', () => {
    const game = inTower()
    expect(executeCommands(game, ['talk to whispers'])).toContain(HINT)
  })

  it('answer each name with a lead-in and that friend’s line', () => {
    const game = inTower()
    const mira = executeCommands(game, ['say Mira to whispers'])
    expect(mira).toContain(FIRST)
    expect(mira).toContain(MIRA_LINE)
    expectDialogueSpeaker(mira, 'Mira')
    const cedric = executeCommands(game, ['say sir cedric to whispers'])
    expect(cedric).toContain(SECOND)
    expect(cedric).toContain(CEDRIC_LINE)
    expectDialogueSpeaker(cedric, 'Sir Cedric')
    const nyx = executeCommands(game, ['say nyx to whispers'])
    expect(nyx).toContain(NYX_LEAD)
    expect(nyx).toContain(NYX_LINE)
    expect(nyx).toContain(OPEN)
    expectDialogueSpeaker(nyx, 'Nyx')
  })

  it('give the lead-in by order, and Nyx’s own whenever she is named', () => {
    const game = inTower()
    const nyx = executeCommands(game, ['say nyx to whispers'])
    expect(nyx).toContain(NYX_LEAD)
    expect(nyx).not.toContain(FIRST)
    expect(executeCommands(game, ['say cedric to whispers'])).toContain(SECOND)
    const mira = executeCommands(game, ['say "mira." to whispers'])
    expect(mira).toContain(OPEN)
    expect(mira).not.toContain(FIRST)
    expect(mira).not.toContain(SECOND)
  })

  it('open the stair after the third name and are then gone', () => {
    const game = inTower()
    executeCommands(game, [
      'say cedric to whispers',
      'say mira to whispers',
      'say nyx to whispers',
    ])
    expect(game.state.currentRoom.describe(game.state)).toContain(AFTER)
    expect(game.state.currentRoom.getExits(game.state)).toHaveProperty('up')
    expect(executeCommands(game, ['talk to whispers'])).toContain(
      'There is no character named',
    )
    executeCommands(game, ['go up'])
    expect(game.state.currentRoom.name).toBe('Chamber of Whispers')
  })

  it('know a name already said, and count nothing for it', () => {
    const game = inTower()
    executeCommands(game, ['say mira to whispers'])
    const again = executeCommands(game, ['say mira to whispers'])
    expect(again).toContain(
      'The token is still warm from her. Mira is holding the gate; you know that now. The whispers want someone else.',
    )
    expect(executeCommands(game, ['say cedric to whispers'])).toContain(SECOND)
    expect(executeCommands(game, ['say cedric to whispers'])).toContain(
      'The token is still warm from him. Sir Cedric is in the hall below; you know that now.',
    )
    expect(executeCommands(game, ['go up'])).toContain(STUMBLE)
  })

  it('say Nyx is keeping close when her name is repeated', () => {
    const game = inTower()
    executeCommands(game, ['say nyx to whispers'])
    expect(executeCommands(game, ['say nyx to whispers'])).toContain(
      'The token is still warm from her. Nyx is keeping close; you know that now.',
    )
  })

  it('answer Grandmother gently and any other word with a swallowed word', () => {
    const game = inTower()
    expect(executeCommands(game, ['say grandmother to whispers'])).toContain(
      GRANDMOTHER,
    )
    expect(executeCommands(game, ['say hello to whispers'])).toContain(
      SWALLOWED,
    )
    expect(executeCommands(game, ['go up'])).toContain(STUMBLE)
  })

  it('hear nothing from the friend when the token is not carried', () => {
    const game = inTower()
    game.state.removeItemFromInventory('Loyalty Token')
    const none = executeCommands(game, ['say mira to whispers'])
    expect(none).toContain(
      '[effect]You say her name into the dark.[/effect] Nothing answers but the whispers. Your hand closes on nothing, where the token used to be.',
    )
    expect(executeCommands(game, ['say cedric to whispers'])).toContain(
      'You say his name into the dark.',
    )
    expect(executeCommands(game, ['go up'])).toContain(STUMBLE)
    expectCharacterInRoom(game.state.currentRoom, 'Whispers')
  })

  it('keep their count through a save and load, also halfway', () => {
    const game = inTower()
    executeCommands(game, ['say mira to whispers'])
    expect(game.loadSaveData(game.toSaveData())).toContain('loaded')
    expect(executeCommands(game, ['say mira to whispers'])).toContain(
      'still warm',
    )
    executeCommands(game, ['say cedric to whispers'])
    expect(game.loadSaveData(game.toSaveData())).toContain('loaded')
    executeCommands(game, ['say nyx to whispers'])
    expect(game.loadSaveData(game.toSaveData())).toContain('loaded')
    expect(
      game.state.allRooms.TowerOfShadows.getCharacterByName('whispers'),
    ).toBeNull()
    executeCommands(game, ['go up'])
    expect(game.state.currentRoom.name).toBe('Chamber of Whispers')
  })

  it('does not take a dropped token back after a reload of a current save', () => {
    const game = inTower()
    executeCommands(game, ['say mira to whispers', 'drop loyalty token'])
    expect(game.loadSaveData(game.toSaveData())).toContain('loaded')
    expect(game.state.hasItem('Loyalty Token')).toBe(false)
  })

  it.each(['myself', 'me', 'Elior'])(
    'turn %s, the vow of the sea, into a taunt and count nothing',
    (words) => {
      const game = inTower()
      expect(executeCommands(game, [`say ${words} to whispers`])).toContain(
        MYSELF,
      )
      expect(executeCommands(game, ['go up'])).toContain(STUMBLE)
    },
  )

  it('hear a name said inside a sentence', () => {
    const game = inTower()
    const mira = executeCommands(game, ['say Mira stayed to whispers'])
    expect(mira).toContain(FIRST)
    expect(mira).toContain(MIRA_LINE)
  })

  it('answer the first friend not yet named when a sentence holds two', () => {
    const game = inTower()
    executeCommands(game, ['say mira to whispers'])
    const both = executeCommands(game, ['say mira and cedric to whispers'])
    expect(both).toContain(SECOND)
    expect(both).toContain(CEDRIC_LINE)
  })

  it('give the plain lead-in for Nyx when her token is not carried', () => {
    const game = inTower()
    game.state.removeItemFromInventory("Nyx's Token")
    const nyx = executeCommands(game, ['say nyx to whispers'])
    expect(nyx).toContain(FIRST)
    expect(nyx).not.toContain("Nyx's Token")
    expect(nyx).toContain(NYX_LINE)
  })

  it('writes well-formed markup in every state', () => {
    const game = inTower()
    game.state.removeItemFromInventory('Loyalty Token')
    const answers = [
      executeCommands(game, ['talk to whispers', 'say mira to whispers']),
    ]
    game.state.addItemToInventory(new LoyaltyToken())
    answers.push(
      executeCommands(game, [
        'say grandmother to whispers',
        'say hello to whispers',
        'say mira to whispers',
        'say mira to whispers',
        'say cedric to whispers',
        'say nyx to whispers',
      ]),
    )
    for (const answer of answers) expectMarkupWellFormed(answer)
  })
})
