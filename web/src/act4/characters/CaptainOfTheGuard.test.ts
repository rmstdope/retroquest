import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { GuardiansChain } from '../items/GuardiansChain'
import { LoyaltyToken } from '../items/LoyaltyToken'
import { FLAG_ACT4_CHAIN_GIVEN, VIRTUE_SELFLESS } from '../Act4StoryFlags'
import { Act4 } from '../Act4'
import {
  FLAG_ACT4_CAPTAIN_APOLOGY_HEARD,
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
    expect(answer).toContain(
      "[dialogue]I kept King Alden's gate once. Now I keep it for... I cannot remember.[/dialogue]",
    )
    expect(answer).not.toContain('I held the gate')
    expectDialogueSpeaker(answer, SPEAKER)
    expectMarkupWellFormed(answer)
  })

  it('is described as he is: blind while enthralled, his hand restless once freed', () => {
    const game = createGame()
    const captain = new CaptainOfTheGuard()
    expect(captain.examine(game.state)).toContain('see nothing')
    game.state.setStoryFlag(FLAG_ACT4_SERVANTS_FREED, true)
    const freed = captain.examine(game.state)
    expect(freed).toBe(
      'A captain of the royal guard, his tabard black with soot. He sits among the servants, opening and closing his sword hand as if it belonged to someone else.',
    )
    expect(freed).not.toContain('see nothing')
  })

  it('records that Elior heard his apology for Sir Cedric, only once freed', () => {
    const game = createGame()
    const captain = new CaptainOfTheGuard()
    captain.talkTo(game.state)
    expect(game.state.getStoryFlag(FLAG_ACT4_CAPTAIN_APOLOGY_HEARD)).toBe(false)
    game.state.setStoryFlag(FLAG_ACT4_SERVANTS_FREED, true)
    captain.talkTo(game.state)
    expect(game.state.getStoryFlag(FLAG_ACT4_CAPTAIN_APOLOGY_HEARD)).toBe(true)
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
      "[dialogue]I remember now. King Alden used to walk the walls at night and talk to whoever was on them. That is how they got him. Cedric stood his post. They came in by the king's postern, and it had been left unguarded. If you see Sir Cedric again, tell him I am sorry I ever doubted him.[/dialogue]",
    )
    expect(answer).not.toContain('shadows that came for Alden')
    expect(answer).not.toContain('man in grey')
    expect(game.state.getStoryFlag(FLAG_ACT4_CAPTAIN_MAN_IN_GREY_TOLD)).toBe(
      false,
    )
  })

  describe('after the knight is redeemed', () => {
    const MAN_IN_GREY =
      'A man in grey came through here while you were gone. He knelt by me and asked my name. I told him.'

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
      expect(first).toContain('[dialogue]I remember now.')
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
      '[dialogue]They tell me the gates are open. I would walk out of them tonight, if my hand remembered the sword. Every shadow between here and home knows my face.[/dialogue]'

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
        "You lift the [item_name]guardian's chain[/item_name] over the captain's head. Its crystals flare once and settle against his soot-black tabard, and the warmth goes out of your hands.",
      )
      expect(answer).toContain(
        'puts a hand to the chain. [dialogue]You will need this more than I will.[/dialogue]',
      )
      expect(answer).toContain(
        '[/dialogue] He tries to give it back, and when you will not take it, he grips your arm. [dialogue]',
      )
      expect(answer).toContain(
        '[dialogue]Then I will tell them at home what you did here.[/dialogue]',
      )
      expect(answer).not.toContain('answers.')
      expect(answer).toContain('✦ Selflessness — this will be remembered')
      expect(answer).toContain(
        'He turns toward the gates. The shadows draw away from the light at his throat, and at the arch he lifts a hand to you before he goes.',
      )
      expect(answer).not.toContain('without looking back')
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
        'The captain stares through you. His hands do not close on it, and you keep it.',
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
      ).toContain('His hands do not close on it, and you keep it.')
      const after = createCourtyardGame()
      after.state.addItemToInventory(new LoyaltyToken())
      const answer = executeCommands(after, ['give loyalty token to captain'])
      expect(answer).toContain(
        '[failure][clue]The [character_name]Captain of the Guard[/character_name] pushes it back into your hands.[/clue][/failure]',
      )
      expect(answer).toContain(
        '[dialogue]That will not get me past a shadow.[/dialogue]',
      )
      expect(answer).not.toContain('shakes his head')
      expectMarkupWellFormed(answer)
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
      ).toContain("You don't have a 'guardian's chain'")
    })

    it('keeps him gone, the chain given and the moment counted once on reload', () => {
      const game = createCourtyardGame()
      executeCommands(game, ["give guardian's chain to captain"])
      game.loadSaveData(game.toSaveData())
      expect(executeCommands(game, ['look'])).not.toContain('captain')
      expect(game.state.getStoryFlag(FLAG_ACT4_CHAIN_GIVEN)).toBe(true)
      expect(game.state.virtueCount(VIRTUE_SELFLESS)).toBe(1)
      expect(executeCommands(game, ['talk to captain'])).toContain(
        "There is no character named '[character_name]captain[/character_name]' here to talk to.",
      )
    })
  })
})
