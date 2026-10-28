import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { WalkingStick } from '../items/WalkingStick'
import { MountainFlower } from '../items/MountainFlower'
import { VIRTUE_SELFLESS } from '../Act2StoryFlags'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
  expectNoSpeechOutsideDialogue,
} from '@/testing/gameHelpers'

const SPEAKER = 'families'
const WELCOME = "You're the one who helped the old folk over the cobbles."

/** An Act II game where the player has helped the elderly residents. */
function createGameAfterHelpingElders(): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom = game.state.allRooms.ResidentialQuarter
  game.state.addItemToInventory(new WalkingStick())
  game.commandParser.parse('give walking stick to families')
  return game
}

/** The answer is well formed and the families speak every dialogue. */
function expectFamiliesSpeak(answer: string): void {
  expectMarkupWellFormed(answer)
  expectDialogueSpeaker(answer, SPEAKER)
  expectNoSpeechOutsideDialogue(answer)
}

describe('Families dialogue markup', () => {
  it('gives the herbs as attributed dialogue on the first talk after helping', () => {
    const game = createGameAfterHelpingElders()

    const answer = game.commandParser.parse('talk to families')

    expect(answer).toContain('Here, dear,')
    expect(answer).toContain("From my mother's garden")
    expect(answer).toContain(
      'You receive [item_name]healing herbs[/item_name].',
    )
    expect(answer).not.toContain('!')
    expect(game.state.hasItem('healing herbs')).toBe(true)
    expectFamiliesSpeak(answer)
  })

  it('attributes later talks to the families', () => {
    const game = createGameAfterHelpingElders()
    game.commandParser.parse('talk to families')

    const answer = game.commandParser.parse('talk to families')

    expect(answer).toContain(WELCOME)
    expect(answer).not.toContain('Here, dear,')
    expectFamiliesSpeak(answer)
  })
})

const POINTER_LINE =
  "Master Lyria up the lane has been asking all week for herbs like these. If you've no use for them yourself, she would."

describe('Families point to Lyria', () => {
  it('says the pointer once with the gift, before the Wren line', () => {
    const game = createGameAfterHelpingElders()

    const first = game.commandParser.parse('talk to families')
    const second = game.commandParser.parse('talk to families')

    expect(first).toContain(POINTER_LINE)
    expect(first.indexOf('You receive')).toBeLessThan(
      first.indexOf(POINTER_LINE),
    )
    expect(first.indexOf(POINTER_LINE)).toBeLessThan(
      first.indexOf('Little Wren'),
    )
    expect(second).not.toContain(POINTER_LINE)
    expectFamiliesSpeak(first)
  })
})

const WREN_LINE =
  'Little Wren at the end house has been abed with fever all week.'
const REMEMBERED = '✦ Selflessness — this will be remembered'

