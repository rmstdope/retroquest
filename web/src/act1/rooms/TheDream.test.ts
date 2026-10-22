import { describe, it, expect } from 'vitest'
import { findMarkupProblems, Game } from '@/engine'
import { Act1 } from '../Act1'
import { TheDream } from './TheDream'
import { DreamVoice } from '../characters/DreamVoice'
import { FLAG_WOKE_FROM_DREAM } from '../Act1StoryFlags'
import {
  executeCommands,
  expectCharacterInRoom,
  expectCurrentRoom,
  expectStoryFlag,
} from '@/testing/gameHelpers'

/** A new Act I game, which opens in the dream. */
function newGame(): Game {
  return new Game([new Act1()])
}

describe('The Dream, where Act I opens', () => {
  it('is the first room, with the voice and nothing to carry', () => {
    const game = newGame()
    expectCurrentRoom(game.state, 'The Dream')
    expectCharacterInRoom(game.state.currentRoom, 'voice')
    expect(game.state.currentRoom).toBeInstanceOf(TheDream)
    expect(game.state.currentRoom.items).toEqual([])
    expect(game.state.inventory).toEqual([])
    const look = executeCommands(game, ['look'])
    expect(look).not.toContain('Exits:')
    const description = game.state.currentRoom.descriptionFor(game.state)
    expect(description).toContain('three notes')
    expect(description).toContain('a man’s hand, lifts a child')
    expect(description).toContain('it is your name')
  })

  it('keeps Elior in the dream when he walks, rests, searches or calls another name', () => {
    const game = newGame()
    for (const command of [
      'north',
      'go south',
      'rest',
      'search',
      'talk to grandmother',
    ]) {
      const answer = executeCommands(game, [command])
      expectCurrentRoom(game.state, 'The Dream')
      expect(answer).not.toContain("can't go that way")
      expect(answer).not.toContain('There is no character named')
      expect(answer).toContain('your name')
    }
    expect(executeCommands(game, ['listen'])).toContain('three notes climbing')
    expectStoryFlag(game.state, FLAG_WOKE_FROM_DREAM, false)
  })

  it.each(['talk to voice', 'talk to the figure', 'talk to shadow'])(
    '"%s" makes the voice say the three words and wakes him in the cottage',
    (command) => {
      const game = newGame()
      const answer = executeCommands(game, [command])
      expect(answer).toContain('…and let them rest…')
      expect(answer).toContain('someone is humming it, out by the hearth')
      expect(answer).toContain("[room_name]Elior's Cottage[/room_name]")
      expectCurrentRoom(game.state, "Elior's Cottage")
      expectStoryFlag(game.state, FLAG_WOKE_FROM_DREAM, true)
      expect(game.state.visitedRooms).toEqual(["Elior's Cottage"])
      expect(findMarkupProblems(answer)).toEqual([])
    },
  )

  it('wakes him when he says anything to the voice, and the voice stays behind', () => {
    const game = newGame()
    const answer = executeCommands(game, ['say help to voice'])
    expect(answer).toContain('You say it into the dark: help.')
    expectCurrentRoom(game.state, "Elior's Cottage")
    expect(game.commandParser.parse('talk to voice')).toContain(
      'There is no character named',
    )
    expect(game.state.allRooms.TheDream.characters[0]).toBeInstanceOf(
      DreamVoice,
    )
  })

  it('leaves the dream off the map and the cottage ready to play', () => {
    const game = newGame()
    executeCommands(game, ['talk to voice'])
    expect(game.map()).not.toContain('The Dream')
    const lit = executeCommands(game, ['use lantern'])
    expect(lit).toContain('bread')
  })

  it('survives a save and load made inside the dream', () => {
    const game = newGame()
    executeCommands(game, ['look'])
    const fresh = new Game([new Act1()])
    fresh.loadSaveData(game.toSaveData())
    expectCurrentRoom(fresh.state, 'The Dream')
    expectCharacterInRoom(fresh.state.currentRoom, 'voice')
    executeCommands(fresh, ['talk to voice'])
    expectCurrentRoom(fresh.state, "Elior's Cottage")
    expectStoryFlag(fresh.state, FLAG_WOKE_FROM_DREAM, true)
  })
})
