import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { FLAG_ACT4_REDEMPTION_ENDING } from '../Act4StoryFlags'
import { AncientAmulet } from '../items/AncientAmulet'
import { NyxToken } from '../items/NyxToken'
import {
  executeCommands,
  expectDialogueSpeaker,
  expectNoStockReply,
} from '@/testing/gameHelpers'

/** A game with Elior home in Willowbrook Field after the Redemption ending. */
function inField(): Game {
  const act = new Act4()
  act.musicFile = ''
  const game = new Game([act])
  game.state.setStoryFlag(FLAG_ACT4_REDEMPTION_ENDING, true)
  game.state.currentRoom = game.state.allRooms.WillowbrookField
  return game
}

describe('Grandmother at the gate', () => {
  it.each([
    ['you knew', 'I did. Every day of it.'],
    ['i love you', 'Hush. I know you do.'],
    ['welcome home', 'That is my line, dear. Welcome home.'],
    ['i forgive you', 'I did not ask it of you.'],
    ['you should have told me', 'I promised her, and I should have told you'],
    ['the weather', 'The bread will keep.'],
  ])('answers "%s" in her own words', (words, line) => {
    const answer = executeCommands(inField(), [`say ${words} to grandmother`])
    expect(answer).toContain(line)
    expectDialogueSpeaker(answer, 'Grandmother')
    expectNoStockReply(answer)
  })

  it('takes neither the amulet nor the token, and says why', () => {
    const game = inField()
    game.state.inventory.push(new AncientAmulet(), new NyxToken())
    const amulet = executeCommands(game, ['give ancient amulet to grandmother'])
    expect(amulet).toContain('It does not come back to mine.')
    expectNoStockReply(amulet)
    const token = executeCommands(game, ["give nyx's token to grandmother"])
    expect(token).toContain('Someone in that hedge')
    expectNoStockReply(token)
    expect(game.state.inventory.some((i) => i instanceof NyxToken)).toBe(true)
  })
})
