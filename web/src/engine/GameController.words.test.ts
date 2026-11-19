import { describe, expect, it } from 'vitest'
import { Act } from './Act'
import { Character } from './Character'
import { Game } from './Game'
import { GameController } from './GameController'
import { GameState } from './GameState'
import { Room } from './Room'

/** A person who answers any word with a plain line, and tells of the cat's stay when talked to. */
class Hearer extends Character {
  constructor(name = 'Tilda') {
    super({ name, description: 'A listener.' })
  }

  override talkTo(_gameState: GameState): string {
    return (
      'Tilda smiles at the cat. ' +
      "[dialogue]The cat may stay, and she'll never revive the old quarrel.[/dialogue]"
    )
  }

  override sayTo(_gameState: GameState, words: string): string {
    return `Tilda hears ${words}.`
  }
}

/** The first room: its narration says stay and Revive, but narration is not a line said to him. */
function firstRoom(): Room {
  return new Room({
    name: 'Hearth',
    description: 'The cat will stay, they say. Revive the fire.',
    characters: [new Hearer(), new Hearer('Mira')],
    exits: { north: 'Yard' },
  })
}

/** The flag that completes the first act. */
const ACT_DONE = 'done'

/** An act with a word list, complete once its flag is set. */
class WordsAct extends Act {
  override isCompleted(gameState: GameState): boolean {
    return gameState.getStoryFlag(ACT_DONE)
  }
}

function actWith(
  name: string,
  words: string[],
  rooms: Record<string, Room>,
  classes: Act['classes'] = {},
): Act {
  return new WordsAct({
    name,
    rooms,
    quests: [],
    musicFile: '',
    musicInfo: '',
    words,
    classes,
  })
}

/** A new game of the two acts. */
function secondGame(): Game {
  return new Game([
    actWith(
      'First',
      ['Stay', 'Mira', 'Revive'],
      {
        Hearth: firstRoom(),
        Yard: new Room({ name: 'Yard', description: 'A yard.' }),
      },
      { Hearer },
    ),
    actWith('Second', ['Truth'], {
      Start: new Room({ name: 'Start', description: 'Begin.' }),
    }),
  ])
}

function started(): GameController {
  const ctrl = new GameController(secondGame())
  ctrl.advanceToRunning()
  return ctrl
}

describe('GameController.getSayWords', () => {
  it('offers only Yes and No before a word is met', () => {
    expect(started().getSayWords()).toEqual([
      { word: 'Yes', isNew: false },
      { word: 'No', isNew: false },
    ])
  })

  it('does not take words from the description or the name of the room', () => {
    const ctrl = started()
    ctrl.openRoom()
    ctrl.takeTurn('look')
    expect(ctrl.getSayWords().map((w) => w.word)).not.toContain('Stay')
  })

  it('meets the name of a person standing in the room it shows', () => {
    const ctrl = started()
    ctrl.openRoom()
    expect(ctrl.getSayWords().map((w) => w.word)).toEqual(['Yes', 'No', 'Mira'])
  })

  it('meets the words of a line said to him, new until said, typed or pressed', () => {
    const ctrl = started()
    ctrl.takeTurn('talk to tilda')
    const stay = (): boolean | undefined =>
      ctrl.getSayWords().find((w) => w.word === 'Stay')?.isNew
    expect(stay()).toBe(true)
    ctrl.takeTurn('say stay to tilda')
    expect(stay()).toBe(false)
  })

  it('keeps the words and dots through a save and a load', () => {
    const ctrl = started()
    ctrl.openRoom()
    ctrl.takeTurn('talk to tilda')
    ctrl.takeTurn('say stay to tilda')
    const saved = ctrl.game.toSaveData()
    const again = new GameController(secondGame())
    again.game.loadSaveData(saved)
    expect(again.getSayWords()).toEqual(ctrl.getSayWords())
    expect(again.getSayWords().find((w) => w.word === 'Revive')?.isNew).toBe(
      true,
    )
  })

  it('starts the next act with only Yes and No', () => {
    const ctrl = started()
    ctrl.takeTurn('talk to tilda')
    expect(ctrl.getSayWords().length).toBeGreaterThan(2)
    ctrl.game.state.setStoryFlag(ACT_DONE, true)
    ctrl.game.newTurn() // the act is complete: its closing pages
    ctrl.game.newTurn() // the next act begins
    expect(ctrl.getSayWords().map((w) => w.word)).toEqual(['Yes', 'No'])
  })
})
