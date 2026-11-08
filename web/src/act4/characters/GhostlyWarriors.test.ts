import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { GhostlyWarriors } from './GhostlyWarriors'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'
import { executeCommands, expectNoStockReply } from '@/testing/gameHelpers'

describe('GhostlyWarriors', () => {
  it('answers to ghostly warriors and warriors, and cannot hear Elior', () => {
    const game = new Game([new Act4()])
    const warriors = new GhostlyWarriors()
    expect(warriors.answersTo('ghostly warriors')).toBe(true)
    expect(warriors.answersTo('warriors')).toBe(true)
    expect(warriors.answersTo('knight')).toBe(false)
    expect(warriors.talkTo(game.state)).toBe(
      '[dim]The warriors do not hear you. They are still fighting.[/dim]',
    )
    expectMarkupWellFormed(warriors.examine(game.state))
  })
  it('lets words pass through them', () => {
    const game = new Game([new Act4()])
    const hall = game.state.allRooms.HallOfEchoes
    hall.characters.push(new GhostlyWarriors())
    game.state.currentRoom = hall
    const answer = executeCommands(game, ['say redemption to ghostly warriors'])
    expect(answer).toContain('The word goes through them')
    expectNoStockReply(answer)
  })
})
