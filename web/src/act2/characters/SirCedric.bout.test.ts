import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { MendSpell } from '../spells/MendSpell'
import { TrainingSword } from '../items/TrainingSword'
import { SirCedric } from './SirCedric'
import {
  FLAG_DEMONSTRATED_COMBAT_SKILLS,
  FLAG_SPOKEN_TO_SIR_CEDRIC,
} from '../Act2StoryFlags'
import {
  executeCommands,
  expectItemInInventory,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

const REMINDER =
  '(Answer him with: say strike, say guard or say turn to Sir Cedric.)'
const HIGH_CUT = 'He raises his blade high over his left shoulder. High cut!'
const LUNGE = 'He drives straight at your middle. Lunge!'
const WELL = 'He swings wide and leaves his chest open. Well?'

/** A game with Elior in the courtyard carrying the sword; the bout not yet begun. */
function courtyardGame(): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom = game.state.allRooms.CastleCourtyard
  game.state.addItemToInventory(new TrainingSword())
  game.state.setStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC, true)
  game.state.settleQuests()
  return game
}

/** Run commands and return the answers with the markup tags removed. */
function run(game: Game, commands: string[]): string {
  return executeCommands(game, commands).replace(/\[\/?[a-z_]+\]/g, '')
}

/** Begin the bout and return the opening text. */
function begin(game: Game): string {
  return run(game, ['use training sword'])
}

function cedric(game: Game): SirCedric {
  const found = game.state.allRooms.CastleCourtyard.characters.find(
    (c) => c instanceof SirCedric,
  )
  if (!(found instanceof SirCedric)) throw new Error('no Cedric')
  return found
}

