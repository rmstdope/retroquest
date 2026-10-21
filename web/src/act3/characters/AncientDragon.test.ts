import { describe, it, expect } from 'vitest'
import { Game, type GameState } from '@/engine'
import { parseTurn } from '@/lantern/parseTurn'
import { Act3 } from '../Act3'
import {
  FLAG_ACT3_DRAGONS_MEMORY_RECEIVED,
  FLAG_ACT3_DRAGON_VOICE_HEARD,
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
import { AncientAmulet } from '../items/AncientAmulet'

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

    expect(result).toContain('Aren and Lysa, Wardens of the Dawn')
    expect(result).toContain('their friend Malakar')
    expect(result).toContain('anchored in the amulet you carry')
    expect(result).toContain('That is why Malakar drains him.')
    expect(result).toContain('warded away, not dead')
    expect(result).toContain('The memory has been shared')
    expect(gameState.getStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED)).toBe(true)
  })

  it('gives a shorter response when talked to a second time', () => {
    const dragon = new AncientDragon()
    const gameState = makeGameState()
    gameState.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)

    const result = dragon.talkTo(gameState)

    expect(result).not.toContain('Wardens of the Dawn')
    expect(result.toLowerCase()).toContain('memory has been shared')
    expect(result.toLowerCase()).toContain('scale awaits')
  })

  /** A Dragon's Hall game with the memory heard and the scrolls optionally read. */
  function hallState(scrollsRead: boolean): {
    gameState: GameState
    room: DragonsHall
  } {
    const gameState = makeGameState()
    const room = new DragonsHall()
    gameState.currentRoom = room
    gameState.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)
    gameState.setStoryFlag(FLAG_ACT3_DRAGON_VOICE_HEARD, true)
    gameState.setStoryFlag(FLAG_ACT3_OATH_SCROLLS_EXAMINED, scrollsRead)
    return { gameState, room }
  }

  const BEFORE_MEMORY =
    'Words come after memory, young one. Sit, and hear me first.'
  const BEFORE_SCROLLS =
    'An oath is not something you make up, child. The old words are kept ' +
    'in the Echo Chambers. Read them, then come back.'
  const QUESTION =
    'You have read the old words. Then tell me: what will you give back, ' +
    'for what you take?'

  it('refuses any say before the memory, in the dragon voice', () => {
    const dragon = new AncientDragon()
    const gameState = makeGameState()
    gameState.setStoryFlag(FLAG_ACT3_OATH_SCROLLS_EXAMINED, true)

    const result = dragon.sayTo(gameState, 'everything')

    expect(result).toContain(BEFORE_MEMORY)
    expect(result).toContain('The ')
    expect(result).toContain('rumbles:')
    expect(gameState.getStoryFlag(FLAG_ACT3_DRAGON_OATH_SPOKEN)).toBe(false)
  })

  it.each(['everything', 'hello', 'oath'])(
    'refuses %s before the scrolls are read and names the Echo Chambers',
    (words) => {
      const { gameState, room } = hallState(false)

      const result = new AncientDragon().sayTo(gameState, words)

      expect(result).toContain('golden eyes narrow.')
      expect(result).toContain(BEFORE_SCROLLS)
      expect(gameState.getStoryFlag(FLAG_ACT3_DRAGON_OATH_SPOKEN)).toBe(false)
      expect(hasScale(room)).toBe(false)
    },
  )

  it.each([
    ['everything', 'everything'],
    ['it', 'it'],
    ['myself', 'myself'],
    ['what I take', 'what I take'],
    ['  Everything!  ', 'everything'],
    ['EVERYTHING.', 'everything'],
    ['i return everything', 'everything'],
    ['I return it.', 'it'],
    ['I return what i take', 'what I take'],
    ['i take what is given and i return myself', 'myself'],
    ['I take what is given, and I return everything.', 'everything'],
    ['i  take what is  given,  and i return it!', 'it'],
  ])('accepts %j and echoes the oath with %s', (words, word) => {
    const { gameState, room } = hallState(true)

    const result = new AncientDragon().sayTo(gameState, words)

    expect(result).toContain(
      `You speak the old words to the [character_name]ancient dragon[/character_name]: ` +
        `“I take what is given, and I return ${word}.”`,
    )
    expect(result).toContain('Your words ring true, young one.')
    expect(result).toContain('[success]')
    expect(gameState.getStoryFlag(FLAG_ACT3_DRAGON_OATH_SPOKEN)).toBe(true)
    expect(hasScale(room)).toBe(true)
    expectMarkupWellFormed(result)
  })

  it.each([
    'i will give it back',
    'take it',
    'i return nothing at all',
    'everything and more',
    'hello',
    'oath',
  ])('asks the question again for %j', (words) => {
    const { gameState, room } = hallState(true)

    const result = new AncientDragon().sayTo(gameState, words)

    expect(result).toContain('That is no answer, young one.')
    expect(result).toContain('What will you give back, for what you take?')
    expect(gameState.getStoryFlag(FLAG_ACT3_DRAGON_OATH_SPOKEN)).toBe(false)
    expect(hasScale(room)).toBe(false)
  })

  it.each([
    'gold',
    'silver',
    'coin',
    'coins',
    'money',
    'nothing',
    'thanks',
    'Thank you',
    'thank you.',
  ])('answers a taking answer %j with "Then you would be taking."', (words) => {
    const { gameState, room } = hallState(true)

    const result = new AncientDragon().sayTo(gameState, words)

    expect(result).toContain('Then you would be taking.')
    expect(gameState.getStoryFlag(FLAG_ACT3_DRAGON_OATH_SPOKEN)).toBe(false)
    expect(hasScale(room)).toBe(false)
  })

  it('gives the same waiting line to any say once the oath is given', () => {
    const { gameState } = hallState(true)
    gameState.setStoryFlag(FLAG_ACT3_DRAGON_OATH_SPOKEN, true)

    for (const words of ['everything', 'hello']) {
      const result = new AncientDragon().sayTo(gameState, words)
      expect(result).toContain(
        'The oath has been given and accepted. The scale is yours to claim.',
      )
    }
  })

  it('does not need the scrolls in hand, only the scrolls-read flag', () => {
    const { gameState } = hallState(true)
    expect(gameState.inventory.some((i) => i.name === 'Old Oath Scrolls')).toBe(
      false,
    )

    const result = new AncientDragon().sayTo(gameState, 'everything')

    expect(gameState.getStoryFlag(FLAG_ACT3_DRAGON_OATH_SPOKEN)).toBe(true)
    expect(result).toContain('Your words ring true')
  })

  it('closes every talk with the question once the scrolls are read', () => {
    const { gameState } = hallState(true)
    const dragon = new AncientDragon()

    for (let i = 0; i < 2; i++) {
      const result = dragon.talkTo(gameState)
      expect(result).toContain(QUESTION)
      expect(result).not.toContain('scale awaits')
    }
  })

  it('keeps the old closing line before the scrolls are read', () => {
    const { gameState } = hallState(false)

    const result = new AncientDragon().talkTo(gameState)

    expect(result).toContain('The scale awaits when you are ready')
    expect(result).not.toContain(QUESTION)
  })

  it('closes talk with the accepted line between oath and scale', () => {
    const { gameState } = hallState(true)
    gameState.setStoryFlag(FLAG_ACT3_DRAGON_OATH_SPOKEN, true)

    const result = new AncientDragon().talkTo(gameState)

    expect(result).toContain(
      'The oath has been given and accepted. The scale is yours to claim.',
    )
    expect(result).not.toContain(QUESTION)
  })

  it('attributes the dialogue in every branch', () => {
    const dragon = new AncientDragon()
    const { gameState } = hallState(false)
    const answers = [dragon.talkTo(gameState), dragon.sayTo(gameState, 'x')]
    gameState.setStoryFlag(FLAG_ACT3_OATH_SCROLLS_EXAMINED, true)
    answers.push(dragon.talkTo(gameState))
    answers.push(dragon.sayTo(gameState, 'hello'))
    answers.push(dragon.sayTo(gameState, 'gold'))
    answers.push(dragon.sayTo(gameState, 'everything'))
    answers.push(dragon.sayTo(gameState, 'everything'))
    answers.push(dragon.talkTo(gameState))

    for (const answer of answers) {
      expectMarkupWellFormed(answer)
      expectDialogueSpeaker(answer, dragon.name)
    }
  })

  it('narrates ignored words without speakerless dialogue', () => {
    const { gameState } = hallState(true)

    const answer = new AncientDragon().sayTo(gameState, 'hello')

    expectMarkupWellFormed(answer)
    expectNoSpeakerlessDialogue(answer)
  })

  it('tells the memory as three speeches by the ancient dragon', () => {
    const dragon = new AncientDragon()
    const gameState = makeGameState()

    const blocks = parseTurn(dragon.talkTo(gameState))

    const speeches = blocks.filter((b) => b.kind === 'dialogue')
    expect(speeches).toHaveLength(6)
    expect(
      speeches.every(
        (b) => b.kind === 'dialogue' && b.speaker === 'ancient dragon',
      ),
    ).toBe(true)
    expect(speeches[0].kind === 'dialogue' && speeches[0].markup).toBe(
      'Young one, I remember your parents well. Aren and Lysa, Wardens of ' +
        'the Dawn. They came to me with their friend Malakar, the three of ' +
        'them laughing, and made the relics as equals.',
    )
    expect(speeches[2].kind === 'dialogue' && speeches[2].markup).toBe(
      'They are not gone as the dead are gone, child. They are warded ' +
        'away, not dead.',
    )
    expect(speeches[3].kind === 'dialogue' && speeches[3].markup).toBe(
      'They had a saying, the three of them, carved wherever they worked: ' +
        'Power follows purpose; purpose follows truth.',
    )
    expect(speeches[4].kind === 'dialogue' && speeches[4].markup).toBe(
      'The friend who stayed behind.',
    )
  })

  it('glows the amulet after the memory and before the later-talk line, once', () => {
    const dragon = new AncientDragon()
    const gameState = makeGameState()

    const first = dragon.talkTo(gameState)
    const again = dragon.talkTo(gameState)

    expect(first.indexOf('warded away, not dead')).toBeLessThan(
      first.indexOf('blazes in your hand a third time'),
    )
    expect(first.indexOf('blazes in your hand a third time')).toBeLessThan(
      first.indexOf('The memory has been shared'),
    )
    expect(again).not.toContain('blazes')
    expectMarkupWellFormed(first)
    expect(
      gameState.inventory.find((i) => i instanceof AncientAmulet)?.description,
    ).toContain('hand in hand')
  })

  it('plays the refrain, glow, voice and naming in order on the first talk', () => {
    const dragon = new AncientDragon()
    const gameState = makeGameState()

    const first = dragon.talkTo(gameState)

    const order = [
      'warded away, not dead',
      'Power follows purpose; purpose follows truth.',
      'blazes in your hand a third time',
      'another voice',
      'You look up at the ',
      'The friend who stayed behind.',
      'It says no more.',
      'The memory has been shared',
    ].map((part) => first.indexOf(part))
    expect(order.every((i) => i >= 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
    expect(gameState.getStoryFlag(FLAG_ACT3_DRAGON_VOICE_HEARD)).toBe(true)
    expectMarkupWellFormed(first)
  })

  it('writes the voice as unlabelled narration with italic words', () => {
    const gameState = makeGameState()

    const blocks = parseTurn(new AncientDragon().talkTo(gameState))

    const voice = blocks.find(
      (b) => b.kind === 'text' && b.markup.includes('another voice'),
    )
    expect(voice?.kind === 'text' && voice.markup).toBe(
      "Then, beneath the dragon's breathing, another voice: the whisper " +
        'from your dream, at the very edge of hearing. [italic]“Elior… ' +
        'little one. Help me. I cannot hold it shut alone.”[/italic] You ' +
        'know it the way you know a song someone sang to you before you ' +
        'had words for it. Then it is gone.',
    )
    expect(
      blocks.some((b) => b.kind === 'event' && b.markup === 'It says no more.'),
    ).toBe(true)
  })

  it('skips the glow but keeps the voice when the amulet is not carried', () => {
    const gameState = makeGameState()
    gameState.inventory = gameState.inventory.filter(
      (i) => !(i instanceof AncientAmulet),
    )

    const first = new AncientDragon().talkTo(gameState)

    expect(first).not.toContain('blazes')
    expect(first).toContain('another voice')
    expect(first).toContain('The friend who stayed behind.')
  })

  it('never repeats the voice on later talks', () => {
    const dragon = new AncientDragon()
    const gameState = makeGameState()
    dragon.talkTo(gameState)

    const again = dragon.talkTo(gameState)

    expect(again).not.toContain('another voice')
    expect(again).not.toContain('stayed behind')
    expect(again).not.toContain('Power follows')
    expect(again).toContain('The memory has been shared')
  })

  it('plays only the voice once for a save that heard the memory before', () => {
    const dragon = new AncientDragon()
    const gameState = makeGameState()
    gameState.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)

    const next = dragon.talkTo(gameState)
    const after = dragon.talkTo(gameState)

    expect(next).toContain('another voice')
    expect(next).toContain('The friend who stayed behind.')
    expect(next).not.toContain('Power follows')
    expect(next).not.toContain('blazes')
    expect(next.indexOf('It says no more.')).toBeLessThan(
      next.indexOf('The memory has been shared'),
    )
    expect(after).not.toContain('another voice')
    expectMarkupWellFormed(next)
  })
})
