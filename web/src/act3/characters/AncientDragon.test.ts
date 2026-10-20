import { describe, it, expect } from 'vitest'
import { Game, type GameState } from '@/engine'
import { Act3 } from '../Act3'
import {
  FLAG_ACT3_DRAGONS_MEMORY_RECEIVED,
  FLAG_ACT3_DRAGON_OATH_SPOKEN,
  FLAG_ACT3_OATH_SCROLLS_EXAMINED,
} from '../Act3StoryFlags'
import { AncientDragon } from './AncientDragon'
import { DragonsScale } from '../items/DragonsScale'
import { DragonsHall } from '../rooms/DragonsHall'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

const DIALOGUE_PATTERN = /\[dialogue\].*?\[\/dialogue\]/gs
const CHARACTER_NAME_PATTERN = /\[character_name\](.*?)\[\/character_name\]/s

/** No dialogue block in text lacks a preceding speaker name. */
function expectNoSpeakerlessDialogue(text: string): void {
  let narration = ''
  let position = 0
  for (const block of text.matchAll(DIALOGUE_PATTERN)) {
    narration += text.slice(position, block.index)
    position = block.index + block[0].length
    expect(
      CHARACTER_NAME_PATTERN.test(narration),
      `no speaker before dialogue in: ${text}`,
    ).toBe(true)
  }
}

/** A minimal game state for character tests. */
function makeGameState(): GameState {
  return new Game([new Act3()]).state
}

/** Whether a Dragon's Scale lies in the room. */
function hasScale(room: { items: unknown[] }): boolean {
  return room.items.some((item) => item instanceof DragonsScale)
}

