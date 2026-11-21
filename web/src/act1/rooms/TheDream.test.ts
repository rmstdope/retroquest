import { describe, it, expect } from 'vitest'
import { findMarkupProblems, Game, GameController } from '@/engine'
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
    expect(game.state.currentRoom.items.map((i) => i.name)).toEqual([
      'shadows',
      'man',
      'child',
    ])
    expect(game.state.currentRoom.items.every((i) => !i.canBeCarried)).toBe(
      true,
    )
    expect(game.state.inventory).toEqual([])
    const look = executeCommands(game, ['look'])
    expect(look).not.toContain('Exits:')
    const description = game.state.currentRoom.descriptionFor(game.state)
    expect(description).toContain('three notes')
    expect(description).toContain(
      'It is raining hard on a village street. Thunder breaks so close ' +
        'that the shutters shake with it.',
    )
    expect(description).toContain(
      'In the street a man in a hooded cloak holds a child against his ' +
        'shoulder. His hood hides his face.',
    )
    expect(description).toContain('Behind him a tall figure stands')
    expect(description).not.toMatch(/dark\b|\bgone\b|his hand|curtain/i)
    expect(description).toContain('what it whispers is your name')
    expect(description).not.toContain('Dark, and a storm in it.')
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
      expect(answer).not.toMatch(/dark\b|\bdoor\b/)
    }
    expect(executeCommands(game, ['listen'])).toContain(
      "I don't understand the command: 'listen'",
    )
    expectStoryFlag(game.state, FLAG_WOKE_FROM_DREAM, false)
  })

  it('says the agreed words when he walks away and when he searches', () => {
    const game = newGame()
    expect(executeCommands(game, ['north'])).toContain(
      'You go that way, and it is the same street, the same rain, the same ' +
        'tune. There is no way out of this. There is only the voice, and it ' +
        'says your name.',
    )
    expect(executeCommands(game, ['search'])).toContain(
      'Your hands find nothing. The street has no end and the dream no ' +
        'edges. The whisper comes again, nearer, and it is your name.',
    )
  })

  it('hints at the voice before Elior has answered it, never naming a command', () => {
    const game = newGame()
    const hint = executeCommands(game, ['hint'])
    expect(hint).not.toContain('Nothing presses on you')
    expect(hint).toContain('voice')
    expect(hint).toContain('answer')
    expect(hint).not.toMatch(/\btalk\b|\bsay\b|\btype\b/i)
    expect(findMarkupProblems(hint)).toEqual([])
    expectCurrentRoom(game.state, 'The Dream')
  })

  it.each(['talk to voice', 'talk to the figure', 'talk to shadow'])(
    '"%s" makes the voice say the three words and wakes him in the cottage',
    (command) => {
      const game = newGame()
      const answer = executeCommands(game, [command])
      expect(answer).toContain('…let them rest…')
      expect(answer).not.toContain('and let them rest')
      expect(answer).toContain(
        'The dream lets go of you, and you wake in your own bed. The storm ' +
          'is gone and it is bright morning. Your heart is going hard.',
      )
      expect(answer).not.toContain('curtains')
      expect(answer).toContain('someone is humming it, out by the hearth')
      expect(answer).toContain("[room_name]Elior's Cottage[/room_name]")
      expectCurrentRoom(game.state, "Elior's Cottage")
      expectStoryFlag(game.state, FLAG_WOKE_FROM_DREAM, true)
      expect(game.state.visitedRooms).toEqual(["Elior's Cottage"])
      expect(findMarkupProblems(answer)).toEqual([])
    },
  )

  it('lets the voice say the three words and his name in its own voice', () => {
    const answer = executeCommands(newGame(), ['talk to voice'])
    expect(answer).toContain(
      '[character_name]voice[/character_name]\n' +
        '[dialogue]…let them rest… ' +
        '[character_name]Elior[/character_name].[/dialogue]',
    )
    expect(answer).not.toContain('Then your name')
  })

  it('wakes him when he says anything to the voice, and the voice stays behind', () => {
    const game = newGame()
    const answer = executeCommands(game, ['say help to voice'])
    expect(answer).toContain('…let them rest…')
    expectCurrentRoom(game.state, "Elior's Cottage")
    expect(game.commandParser.parse('talk to voice')).toContain(
      'There is no character named',
    )
    expect(game.state.allRooms.TheDream.characters[0]).toBeInstanceOf(
      DreamVoice,
    )
  })

  it('does not repeat the said word: Elior has already said it on the picture', () => {
    const answer = executeCommands(newGame(), ['say hello to voice'])
    expect(answer).not.toMatch(/hello/i)
    expect(answer).not.toContain('You say')
    expect(answer.startsWith('The whisper comes once more')).toBe(true)
  })

  it('leaves the dream off the map and the cottage ready to play', () => {
    const game = newGame()
    executeCommands(game, ['talk to voice'])
    expect(game.map()).not.toContain('The Dream')
    const lit = executeCommands(game, ['use lantern'])
    expect(lit).toContain('journal')
  })

  it('wakes to a bright morning', () => {
    const game = newGame()
    const answer = executeCommands(game, ['talk to voice'])
    expect(answer).toContain('The storm is gone and it is bright morning.')
    expect(answer).not.toContain('grey')
  })

  it('shows the new words in a save made inside the dream with the old ones', () => {
    const game = newGame()
    const old = game
      .toSaveData()
      .replace(
        'It is raining hard on a village street.',
        'It is dark, and it is raining hard.',
      )
    const fresh = new Game([new Act1()])
    fresh.loadSaveData(old)
    expect(new GameController(fresh).getRoomDescription()).toContain(
      'It is raining hard on a village street.',
    )
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
