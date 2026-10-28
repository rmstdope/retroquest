import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { RIDDLES, WaterNymphs } from './WaterNymphs'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
  expectNoSpeechOutsideDialogue,
} from '@/testing/gameHelpers'

const SPEAKER = 'water nymphs'
const HELP = '[dim](Answer them with: say <your answer> to water nymphs.)[/dim]'

/** An Act II game with the Water Nymphs present in the Whispering Glade. */
function createGameWithNymphs(): { game: Game; nymphs: WaterNymphs } {
  const game = new Game([new Act2()])
  const nymphs = new WaterNymphs()
  game.state.currentRoom = game.state.allRooms.WhisperingGlade
  game.state.currentRoom.characters.push(nymphs)
  return { game, nymphs }
}

/** The text inside every [dialogue] block of an answer. */
function spoken(answer: string): string[] {
  return [...answer.matchAll(/\[dialogue\](.*?)\[\/dialogue\]/gs)].map(
    (m) => m[1],
  )
}

describe('Water Nymphs dialogue markup', () => {
  it('uses known tags when answering after the last riddle', () => {
    const game = new Game([new Act2()])
    const nymphs = new WaterNymphs()
    nymphs.currentRiddle = RIDDLES.length

    const answer = nymphs.sayTo(game.state, 'water')

    expect(answer).toContain('no more riddles to answer')
    expectMarkupWellFormed(answer)
  })

  it('attributes a wrong answer reply to the nymphs', () => {
    const { game } = createGameWithNymphs()
    game.commandParser.parse('talk to water nymphs')

    const answer = game.commandParser.parse('say wrong to water nymphs')

    expect(answer).toContain(' shake their heads gently.')
    expect(answer).not.toContain('wrong')
    expect(answer).toContain(
      'Is that really what you think? Will you hear it again?',
    )
    expect(answer).toContain(RIDDLES[0].question)
    expect(answer).not.toContain('Consider what')
    expect(answer).not.toContain(RIDDLES[0].hint)
    expect(answer).not.toContain('Not quite')
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, SPEAKER)
    expectNoSpeechOutsideDialogue(answer)
  })
})