describe('AncientDragon', () => {
  it('initializes with name and description', () => {
    const dragon = new AncientDragon()
    expect(dragon.name).toBe('ancient dragon')
    expect(dragon.description.toLowerCase()).toContain('magnificent dragon')
    expect(dragon.description.toLowerCase()).toContain('golden eyes')
  })

  it('gives the memory when talked to the first time', () => {
    const dragon = new AncientDragon()
    const gameState = makeGameState()

    const result = dragon.talkTo(gameState)

    expect(result).toContain('Lyra and Theron')
    expect(result).toContain('ward—not of stone or steel, but of love')
    expect(gameState.getStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED)).toBe(true)
  })

  it('gives a shorter response when talked to a second time', () => {
    const dragon = new AncientDragon()
    const gameState = makeGameState()
    gameState.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)

    const result = dragon.talkTo(gameState)

    expect(result.toLowerCase()).toContain('memory has been shared')
    expect(result.toLowerCase()).toContain('scale awaits')
  })

  it('adds the scale to the room when the oath is spoken', () => {
    const dragon = new AncientDragon()
    const gameState = makeGameState()
    const room = new DragonsHall()
    gameState.currentRoom = room

    // First need to talk to get memory
    dragon.talkTo(gameState)
    // Need to examine oath scrolls first
    gameState.setStoryFlag(FLAG_ACT3_OATH_SCROLLS_EXAMINED, true)
    // Initially no dragon's scale in room
    expect(hasScale(room)).toBe(false)

    const result = dragon.sayTo(gameState, 'oath')

    expect(result.toLowerCase()).toContain('oath')
    expect(result.toLowerCase()).toContain('scale is yours to bear')
    expect(gameState.getStoryFlag(FLAG_ACT3_DRAGON_OATH_SPOKEN)).toBe(true)
    expect(hasScale(room)).toBe(true)
  })

  it('answers that the oath was already given when spoken twice', () => {
    const dragon = new AncientDragon()
    const gameState = makeGameState()
    gameState.currentRoom = new DragonsHall()
    gameState.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)
    gameState.setStoryFlag(FLAG_ACT3_OATH_SCROLLS_EXAMINED, true)
    gameState.setStoryFlag(FLAG_ACT3_DRAGON_OATH_SPOKEN, true)

    const result = dragon.sayTo(gameState, 'oath')

    expect(result.toLowerCase()).toContain('oath has been given and accepted')
    expect(result.toLowerCase()).toContain('scale is yours to claim')
  })

  it('ignores wrong words', () => {
    const dragon = new AncientDragon()
    const gameState = makeGameState()
    gameState.currentRoom = new DragonsHall()
    gameState.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)

    const result = dragon.sayTo(gameState, 'hello')

    expect(result.toLowerCase()).toContain('does not respond to those words')
    expect(result.toLowerCase()).toContain('meaningful pledge')
  })

  it('refuses the oath before the scrolls are examined', () => {
    const dragon = new AncientDragon()
    const gameState = makeGameState()
    const room = new DragonsHall()
    gameState.currentRoom = room
    gameState.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)
    expect(gameState.getStoryFlag(FLAG_ACT3_OATH_SCROLLS_EXAMINED)).toBe(false)

    const result = dragon.sayTo(gameState, 'oath')

    expect(result.toLowerCase()).toContain(
      'must first understand the weight of the oath',
    )
    expect(result.toLowerCase()).toContain('proves your selflessness')
    expect(gameState.getStoryFlag(FLAG_ACT3_DRAGON_OATH_SPOKEN)).toBe(false)
    expect(hasScale(room)).toBe(false)
  })

  it('accepts the oath after the scrolls are examined', () => {
    const dragon = new AncientDragon()
    const gameState = makeGameState()
    const room = new DragonsHall()
    gameState.currentRoom = room
    gameState.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)
    gameState.setStoryFlag(FLAG_ACT3_OATH_SCROLLS_EXAMINED, true)

    const result = dragon.sayTo(gameState, 'oath')

    expect(result.toLowerCase()).toContain('speak your oath')
    expect(result.toLowerCase()).toContain('scale is yours to bear')
    expect(gameState.getStoryFlag(FLAG_ACT3_DRAGON_OATH_SPOKEN)).toBe(true)
    expect(hasScale(room)).toBe(true)
  })

  it.each(['oath', 'OATH', 'Oath', 'OaTh'])(
    'accepts the oath word %s case-insensitively',
    (oathWord) => {
      const dragon = new AncientDragon()
      const gameState = makeGameState()
      const room = new DragonsHall()
      gameState.currentRoom = room
      gameState.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)
      gameState.setStoryFlag(FLAG_ACT3_OATH_SCROLLS_EXAMINED, true)
      gameState.setStoryFlag(FLAG_ACT3_DRAGON_OATH_SPOKEN, false)
      room.items.length = 0

      const result = dragon.sayTo(gameState, oathWord)

      expect(result.toLowerCase()).toContain('speak your oath')
      expect(gameState.getStoryFlag(FLAG_ACT3_DRAGON_OATH_SPOKEN)).toBe(true)
    },
  )

  it('attributes the dialogue in every branch', () => {
    const dragon = new AncientDragon()
    const gameState = makeGameState()
    gameState.currentRoom = new DragonsHall()
    const answers = [dragon.talkTo(gameState), dragon.talkTo(gameState)]
    answers.push(dragon.sayTo(gameState, 'oath'))
    gameState.setStoryFlag(FLAG_ACT3_OATH_SCROLLS_EXAMINED, true)
    answers.push(dragon.sayTo(gameState, 'oath'))
    answers.push(dragon.sayTo(gameState, 'oath'))

    for (const answer of answers) {
      expectMarkupWellFormed(answer)
      expectDialogueSpeaker(answer, dragon.name)
    }
  })

  it('narrates ignored words without speakerless dialogue', () => {
    const gameState = makeGameState()
    gameState.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)

    const answer = new AncientDragon().sayTo(gameState, 'hello')

    expectMarkupWellFormed(answer)
    expectNoSpeakerlessDialogue(answer)
  })
})
