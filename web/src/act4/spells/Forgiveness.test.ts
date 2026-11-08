import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { FLAG_ACT4_REDEMPTION_ENDING } from '../Act4StoryFlags'
import { Forgiveness } from './Forgiveness'
import {
  executeCommands,
  expectDialogueSpeaker,
  expectNoStockReply,
} from '@/testing/gameHelpers'

/** A game with Elior in a room, knowing the spell, with or without the ending. */
function inRoom(room: string, ended: boolean): Game {
  const act = new Act4()
  act.musicFile = ''
  const game = new Game([act])
  game.state.setStoryFlag(FLAG_ACT4_REDEMPTION_ENDING, ended)
  game.state.currentRoom = game.state.allRooms[room]
  game.state.learnSpell(new Forgiveness())
  return game
}

describe('Forgiveness on the people Elior loves', () => {
  it.each([
    ['WillowbrookField', true, 'mira', 'Mira', 'Me you can just tell.'],
    ['FortressGates', false, 'mira', 'Mira', 'Me you can just tell.'],
    [
      'WillowbrookField',
      true,
      'grandmother',
      'Grandmother',
      'I made my own bed.',
    ],
    ['WillowbrookField', true, 'sir cedric', 'Sir Cedric', 'on my own feet'],
    ['HallOfEchoes', false, 'sir cedric', 'Sir Cedric', 'on my own feet'],
    [
      'ThroneChamber',
      true,
      'king alden',
      'King Alden',
      'forgiven by his kingdom',
    ],
  ])('in %s (ended: %s), %s answers', (room, ended, target, speaker, line) => {
    const answer = executeCommands(inRoom(room, ended), [
      `cast forgiveness on ${target}`,
    ])
    expect(answer).toContain(line)
    expectDialogueSpeaker(answer, speaker)
    expectNoStockReply(answer)
  })

  it('slides off the crystal while the king sleeps in it', () => {
    const answer = executeCommands(inRoom('ThroneChamber', false), [
      'cast forgiveness on king alden',
    ])
    expect(answer).toContain('The king does not stir.')
    expectNoStockReply(answer)
  })
})