describe('Water Nymphs voice', () => {
  it('welcomes with a question and poses the first riddle', () => {
    const { game, nymphs } = createGameWithNymphs()

    const answer = nymphs.talkTo(game.state)

    expect(answer).not.toContain('You approach the')
    expect(answer).not.toContain('sacred')
    expect(answer).toContain('The stream rises into shapes.')
    expect(answer).toContain(
      'Came all this way to stand in our water? Will you answer three ' +
        'questions, then? Shall we start?',
    )
    expect(answer).toContain(RIDDLES[0].question)
    expect(answer).toContain(HELP)
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, SPEAKER)
  })

  it('names the second then the third riddle when talked to mid-riddles', () => {
    const { game, nymphs } = createGameWithNymphs()
    nymphs.currentRiddle = 1
    const second = nymphs.talkTo(game.state)
    nymphs.currentRiddle = 2
    const third = nymphs.talkTo(game.state)

    expect(second).toContain(
      "Back so soon? Do you remember where we were? The second one, wasn't it?",
    )
    expect(second).toContain(RIDDLES[1].question)
    expect(second).toContain(HELP)
    expect(third).toContain('The third one, wasn')
    expect(third).toContain(RIDDLES[2].question)
    expectMarkupWellFormed(second)
    expectDialogueSpeaker(second, SPEAKER)
  })

  it('nods with a question after a right answer and poses the next riddle', () => {
    const { game, nymphs } = createGameWithNymphs()

    const answer = nymphs.sayTo(game.state, 'water')

    expect(answer).toContain(
      'The stream runs a little faster round your boots. The ' +
        '[character_name]water nymphs[/character_name] nod. ',
    )
    expect(answer).not.toMatch(/Correct|right answer/)
    expect(answer).toContain(
      'Did you know it, or guess it? Does it matter? What about this one?',
    )
    expect(answer).toContain(RIDDLES[1].question)
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, SPEAKER)
  })

  it('laughs and releases the pool and flowers on the third right answer', () => {
    const { game, nymphs } = createGameWithNymphs()
    nymphs.currentRiddle = 2

    const answer = nymphs.sayTo(game.state, 'truth')

    expect(answer).toContain(
      'Three for three — who taught you to listen like that? Will you take ' +
        'what grows here? Who else would we give it to?',
    )
    expect(answer).toContain(
      'They draw back from the bank. The [item_name]crystal-clear ' +
        'water[/item_name] and the [item_name]moonflowers[/item_name] at ' +
        'its edge are there for the taking.',
    )
    expect(answer).not.toMatch(/Correct|Purpose follows truth/)
    expect(
      game.state.currentRoom.items.map((i) => i.name.toLowerCase()),
    ).toEqual(expect.arrayContaining(['crystal-clear water', 'moonflowers']))
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, SPEAKER)
  })

  it('asks questions after all three riddles and answers speech with a smile', () => {
    const { game, nymphs } = createGameWithNymphs()
    nymphs.currentRiddle = RIDDLES.length
    nymphs.riddlesCompleted = true

    const talk = nymphs.talkTo(game.state)
    const said = nymphs.sayTo(game.state, 'hello')

    expect(talk).toContain(
      "Back again? Wasn't three enough? What more could we ask you?",
    )
    expect(said).toBe(
      '[dim]The [character_name]water nymphs[/character_name] listen and only smile. They have no more riddles for you.[/dim]',
    )
    expectMarkupWellFormed(talk)
    expectDialogueSpeaker(talk, SPEAKER)
  })

  it('puts a question in every spoken line of every talk and reply', () => {
    const { game, nymphs } = createGameWithNymphs()
    const replies = [nymphs.talkTo(game.state)]
    nymphs.currentRiddle = 1
    replies.push(nymphs.talkTo(game.state))
    replies.push(nymphs.sayTo(game.state, 'wrong'))
    replies.push(nymphs.sayTo(game.state, 'wrong'))
    replies.push(nymphs.sayTo(game.state, 'mask'))
    nymphs.currentRiddle = 2
    replies.push(nymphs.sayTo(game.state, 'truth'))
    replies.push(nymphs.talkTo(game.state))

    for (const reply of replies) {
      for (const line of spoken(reply)) {
        expect(line).toContain('?')
      }
    }
  })

  it('describes itself in plain words', () => {
    const { game, nymphs } = createGameWithNymphs()

    const answer = nymphs.examine(game.state)

    expect(nymphs.description).toBe(
      'Three of them, or four; it is hard to count water. They sit ' +
        'waist-deep in the stream, and the stream runs through them.',
    )
    expect(answer).toContain(
      'When you lean closer, every one of them leans closer too.',
    )
    expect(answer).not.toMatch(/ancient|wisdom|sacred/i)
    expectMarkupWellFormed(answer)
  })
})

const NYMPH_BLIGHT =
  'Have you seen the streams come down thinner from the hills this ' +
  'season? What drinks up there before we do, that the fields below the ' +
  'city taste it first?'

describe('Water Nymphs and the blight', () => {
  it('says nothing of it while a riddle is open or on the last answer', () => {
    const { game } = createGameWithNymphs()

    expect(game.commandParser.parse('talk to water nymphs')).not.toContain(
      'thinner',
    )
    game.commandParser.parse('say water to water nymphs')
    game.commandParser.parse('say mask to water nymphs')
    const last = game.commandParser.parse('say truth to water nymphs')

    expect(last).toContain('Three for three')
    expect(last).not.toContain('thinner')
  })

  it('adds the line after the praise on every later talk', () => {
    const { game } = createGameWithNymphs()
    for (const word of ['water', 'mask', 'truth'])
      game.commandParser.parse(`say ${word} to water nymphs`)

    for (let i = 0; i < 2; i++) {
      const answer = game.commandParser.parse('talk to water nymphs')
      const order = ["Wasn't three enough?", NYMPH_BLIGHT].map((part) =>
        answer.indexOf(part),
      )
      expect(order.every((n) => n >= 0)).toBe(true)
      expect(order).toEqual([...order].sort((a, b) => a - b))
      expectMarkupWellFormed(answer)
      expectDialogueSpeaker(answer, SPEAKER)
      expectNoSpeechOutsideDialogue(answer)
    }
  })
})

