import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../Act1'
import {
  FLAG_CONNECT_WITH_NATURE,
  FLAG_PRIEST_TALKED_TO,
} from '../Act1StoryFlags'
import { Coin } from '../items/Coin'
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