describe("The Knight's Test bout", () => {
  it('opens with the recognition, the rules, the reminder and the first attack', () => {
    const game = courtyardGame()
    const out = begin(game)

    expect(out).toContain('Show me what he taught you, then.')
    expect(out).toContain(
      'He takes a practice blade from the rack and squares off against you.',
    )
    expect(out).toContain('Three forms, the way he drilled them.')
    expect(out).toContain(REMINDER)
    expect(out).toContain('raises his blade high over his left shoulder.')
    expect(out.trimEnd().endsWith('High cut!')).toBe(true)
    expect(out).not.toContain('perform a series of combat forms')
    expectItemInInventory(game.state, 'training sword')
    expect(game.state.getStoryFlag(FLAG_DEMONSTRATED_COMBAT_SKILLS)).toBe(false)
  })

  it.each([
    ['strike', 'You step aside too late', HIGH_CUT],
    ['turn', 'You step aside too late', HIGH_CUT],
  ])('repeats call 1 on a wrong %s', (word, narration, repeat) => {
    const game = courtyardGame()
    begin(game)
    const out = run(game, [`say ${word} to sir cedric`])
    expect(out).toContain(narration)
    expect(out).toContain('Dead, if this were steel. Again.')
    expect(out).toContain(repeat)
    expect(out.trimEnd().endsWith(REMINDER)).toBe(true)
  })

  it('walks the three right answers to the praise and the Nyx speech', () => {
    const game = courtyardGame()
    begin(game)
    const one = run(game, ['say guard to sir cedric'])
    expect(one).toContain('his blade rings off it.')
    expect(one).toContain('Lunge!')
    expect(one).not.toContain(REMINDER)
    const two = run(game, ['say turn to sir cedric'])
    expect(two).toContain('his point slides past your ribs.')
    expect(two).toContain('Well?')
    const three = run(game, ['say strike to sir cedric'])
    expect(three).toContain('You tap his chest with the flat of the blade.')
    expect(three).toContain('lowers his blade and nods approvingly.')
    expect(three).toContain('Excellent! Your martial training is evident.')
    expect(three).toContain('He pauses, his expression growing more serious.')
    expect(three).toContain('forest survival kit')
    expect(game.state.getStoryFlag(FLAG_DEMONSTRATED_COMBAT_SKILLS)).toBe(true)
    expectItemInInventory(game.state, 'training sword', false)
    expect(game.state.isQuestCompleted("The Knight's Test")).toBe(true)
  })

  it('answers each wrong form on calls 2 and 3 and repeats the same attack', () => {
    const game = courtyardGame()
    begin(game)
    run(game, ['say guard to sir cedric'])
    for (const word of ['strike', 'guard']) {
      const out = run(game, [`say ${word} to sir cedric`])
      expect(out).toContain('his point slides under it')
      expect(out).toContain("You can't block a lunge with hope. Again.")
      expect(out).toContain(LUNGE)
      expect(out.trimEnd().endsWith(REMINDER)).toBe(true)
    }
    run(game, ['say turn to sir cedric'])
    for (const word of ['guard', 'turn']) {
      const out = run(game, [`say ${word} to sir cedric`])
      expect(out).toContain('the opening closes before you move.')
      expect(out).toContain('I gave you a door and you stood in it. Again.')
      expect(out).toContain(WELL)
      expect(out.trimEnd().endsWith(REMINDER)).toBe(true)
    }
  })

  it('accepts the answer in any case with trailing punctuation', () => {
    const game = courtyardGame()
    begin(game)
    expect(run(game, ['say GUARD! to sir cedric'])).toContain('Lunge!')
  })

  it('repeats the attack, without the reminder, on any other word', () => {
    const game = courtyardGame()
    begin(game)
    const out = run(game, ['say hello to sir cedric'])
    expect(out).toContain('Strike, guard or turn, Elior.')
    expect(out).toContain(HIGH_CUT)
    expect(out).not.toContain(REMINDER)
  })

  it('refuses a talk mid-bout and repeats the attack', () => {
    const game = courtyardGame()
    begin(game)
    const out = run(game, ['talk to sir cedric'])
    expect(out).toContain('Talk after.')
    expect(out).toContain(HIGH_CUT)
    expect(out).not.toContain('Greetings, traveler')
  })

  it('ends the bout at once on any known spell, naming it', () => {
    const game = courtyardGame()
    game.state.knownSpells.push(new MendSpell())
    begin(game)
    const out = run(game, ['cast mend on sir cedric'])
    expect(out).toContain('answer with mend instead.')
    expect(out).toContain('A mage.')
    expect(out).toContain('He pauses, his expression growing more serious.')
    expect(game.state.getStoryFlag(FLAG_DEMONSTRATED_COMBAT_SKILLS)).toBe(true)
    expectItemInInventory(game.state, 'training sword', false)
    expect(game.state.isQuestCompleted("The Knight's Test")).toBe(true)
  })

  it('leaves a spell cast before the bout, and after the test, as it was', () => {
    const game = courtyardGame()
    game.state.knownSpells.push(new MendSpell())
    const before = run(game, ['cast mend on sir cedric'])
    expect(before).not.toContain('A mage.')
    expect(before).toContain('the spell fizzles')
    expect(game.state.getStoryFlag(FLAG_DEMONSTRATED_COMBAT_SKILLS)).toBe(false)

    begin(game)
    executeCommands(game, [
      'say guard to sir cedric',
      'say turn to sir cedric',
      'say strike to sir cedric',
    ])
    expect(run(game, ['cast mend on sir cedric'])).not.toContain('A mage.')
  })

  it('gives his ordinary reply to the forms once the test is passed', () => {
    const game = courtyardGame()
    begin(game)
    executeCommands(game, [
      'say guard to sir cedric',
      'say turn to sir cedric',
      'say strike to sir cedric',
    ])
    const out = game.commandParser.parse('say guard to sir cedric')
    expect(out).toContain("don't seem to understand")
    expect(out).not.toContain('High cut')
  })

  it('restarts from the first attack, without the recognition, after leaving', () => {
    const game = courtyardGame()
    begin(game)
    run(game, ['say guard to sir cedric'])
    run(game, ['go north', 'go south'])
    const out = run(game, ['use training sword'])
    expect(out).toContain('takes up his practice blade again.')
    expect(out).toContain('From the top, then. Strike, guard or turn.')
    expect(out).toContain(HIGH_CUT)
    expect(out.trimEnd().endsWith(REMINDER)).toBe(true)
    expect(out).not.toContain('That notch by the guard')
    expect(cedric(game).boutCall).toBe(1)
  })

  it('repeats the current attack when the sword is used again mid-bout', () => {
    const game = courtyardGame()
    begin(game)
    run(game, ['say guard to sir cedric'])
    const out = run(game, ['use training sword'])
    expect(out).toContain('He drives straight at your middle.')
    expect(out).toContain('Lunge!')
    expect(out).not.toContain('From the top')
    expect(out.trimEnd().endsWith(REMINDER)).toBe(true)
    expect(cedric(game).boutCall).toBe(2)
  })

  it('keeps the call across a save made mid-bout, and restarts after leaving', () => {
    const game = courtyardGame()
    begin(game)
    run(game, ['say guard to sir cedric'])
    const loaded = new Game([new Act2()])
    expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')

    const wrong = run(loaded, ['say guard to sir cedric'])
    expect(wrong).toContain(LUNGE)
    expectMarkupWellFormed(wrong)

    const again = new Game([new Act2()])
    again.loadSaveData(game.toSaveData())
    run(again, ['go north', 'go south'])
    expect(run(again, ['use training sword'])).toContain('From the top, then.')
  })
})