describe('Water Nymphs riddles: mask and truth', () => {
  it('asks water, mask, then truth', () => {
    expect(RIDDLES.map((r) => r.answers[0])).toEqual(['water', 'mask', 'truth'])
    expect(RIDDLES[1].question).toContain('I smile, yet I have no eyes.')
    expect(RIDDLES[2].question).toContain('Purpose follows me')
  })

  it.each([
    [1, ['mask', 'masks', 'a mask', 'the mask', 'false face', 'disguise']],
    [2, ['truth', 'the truth', 'a truth', 'honesty', 'true']],
    [0, ['water', 'the water', 'rain', 'stream', 'river']],
  ])('accepts every synonym of riddle %i in any case', (index, words) => {
    for (const word of words) {
      const { game, nymphs } = createGameWithNymphs()
      nymphs.currentRiddle = index
      nymphs.sayTo(game.state, word.toUpperCase())
      expect(nymphs.currentRiddle).toBe(index + 1)
    }
  })

  it('ignores surrounding spaces', () => {
    const { game, nymphs } = createGameWithNymphs()
    nymphs.currentRiddle = 1
    nymphs.sayTo(game.state, '  Mask ')
    expect(nymphs.currentRiddle).toBe(2)
  })

  it('treats a typo as a miss', () => {
    const { game, nymphs } = createGameWithNymphs()
    nymphs.currentRiddle = 1
    expect(nymphs.sayTo(game.state, 'mak')).toContain('shake their heads')
    expect(nymphs.currentRiddle).toBe(1)
  })
})

describe('Water Nymphs hints', () => {
  const miss = (n: WaterNymphs, g: Game): string => n.sayTo(g.state, 'wrong')

  it('gives no hint on the first miss and a hint on every later miss', () => {
    const { game, nymphs } = createGameWithNymphs()
    nymphs.currentRiddle = 1
    const first = miss(nymphs, game)
    const second = miss(nymphs, game)
    const third = miss(nymphs, game)

    expect(first).not.toContain(RIDDLES[1].hint)
    expect(second).toContain(RIDDLES[1].hint)
    expect(second.indexOf(RIDDLES[1].question)).toBeLessThan(
      second.indexOf(RIDDLES[1].hint),
    )
    expect(third).toContain(RIDDLES[1].hint)
    for (const reply of [first, second, third]) {
      expect(reply).not.toContain('Consider what')
      expectMarkupWellFormed(reply)
      expectNoSpeechOutsideDialogue(reply)
    }
  })

  it('starts the count over when the riddle is answered', () => {
    const { game, nymphs } = createGameWithNymphs()
    miss(nymphs, game)
    miss(nymphs, game)
    nymphs.sayTo(game.state, 'water')

    expect(miss(nymphs, game)).not.toContain(RIDDLES[1].hint)
  })

  it('reads a save made before the count existed as zero misses', () => {
    const { game } = createGameWithNymphs()
    const old = JSON.parse(game.toSaveData()) as unknown
    const strip = (value: unknown): void => {
      if (Array.isArray(value)) value.forEach(strip)
      else if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>
        delete record.missCount
        Object.values(record).forEach(strip)
      }
    }
    strip(old)
    const reloaded = new Game([new Act2()])
    reloaded.loadSaveData(JSON.stringify(old))
    const nymphs = reloaded.state.allRooms.WhisperingGlade.characters.find(
      (c): c is WaterNymphs => c instanceof WaterNymphs,
    ) as WaterNymphs

    expect(miss(nymphs, reloaded)).not.toContain(RIDDLES[0].hint)
    expect(miss(nymphs, reloaded)).toContain(RIDDLES[0].hint)
  })

  it('keeps the count across leaving and a save reload, with no hint on return', () => {
    const { game, nymphs } = createGameWithNymphs()
    miss(nymphs, game)
    miss(nymphs, game)

    game.commandParser.parse('go west')
    expect(game.state.currentRoom).not.toBe(game.state.allRooms.WhisperingGlade)
    game.commandParser.parse('go east')
    expect(game.commandParser.parse('talk to water nymphs')).not.toContain(
      RIDDLES[0].hint,
    )
    expect(nymphs.missCount).toBe(2)

    const reloaded = new Game([new Act2()])
    reloaded.loadSaveData(game.toSaveData())
    const again = reloaded.state.allRooms.WhisperingGlade.characters.find(
      (c): c is WaterNymphs => c instanceof WaterNymphs,
    )
    expect(again?.missCount).toBe(2)
    expect(miss(again as WaterNymphs, reloaded)).toContain(RIDDLES[0].hint)
  })
})

