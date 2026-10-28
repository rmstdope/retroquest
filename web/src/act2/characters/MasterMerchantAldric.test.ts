import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { MerchantsFlyer } from '../items/MerchantsFlyer'
import { WalkingStick } from '../items/WalkingStick'
import { QualityRope } from '../items/QualityRope'
import { Coins } from '../items/Coins'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
  expectNoSpeechOutsideDialogue,
} from '@/testing/gameHelpers'

const SPEAKER = 'Master Merchant Aldric'

/** An Act II game with the player in the Market District. */
function createGameAtMarket(): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom = game.state.allRooms.MarketDistrict
  return game
}

/** The answer is well formed and Aldric speaks every dialogue. */
function expectAldricSpeaks(answer: string): void {
  expectMarkupWellFormed(answer)
  expectDialogueSpeaker(answer, SPEAKER)
  expectNoSpeechOutsideDialogue(answer)
}

describe('Master Merchant Aldric dialogue markup', () => {
  it('attributes the talk before the flyer to Aldric', () => {
    const game = createGameAtMarket()

    const answer = game.commandParser.parse('talk to master merchant aldric')

    expect(answer).toContain('I deal only with established customers')
    expect(answer).toContain('Even one of my own handbills will do.')
    expectAldricSpeaks(answer)
  })

  it('attributes giving the flyer to Aldric', () => {
    const game = createGameAtMarket()
    game.state.addItemToInventory(new MerchantsFlyer())

    const answer = game.commandParser.parse(
      "give merchant's flyer to master merchant aldric",
    )

    expect(answer).toContain(
      'This flyer grants you access to our premium selection',
    )
    expect(answer).toContain('finds his own name on it')
    expect(answer).not.toContain('preferred customer pricing')
    expectAldricSpeaks(answer)
  })

  it('attributes the talk after the flyer to Aldric', () => {
    const game = createGameAtMarket()
    game.state.addItemToInventory(new MerchantsFlyer())
    game.commandParser.parse("give merchant's flyer to master merchant aldric")

    const answer = game.commandParser.parse('talk to master merchant aldric')

    expect(answer).toContain('My premium selection includes')
    expectAldricSpeaks(answer)
  })

  it('attributes declining other items to Aldric', () => {
    const game = createGameAtMarket()
    game.state.addItemToInventory(new WalkingStick())

    const answer = game.commandParser.parse(
      'give walking stick to master merchant aldric',
    )

    expect(answer).toContain('I deal in adventure gear, not donations')
    expect(answer).toContain(
      'turns the [item_name]walking stick[/item_name] over and hands it back',
    )
    expectAldricSpeaks(answer)
  })
})

describe('Master Merchant Aldric at the stall', () => {
  it('names a ware he does not stock without stray quote marks', () => {
    const game = createGameWithOpenShop()

    const answer = game.commandParser.parse(
      'buy forest axe from master merchant aldric',
    )

    expect(answer).toContain(
      "I don't stock any [item_name]forest axe[/item_name]. What I sell is laid out here.",
    )
    expect(answer).not.toContain("' [item_name]")
    expectAldricSpeaks(answer)
  })

  it('will not sell a second rope', () => {
    const game = createGameWithOpenShop()
    game.state.addItemToInventory(new QualityRope())
    for (let i = 0; i < 20; i++) game.state.addItemToInventory(new Coins())

    const answer = game.commandParser.parse(
      'buy quality rope from master merchant aldric',
    )

    expect(answer).toContain(
      "You've a [item_name]quality rope[/item_name] already. I'd sooner sell you something you'll use.",
    )
    expectAldricSpeaks(answer)
  })
})

const ALDRIC_BLIGHT =
  'Bread costs near twice what it did in spring. The farms west of the city ' +
  'send half the grain they used to, and what does come is grey at the husk. ' +
  'Not my trade, mind, but my suppliers talk of little else.'

/** A game where Aldric's shop is open. */
function createGameWithOpenShop(): Game {
  const game = createGameAtMarket()
  game.state.addItemToInventory(new MerchantsFlyer())
  game.commandParser.parse("give merchant's flyer to master merchant aldric")
  return game
}

describe('Master Merchant Aldric and the blight', () => {
  it('says the blight line as his fourth remark, then starts over', () => {
    const game = createGameWithOpenShop()

    const talks = [1, 2, 3, 4, 5].map(() =>
      game.commandParser.parse('talk to master merchant aldric'),
    )

    expect(talks[0]).toContain('Welcome to Aldric')
    expect(talks[0]).toContain('Rope that holds, lanterns that stay lit')
    expect(talks[2]).toContain('a lantern and a good rope')
    expect(talks[1]).toContain('Planning an expedition?')
    expect(talks[2]).toContain('strange happenings')
    expect(talks[3]).toContain(ALDRIC_BLIGHT)
    expect(talks[4]).toContain('Welcome to Aldric')
    for (const talk of talks.slice(0, 3)) expect(talk).not.toContain('Bread')
    expect(talks[3]).toContain('My premium selection includes')
    expect(talks[3].indexOf(ALDRIC_BLIGHT)).toBeLessThan(
      talks[3].indexOf('My premium selection includes'),
    )
    expectAldricSpeaks(talks[3])
  })

  it('has no blight line before the flyer', () => {
    const game = createGameAtMarket()

    for (let i = 0; i < 5; i++) {
      expect(
        game.commandParser.parse('talk to master merchant aldric'),
      ).not.toContain('Bread')
    }
  })

  it('keeps his place in the rotation through a save and load', () => {
    const game = createGameWithOpenShop()
    for (let i = 0; i < 3; i++)
      game.commandParser.parse('talk to master merchant aldric')
    const fresh = new Game([new Act2()])
    expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')

    const answer = fresh.commandParser.parse('talk to master merchant aldric')

    expect(answer).toContain(ALDRIC_BLIGHT)
  })
})

describe('Master Merchant Aldric restored from a save made before the rewrite', () => {
  it('speaks the current lines, not the wording held in the save', () => {
    const game = createGameAtMarket()
    const aldric = game.state.currentRoom.getCharacterByName(
      'master merchant aldric',
    )
    if (!aldric) throw new Error('no aldric')
    const legacy: [string, unknown][] = [
      ['closedDialogue', 'I need an introduction or referral.'],
      ['dialogueOptions', ['An old idle line.']],
    ]
    for (const [field, value] of legacy) {
      Object.defineProperty(aldric, field, {
        value,
        enumerable: true,
        writable: true,
        configurable: true,
      })
    }
    game.state.addItemToInventory(new MerchantsFlyer())
    const loaded = new Game([new Act2()])
    expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')

    const closed = loaded.commandParser.parse('talk to master merchant aldric')
    expect(closed).toContain('Even one of my own handbills will do.')
    expect(closed).not.toContain('referral')

    loaded.commandParser.parse(
      "give merchant's flyer to master merchant aldric",
    )
    const open = loaded.commandParser.parse('talk to master merchant aldric')
    expect(open).not.toContain('An old idle line.')
  })
})
