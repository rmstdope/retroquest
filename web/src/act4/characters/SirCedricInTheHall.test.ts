import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { TruthSight } from '../spells/TruthSight'
import { GuardiansChain } from '../items/GuardiansChain'
import { EchoStone } from '../items/EchoStone'
import { FLAG_ACT4_CEDRIC_FORGAVE } from '../Act4StoryFlags'
import {
  executeCommands,
  expectCharacterInRoom,
  expectMarkupWellFormed,
  expectStoryFlag,
} from '@/testing/gameHelpers'

const BY_DOOR = 'Sir Cedric, by the south door, his eyes on the knight.'
const ON_STAIR =
  'Sir Cedric sits on the stair beside the knight. Neither of them is saying much.'
const DESC_DOOR =
  'Sir Cedric has followed you in; he stands by the south door, his eyes on the knight.'
const HALF =
  'That voice. I have heard it before, Elior, I would swear to it. I cannot see the face that goes with it.'
const KNOWS =
  'Grey cloak, twisted rune. I know him now. Do what you came to do. I will hear what he has to say.'
const KEEP_EYE = 'Go on up. I will keep an eye on him.'
const WAIT_HERE = 'Go on up. I will wait here with him. Someone should.'
const HOLD_BACK = 'Sir Cedric does not move from the door.'
const FORGIVE_EVENT =
  'Sir Cedric watches the last of them go. Then he crosses the hall and offers the knight his hand.'
const FORGIVE_LINE =
  'If they can be let go, so can this. I forgive you. Get up.'

/** A game in the Hall of Echoes with everything needed to redeem the knight. */
function hall(): Game {
  const act = new Act4()
  act.musicFile = ''
  const game = new Game([act])
  game.state.currentRoom = game.state.allRooms.HallOfEchoes
  game.state.learnSpell(new TruthSight())
  game.state.addItemToInventory(new GuardiansChain())
  game.state.addItemToInventory(new EchoStone())
  return game
}

function redeemed(): Game {
  const game = hall()
  executeCommands(game, [
    "use guardian's chain",
    'cast truth sight on knight of despair',
    'say redemption to knight',
  ])
  return game
}

function reload(game: Game): void {
  expect(game.loadSaveData(game.toSaveData())).toContain(
    'Game loaded successfully.',
  )
}

describe('Sir Cedric in the Hall of Echoes', () => {
  it('is in the hall by the south door from the first visit', () => {
    const game = hall()
    expectCharacterInRoom(game.state.currentRoom, 'Sir Cedric')
    const text = game.state.currentRoom.describe(game.state)
    expect(text).toContain(DESC_DOOR)
    expect(text).toContain('Sir Cedric')
    expect(executeCommands(game, ['examine cedric'])).toContain(BY_DOOR)
  })

  it('half-recognises the voice, then knows the knight after Truth Sight', () => {
    const game = hall()
    expect(executeCommands(game, ['talk to cedric'])).toContain(HALF)
    executeCommands(game, ['cast truth sight on knight of despair'])
    const talk = executeCommands(game, ['talk to cedric'])
    expect(talk).toContain(KNOWS)
    expect(talk).not.toContain(HALF)
    expectMarkupWellFormed(talk)
  })

  it('exchanges "You." and "Me." at the redemption, then holds back', () => {
    const game = hall()
    executeCommands(game, [
      "use guardian's chain",
      'cast truth sight on knight of despair',
    ])
    const out = executeCommands(game, ['say redemption to knight'])
    const order = [
      'very human.',
      'You.',
      'Me.',
      'I was the stranger in Willowbrook',
      'Sir Cedric. I am sorry. I have no right to ask anything of you, so I will not.',
      HOLD_BACK,
      'I heard you. That will have to be enough, for now.',
      "You received [item_name]Knight's Redemption[/item_name]!",
    ].map((part) => out.indexOf(part))
    expect(order.every((i) => i >= 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
    expect(out).not.toContain('When you see Sir Cedric again')
    expectMarkupWellFormed(out)
    expectStoryFlag(game.state, FLAG_ACT4_CEDRIC_FORGAVE, false)
  })

  it('keeps an eye on the knight, by the door, until the warriors rest', () => {
    const game = redeemed()
    expect(executeCommands(game, ['talk to cedric'])).toContain(KEEP_EYE)
    expect(executeCommands(game, ['examine cedric'])).toContain(BY_DOOR)
    expect(game.state.currentRoom.describe(game.state)).toContain(DESC_DOOR)
  })

  it('forgives when the warriors are put to rest, in the right place', () => {
    const game = redeemed()
    const out = executeCommands(game, [
      "cast redemption's light on ghostly warriors",
    ])
    const order = [
      'Then they fade, at peace.',
      FORGIVE_EVENT,
      FORGIVE_LINE,
      'Elior will remember this.',
    ].map((part) => out.indexOf(part))
    expect(order.every((i) => i >= 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
    expectMarkupWellFormed(out)
    expectStoryFlag(game.state, FLAG_ACT4_CEDRIC_FORGAVE)
    expect(executeCommands(game, ['talk to cedric'])).toContain(WAIT_HERE)
    expect(executeCommands(game, ['examine cedric'])).toContain(ON_STAIR)
    const text = game.state.currentRoom.describe(game.state)
    expect(text).toContain(ON_STAIR)
    expect(text).not.toContain(DESC_DOOR)
  })

  it('remembers what he has seen and chosen across a save', () => {
    const game = hall()
    executeCommands(game, ['cast truth sight on knight of despair'])
    reload(game)
    expect(executeCommands(game, ['talk to cedric'])).toContain(KNOWS)
    executeCommands(game, ["use guardian's chain", 'say redemption to knight'])
    reload(game)
    expect(executeCommands(game, ['talk to cedric'])).toContain(KEEP_EYE)
    executeCommands(game, ["cast redemption's light on ghostly warriors"])
    reload(game)
    expect(executeCommands(game, ['talk to cedric'])).toContain(WAIT_HERE)
    expect(game.state.currentRoom.describe(game.state)).toContain(ON_STAIR)
  })
})