describe('Water Nymphs right answers', () => {
  it('wear your face for a moment after the mask', () => {
    const { game, nymphs } = createGameWithNymphs()
    nymphs.currentRiddle = 1

    const answer = nymphs.sayTo(game.state, 'mask')

    expect(answer).toContain(
      'For a moment every one of the [character_name]water ' +
        'nymphs[/character_name] wears your face. Then they nod. ',
    )
    expect(answer).toContain(RIDDLES[2].question)
    expect(answer).not.toMatch(/Correct|right answer/)
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, SPEAKER)
  })
})

describe('Water Nymphs near misses', () => {
  it.each([
    [0, 'blood', 'Blood? Does the sky bleed, then, every time it rains?'],
    [
      0,
      'ice',
      'Can snow carve stone in summer? And what is it, once it melts?',
    ],
    [
      0,
      'snow',
      'Can snow carve stone in summer? And what is it, once it melts?',
    ],
    [1, 'face', 'A face? Whose, then? Is it its own?'],
    [1, 'mirror', 'Can you put a mirror on? Would it hide you, or show you?'],
    [
      1,
      'liar',
      "A liar has eyes, hasn't he? And what does he hold up in front of them?",
    ],
    [
      1,
      'lie',
      "A liar has eyes, hasn't he? And what does he hold up in front of them?",
    ],
    [2, 'purpose', 'Purpose? But what does purpose follow?'],
    [
      2,
      'power',
      "Power? Isn't power at the end of the line? What stands at the start of it?",
    ],
    [
      2,
      'lie',
      "Does a lie grow heavier for being hidden? Isn't it glad of the dark?",
    ],
    [
      2,
      'lies',
      "Does a lie grow heavier for being hidden? Isn't it glad of the dark?",
    ],
    [
      2,
      'secret',
      "A secret is only how a thing is kept, isn't it? What is the thing?",
    ],
  ])('riddle %i answers "%s" with its own question', (index, word, reply) => {
    const { game, nymphs } = createGameWithNymphs()
    nymphs.currentRiddle = index

    const answer = nymphs.sayTo(game.state, word)

    expect(answer).toContain(' shake their heads gently.')
    expect(answer).toContain(reply)
    expect(answer).not.toContain('Is that really what you think?')
    expect(answer).toContain(RIDDLES[index].question)
    expect(answer).not.toContain(RIDDLES[index].hint)
    expect(nymphs.currentRiddle).toBe(index)
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, SPEAKER)
    expectNoSpeechOutsideDialogue(answer)
  })

  it('counts a near miss towards the hint', () => {
    const { game, nymphs } = createGameWithNymphs()
    nymphs.currentRiddle = 2
    nymphs.sayTo(game.state, 'purpose')

    expect(nymphs.sayTo(game.state, 'power')).toContain(RIDDLES[2].hint)
  })
})
