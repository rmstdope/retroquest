import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { GuardiansChain } from '../items/GuardiansChain'
import { LoyaltyToken } from '../items/LoyaltyToken'
import { FLAG_ACT4_CHAIN_GIVEN, VIRTUE_SELFLESS } from '../Act4StoryFlags'
import { Act4 } from '../Act4'
import {
  FLAG_ACT4_CAPTAIN_MAN_IN_GREY_TOLD,
  FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED,
  FLAG_ACT4_SERVANTS_FREED,
} from '../Act4StoryFlags'
import { CaptainOfTheGuard } from './CaptainOfTheGuard'
import {
  executeCommands,
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

const SPEAKER = 'Captain of the Guard'

/** Create an Act IV game for the captain's lines. */
function createGame(): Game {
  const act = new Act4()
  act.musicFile = ''
  return new Game([act])
}

describe('CaptainOfTheGuard', () => {
  it('answers to captain and his full name', () => {
    const captain = new CaptainOfTheGuard()
    expect(captain.answersTo('captain')).toBe(true)
    expect(captain.answersTo('Captain of the Guard')).toBe(true)
    expect(captain.answersTo('servants')).toBe(false)
  })

  it('is muddled while the servants are chained', () => {
    const answer = new CaptainOfTheGuard().talkTo(createGame().state)
    expect(answer).toContain('I held the gate for King Alden once.')
    expectDialogueSpeaker(answer, SPEAKER)
    expectMarkupWellFormed(answer)
  })

  it('remembers Cedric once the servants are freed', () => {
    const game = createGame()
    game.state.setStoryFlag(FLAG_ACT4_SERVANTS_FREED, true)
    const answer = new CaptainOfTheGuard().talkTo(game.state)
    expect(answer).toContain('Cedric stood his post')
    expectDialogueSpeaker(answer, SPEAKER)
    expectMarkupWellFormed(answer)
  })

  it('remembers King Alden on the walls before the knight is redeemed', () => {
    const game = createGame()
    game.state.setStoryFlag(FLAG_ACT4_SERVANTS_FREED, true)
    const answer = new CaptainOfTheGuard().talkTo(game.state)
    expect(answer).toContain(
      'King Alden used to walk the walls at night and talk to whoever was on them. That is how they got him.',
    )
    expect(answer).toContain(
      "'I remember now. King Alden used to walk the walls at night and talk to whoever was on them. That is how they got him. Cedric stood his post — it was shadows that came for Alden, not any blade of ours. If you see Sir Cedric again, tell him I am sorry I ever doubted him.'",
    )
    expect(answer).not.toContain('man in grey')
    expect(game.state.getStoryFlag(FLAG_ACT4_CAPTAIN_MAN_IN_GREY_TOLD)).toBe(
      false,
    )
  })

  describe('after the knight is redeemed', () => {
    const MAN_IN_GREY =
      'A man in grey came through here while you were gone, on his knees. He asked my name. I told him.'

    function createRedeemedGame(): Game {
      const game = createGame()
      game.state.setStoryFlag(FLAG_ACT4_SERVANTS_FREED, true)
      game.state.setStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED, true)
      return game
    }

    it('tells of the man in grey once, at the end of the same line', () => {
      const game = createRedeemedGame()
      const first = new CaptainOfTheGuard().talkTo(game.state)
      expect(first).toContain(
        'tell him I am sorry I ever doubted him. ' + MAN_IN_GREY,
      )
      expect(first).toContain("'I remember now.")
      expectDialogueSpeaker(first, SPEAKER)
      expectMarkupWellFormed(first)
      expect(game.state.getStoryFlag(FLAG_ACT4_CAPTAIN_MAN_IN_GREY_TOLD)).toBe(
        true,
      )
    })

    it('gives the usual awake line on every later talk', () => {
      const game = createRedeemedGame()
      const captain = new CaptainOfTheGuard()
      captain.talkTo(game.state)
      const second = captain.talkTo(game.state)
      expect(second).not.toContain('man in grey')
      expect(second).toContain('Cedric stood his post')
    })

    it('keeps whether it was told through save and load', () => {
      const game = createRedeemedGame()
      const before = game.toSaveData()
      new CaptainOfTheGuard().talkTo(game.state)
      const after = game.toSaveData()
      game.loadSaveData(before)
      expect(new CaptainOfTheGuard().talkTo(game.state)).toContain(MAN_IN_GREY)
      game.loadSaveData(after)
      expect(new CaptainOfTheGuard().talkTo(game.state)).not.toContain(
        'man in grey',
      )
    })

    it('does not tell it while still enthralled', () => {
      const game = createGame()
      game.state.setStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED, true)
      const answer = new CaptainOfTheGuard().talkTo(game.state)
      expect(answer).not.toContain('man in grey')
      expect(game.state.getStoryFlag(FLAG_ACT4_CAPTAIN_MAN_IN_GREY_TOLD)).toBe(
        false,
      )
    })
  })

  describe('the Guardian’s Chain as a gift', () => {
    const HINT =
      "'They tell me the gates are open. I would walk out of them tonight, if my hand remembered the sword. Every shadow between here and home knows my face.'"

    /** A game in the courtyard with the servants freed and the chain carried. */
    function createCourtyardGame(freed = true): Game {
      const game = createGame()
      game.state.currentRoom = game.state.allRooms.OuterCourtyard
      game.state.setStoryFlag(FLAG_ACT4_SERVANTS_FREED, freed)
      game.state.addItemToInventory(new GuardiansChain())
      return game
    }

    it('adds the hint after the freed line, every time, chain or not', () => {
      const game = createCourtyardGame()
      const first = executeCommands(game, ['talk to captain'])
      expect(first).toContain('tell him I am sorry I ever doubted him.')
      expect(first).toContain(HINT)
      expect(first.indexOf(HINT)).toBeGreaterThan(first.indexOf('Cedric stood'))
      expectMarkupWellFormed(first)
      game.state.removeItemFromInventory("Guardian's Chain")
      expect(executeCommands(game, ['talk to captain'])).toContain(HINT)
    })

    it('has no hint while he is enthralled', () => {
      const game = createCourtyardGame(false)
      expect(executeCommands(game, ['talk to captain'])).not.toContain('gates')
    })

    it('takes the chain, records Selflessness once and sends him home', () => {
      const game = createCourtyardGame()
      const answer = executeCommands(game, ["give guardian's chain to captain"])
      expect(answer).toContain(
        "You lift the [item_name]Guardian's Chain[/item_name] over the captain's head. Its crystals flare once and settle against his soot-black tabard, and the warmth goes out of your hands.",
      )
      expect(answer).toContain("'You will need this more than I will.'")
      expect(answer).toContain(
        '[/dialogue] He tries to give it back, and when you will not take it, he grips your arm. [dialogue]',
      )
      expect(answer).toContain(
        "'Then I will tell them at home what you did here.'",
      )
      expect(answer).toContain('✦ Selflessness — this will be remembered')
      expect(answer).toContain(
        'He turns toward the gates and walks out without looking back. The shadows draw away from the light at his throat.',
      )
      expect(answer.indexOf('✦')).toBeGreaterThan(answer.indexOf('Then I will'))
      expect(answer.indexOf('He turns')).toBeGreaterThan(answer.indexOf('✦'))
      expectMarkupWellFormed(answer)
      expect(game.state.virtueCount(VIRTUE_SELFLESS)).toBe(1)
      expect(game.state.getStoryFlag(FLAG_ACT4_CHAIN_GIVEN)).toBe(true)
      expect(
        game.state.inventory.some((i) => i instanceof GuardiansChain),
      ).toBe(false)
      expect(executeCommands(game, ['talk to captain'])).toContain(
        "There is no character named '[character_name]captain[/character_name]' here to talk to.",
      )
    })

    it('works the same after the knight is redeemed', () => {
      const game = createCourtyardGame()
      game.state.setStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED, true)
      const answer = executeCommands(game, ["give guardian's chain to captain"])
      expect(answer).toContain('✦ Selflessness')
      expect(game.state.virtueCount(VIRTUE_SELFLESS)).toBe(1)
    })

    it('refuses the chain before he is freed', () => {
      const game = createCourtyardGame(false)
      const answer = executeCommands(game, ["give guardian's chain to captain"])
      expect(answer).toContain(
        'The captain stares through you. His hands do not close on the chain, and you keep it.',
      )
      expectMarkupWellFormed(answer)
      expect(game.state.virtueCount(VIRTUE_SELFLESS)).toBe(0)
      expect(
        game.state.inventory.some((i) => i instanceof GuardiansChain),
      ).toBe(true)
    })

    it('refuses any other item, before and after he is freed', () => {
      const before = createCourtyardGame(false)
      before.state.addItemToInventory(new LoyaltyToken())
      expect(
        executeCommands(before, ['give loyalty token to captain']),
      ).toContain(
        'His hands do not close on the Loyalty Token, and you keep it.',
      )
      const after = createCourtyardGame()
      after.state.addItemToInventory(new LoyaltyToken())
      const answer = executeCommands(after, ['give loyalty token to captain'])
      expect(answer).toContain(
        "[dim]The captain shakes his head. 'Keep it. You will need it more than I will.'[/dim]",
      )
      expect(after.state.virtueCount(VIRTUE_SELFLESS)).toBe(0)
      expect(after.state.inventory.some((i) => i instanceof LoyaltyToken)).toBe(
        true,
      )
    })

    it('says the usual thing when the chain is no longer carried', () => {
      const game = createCourtyardGame()
      game.state.removeItemFromInventory("Guardian's Chain")
      expect(
        executeCommands(game, ["give guardian's chain to captain"]),
      ).toContain("You don't have any")
    })

    it('keeps him gone, the chain given and the moment counted once on reload', () => {
      const game = createCourtyardGame()
      executeCommands(game, ["give guardian's chain to captain"])
      game.loadSaveData(game.toSaveData())
      expect(game.state.getStoryFlag(FLAG_ACT4_CHAIN_GIVEN)).toBe(true)
      expect(game.state.virtueCount(VIRTUE_SELFLESS)).toBe(1)
      expect(executeCommands(game, ['talk to captain'])).toContain(
        "There is no character named '[character_name]captain[/character_name]' here to talk to.",
      )
    })
  })
})
