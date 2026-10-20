import { describe, it, expect } from 'vitest'
import { Game, GameController } from '@/engine'
import { Act1 } from '../Act1'
import {
  FLAG_CONNECT_WITH_NATURE,
  FLAG_PRIEST_TALKED_TO,
} from '../Act1StoryFlags'
import { Coin } from '../items/Coin'
import { Matches } from '../items/Matches'
import { Shopkeeper } from './Shopkeeper'
import { expectDialogueSpeaker } from '@/testing/gameHelpers'

const DIALOGUE_PATTERN = /\[dialogue\](.*?)\[\/dialogue\]/gs
const QUOTE_MARKS = '"\''

/** An Act I game with Elior standing in the General Store. */
function gameInStore({ shopOpen = true, priestTalkedTo = false } = {}): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.GeneralStore
  game.state.setStoryFlag(FLAG_CONNECT_WITH_NATURE, shopOpen)
  game.state.setStoryFlag(FLAG_PRIEST_TALKED_TO, priestTalkedTo)
  return game
}

/**
 * An Act I game loaded from a save made before the matches left the
 * shopkeeper's wares: `matches` is still for sale until the hand-over, and
 * `priestMatchesGiven` does not exist yet.
 */
function legacySave({ handedOver }: { handedOver: boolean }): Game {
  const game = gameInStore({ priestTalkedTo: true })
  const shopkeeper = game.state.currentRoom.getCharacterByName('shopkeeper')
  if (!(shopkeeper instanceof Shopkeeper)) throw new Error('no shopkeeper')
  if (!handedOver) shopkeeper.wares.matches = { item: new Matches(), price: 4 }
  Reflect.deleteProperty(shopkeeper, 'priestMatchesGiven')
  const loaded = new Game([new Act1()])
  expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')
  return loaded
}

/** No quote mark sits outside dialogue and each quoted block is closed. */
function expectQuotesInsideDialogue(text: string): void {
  const narration = text.replace(DIALOGUE_PATTERN, '')
  expect(narration, `double quote outside dialogue in: ${text}`).not.toContain(
    '"',
  )
  for (const [, block] of text.matchAll(DIALOGUE_PATTERN)) {
    if (QUOTE_MARKS.includes(block[0])) {
      expect(block.at(-1), `unclosed quotation in dialogue: ${block}`).toBe(
        block[0],
      )
    }
  }
}

describe('Shopkeeper dialogue markup', () => {
  it.each([1, 2, 3])('keeps quotes inside dialogue after %i talks', (talks) => {
    const game = gameInStore()
    let answer = ''
    for (let i = 0; i < talks; i++)
      answer = game.commandParser.parse('talk to shopkeeper')
    expect(answer).toContain('for sale')
    expectQuotesInsideDialogue(answer)
    expectDialogueSpeaker(answer, 'shopkeeper')
  })

  it('keeps the closed-shop reply inside dialogue', () => {
    const answer = gameInStore({ shopOpen: false }).commandParser.parse(
      'talk to shopkeeper',
    )
    expect(answer).toContain('not open for business')
    expectQuotesInsideDialogue(answer)
    expectDialogueSpeaker(answer, 'shopkeeper')
  })

  it('keeps the matches hand-over inside dialogue', () => {
    const answer = gameInStore({ priestTalkedTo: true }).commandParser.parse(
      'talk to shopkeeper',
    )
    expect(answer).toContain('on the house')
    expectQuotesInsideDialogue(answer)
    expectDialogueSpeaker(answer, 'shopkeeper')
  })

  it('keeps the unknown-ware reply inside dialogue', () => {
    const answer = gameInStore().commandParser.parse(
      'buy lantern from shopkeeper',
    )
    expect(answer).toContain('for sale')
    expectQuotesInsideDialogue(answer)
    expectDialogueSpeaker(answer, 'shopkeeper')
  })

  it('reports a purchase without stray quotes', () => {
    const game = gameInStore()
    game.state.addItemToInventory(new Coin())
    const answer = game.commandParser.parse('buy rope from shopkeeper')
    expect(answer).toContain('You bought a')
    expectQuotesInsideDialogue(answer)
  })

  it('keeps the refusal of a gift inside dialogue', () => {
    const game = gameInStore()
    game.state.addItemToInventory(new Coin())
    const answer = game.commandParser.parse('give coin to shopkeeper')
    expect(answer).toContain('donations')
    expectQuotesInsideDialogue(answer)
    expectDialogueSpeaker(answer, 'shopkeeper')
  })
})

describe('Shopkeeper and the priest matches', () => {
  it('does not list the matches for sale', () => {
    const game = gameInStore()
    const answer = game.commandParser.parse('talk to shopkeeper')

    expect(answer).toContain('Rope')
    expect(answer).not.toContain('Matches')
    const wares = new GameController(game).getRoomWares().map((w) => w.name)
    expect(wares).toContain('rope')
    expect(wares).not.toContain('matches')
  })

  it('hands the matches over for the priest only once', () => {
    const game = gameInStore({ priestTalkedTo: true })
    game.commandParser.parse('talk to shopkeeper')

    const answer = game.commandParser.parse('talk to shopkeeper')

    expect(answer).not.toContain('on the house')
    expect(
      game.state.inventory.filter((item) => item instanceof Matches),
    ).toHaveLength(1)
  })

  it.each([
    { handedOver: true, onTheHouse: false },
    { handedOver: false, onTheHouse: true },
  ])(
    'drops the matches from the wares of a save from before they left them ' +
      '(handed over: $handedOver)',
    ({ handedOver, onTheHouse }) => {
      const game = legacySave({ handedOver })

      const wares = new GameController(game).getRoomWares().map((w) => w.name)
      expect(wares).toContain('rope')
      expect(wares).not.toContain('matches')
      const answer = game.commandParser.parse('talk to shopkeeper')
      expect(answer.includes('on the house')).toBe(onTheHouse)
      expect(game.commandParser.parse('talk to shopkeeper')).not.toContain(
        'on the house',
      )
    },
  )

  it('keeps the matches for the priest instead of selling them', () => {
    const game = gameInStore()
    for (let i = 0; i < 4; i++) game.state.addItemToInventory(new Coin())

    const answer = game.commandParser.parse('buy matches from shopkeeper')

    expect(answer).toContain('priest')
    expect(answer).not.toContain('You bought')
    expectDialogueSpeaker(answer, 'shopkeeper')
  })
})