describe('Families and the mountain flower (selfless moment)', () => {
  it('ends every talk with the Wren line until she has the flower', () => {
    const game = createGameAfterHelpingElders()

    const first = game.commandParser.parse('talk to families')
    const second = game.commandParser.parse('talk to families')

    for (const answer of [first, second]) {
      expect(answer).toContain(WREN_LINE)
      expectFamiliesSpeak(answer)
    }
    expect(first.indexOf("From my mother's garden")).toBeLessThan(
      first.indexOf(WREN_LINE),
    )
    expect(
      second
        .trimEnd()
        .endsWith(
          `purple flowers that grow up on the mountain path. None of us can manage that climb any more.[/dialogue]`,
        ),
    ).toBe(true)
  })

  it('shows no Wren line before the walking stick help', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.ResidentialQuarter

    expect(game.commandParser.parse('talk to families')).not.toContain('Wren')
  })

  it('shows a stranger an old man on the cobbles, the need the stick answers', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.ResidentialQuarter

    const answer = game.commandParser.parse('talk to families')

    expect(answer).toContain(
      'Behind them an old man inches along the cobbles, one hand flat ' +
        'against the wall.',
    )
    expect(answer).toContain('[clue]')
  })

  it('shows the old man walking with the stick when it is given', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.ResidentialQuarter
    game.state.addItemToInventory(new WalkingStick())

    const answer = game.commandParser.parse('give walking stick to families')

    expect(answer).toContain(
      'walks the length of the lane without touching the wall.',
    )
    expect(answer).not.toContain('You use your walking stick')
  })

  it('takes the flower, thanks Elior and records selflessness once', () => {
    const game = createGameAfterHelpingElders()
    game.state.addItemToInventory(new MountainFlower())

    const answer = game.commandParser.parse('give mountain flower to families')

    expect(answer).not.toContain('You give the')
    expect(answer).toContain('A little later a thin face appears at the window')
    expect(answer).toContain(
      "She's smiling. First time in a week. It's only a flower, and she knows " +
        'it, but it came from the mountain and someone thought of her. ' +
        'Thank you, truly.',
    )
    expect(answer).toContain(REMEMBERED)
    expectFamiliesSpeak(answer)
    expect(game.state.hasItem('mountain flower')).toBe(false)
    expect(game.state.hasVirtue(VIRTUE_SELFLESS)).toBe(true)
  })

  it('drops the Wren line and adds nothing after the flower', () => {
    const game = createGameAfterHelpingElders()
    game.state.addItemToInventory(new MountainFlower())
    game.commandParser.parse('give mountain flower to families')

    const answer = game.commandParser.parse('talk to families')

    expect(answer).not.toContain('Wren')
    expect(answer).not.toContain('remembered')
  })

  it('refuses the flower before the walking stick help and records nothing', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.ResidentialQuarter
    game.state.addItemToInventory(new MountainFlower())

    const answer = game.commandParser.parse('give mountain flower to families')

    expect(answer).not.toContain('You give the')
    expect(answer).toContain(
      'give you polite but distant nods. Nobody seems to know what a ' +
        'stranger wants with them, or with a flower.',
    )
    expect(answer).not.toContain('remembered')
    expect(game.state.hasItem('mountain flower')).toBe(true)
    expect(game.state.hasVirtue(VIRTUE_SELFLESS)).toBe(false)
  })

  it('records the moment even when Act I already recorded selflessness', () => {
    const game = createGameAfterHelpingElders()
    game.state.addVirtue(VIRTUE_SELFLESS)
    game.state.addItemToInventory(new MountainFlower())

    const answer = game.commandParser.parse('give mountain flower to families')

    expect(answer).toContain(REMEMBERED)
  })
})

const BLIGHT_LINE =
  'Our garden plots have gone grey this year. Beans, cabbages, the lot: they ' +
  'come up green and then simply give up. Old Hettie says it is the soil, but ' +
  'none of us has ever seen soil do that.'

describe('Families and the blight', () => {
  it('has no blight line before the elders were helped', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.ResidentialQuarter

    expect(game.commandParser.parse('talk to families')).not.toContain(
      'garden plots',
    )
  })

  it('orders welcome, herbs, blight, Wren on the first friendly talk', () => {
    const game = createGameAfterHelpingElders()

    const answer = game.commandParser.parse('talk to families')

    const order = [
      WELCOME,
      "From my mother's garden",
      BLIGHT_LINE,
      WREN_LINE,
    ].map((part) => answer.indexOf(part))
    expect(order.every((i) => i >= 0)).toBe(true)
    expect(order).toEqual([...order].sort((a, b) => a - b))
    expectFamiliesSpeak(answer)
  })

  it('orders welcome, blight, Wren on later talks', () => {
    const game = createGameAfterHelpingElders()
    game.commandParser.parse('talk to families')

    const answer = game.commandParser.parse('talk to families')

    const order = [WELCOME, BLIGHT_LINE, WREN_LINE].map((part) =>
      answer.indexOf(part),
    )
    expect(order.every((i) => i >= 0)).toBe(true)
    expect(order).toEqual([...order].sort((a, b) => a - b))
    expectFamiliesSpeak(answer)
  })

  it('keeps the blight line after Wren has the flower, without her line', () => {
    const game = createGameAfterHelpingElders()
    game.commandParser.parse('talk to families')
    game.state.addItemToInventory(new MountainFlower())
    game.commandParser.parse('give mountain flower to families')

    const answer = game.commandParser.parse('talk to families')

    expect(answer).toContain(BLIGHT_LINE)
    expect(answer).not.toContain('Wren')
    expectFamiliesSpeak(answer)
  })
})
