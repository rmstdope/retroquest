/**
 * Act III's three optional virtue moments: truth to the Pier Warden, mercy to
 * the wandering phantoms and selflessness in mending the dragon's prison.
 */
import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from './Act3'
import { Mira } from './characters/Mira'
import { DragonsScale } from './items/DragonsScale'
import { ResonantChantRubbings } from './items/ResonantChantRubbings'
import {
  FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED,
  FLAG_ACT3_DRAGONS_MEMORY_RECEIVED,
  FLAG_ACT3_DRAGONS_SCALE_ACQUIRED,
  FLAG_ACT3_MAIN_STARTED,
  FLAG_ACT3_POOLS_STILLED,
  FLAG_ACT3_RUINS_LEFT,
  FLAG_ACT3_SEA_SEALED_LETTER_READ,
  VIRTUE_MERCY,
  VIRTUE_SELFLESS,
  VIRTUE_TRUTH,
} from './Act3StoryFlags'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

const REMEMBERED_TRUTH = '✦ Truth — this will be remembered'
const REMEMBERED_MERCY = '✦ Mercy — this will be remembered'
const REMEMBERED_SELFLESS = '✦ Selflessness — this will be remembered'

/** A game standing in the given room. */
function gameIn(roomKey: string): Game {
  const game = new Game([new Act3()])
  game.state.currentRoom = game.state.allRooms[roomKey]
  return game
}

/** Run one command and check the markup of its answer. */
function run(game: Game, command: string): string {
  const answer = game.commandParser.parse(command)
  expectMarkupWellFormed(answer)
  return answer
}

describe('Pier Warden: truth', () => {
  it('gives no question before the curse has shown', () => {
    const game = gameIn('CollapsedPier')
    expect(run(game, 'talk to pier warden')).not.toContain('bad season')
  })

  it('asks his question on the first talk once the letter is read', () => {
    const game = gameIn('CollapsedPier')
    game.state.setStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ, true)
    const answer = run(game, 'talk to pier warden')
    expect(answer).toContain("It's only a bad season, isn't it?")
    expect(answer).toContain('Tell me the sea will mend on its own.')
  })

  it('says the bad-season line once on the next talk, then only usual lines', () => {
    const game = gameIn('CollapsedPier')
    game.state.setStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ, true)
    run(game, 'talk to pier warden')
    const second = run(game, 'talk to pier warden')
    expect(second).toContain("Nothing to say? Then it's a bad season")
    expect(second).not.toContain('Tell me the sea will mend')
    const third = run(game, 'talk to pier warden')
    expect(third).not.toContain('Nothing to say?')
    expect(third).not.toContain('Tell me the sea will mend')
  })

  it('records truth once with the remembered line, then stops asking', () => {
    const game = gameIn('CollapsedPier')
    game.state.setStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ, true)
    run(game, 'talk to pier warden')
    const told = run(game, 'say truth to pier warden')
    expect(told).toContain('You tell')
    expect(told).toContain('Better a hard truth than a soft lie.')
    expect(told).toContain(REMEMBERED_TRUTH)
    expect(told.indexOf('Better a hard truth')).toBeLessThan(
      told.indexOf(REMEMBERED_TRUTH),
    )
    expect(game.state.hasVirtue(VIRTUE_TRUTH)).toBe(true)
    const again = run(game, 'say truth to pier warden')
    expect(again).toContain('The boats are staying in.')
    expect(again).not.toContain('✦')
    const talk = run(game, 'talk to pier warden')
    expect(talk).not.toContain('Tell me the sea will mend')
    expect(talk).not.toContain('Nothing to say?')
  })

  it('records nothing when the truth comes before he has asked', () => {
    const game = gameIn('CollapsedPier')
    const answer = run(game, 'say truth to pier warden')
    expect(answer).toContain('Speak plain.')
    expect(game.state.hasVirtue(VIRTUE_TRUTH)).toBe(false)
  })

  it('still takes the truth after the bad-season line', () => {
    const game = gameIn('CollapsedPier')
    game.state.setStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ, true)
    run(game, 'talk to pier warden')
    run(game, 'talk to pier warden')
    expect(run(game, 'say truth to pier warden')).toContain(REMEMBERED_TRUTH)
  })

  it('is gone once the party has been moved on from the ruins', () => {
    const game = gameIn('CollapsedPier')
    game.state.setStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ, true)
    run(game, 'talk to pier warden')
    game.state.setStoryFlag(FLAG_ACT3_RUINS_LEFT, true)
    const answer = game.commandParser.parse('say truth to pier warden')
    expect(answer).not.toContain('✦')
    expect(game.state.hasVirtue(VIRTUE_TRUTH)).toBe(false)
    expect(run(game, 'talk to pier warden')).not.toContain('Nothing to say?')
  })

  it('other words get the usual reply', () => {
    const game = gameIn('CollapsedPier')
    expect(game.commandParser.parse('say hello to pier warden')).toContain(
      "don't seem to understand",
    )
  })
})

describe('Mira moving the party on from the ruins', () => {
  it('closes the Pier Warden moment', () => {
    const game = gameIn('TidalCauseway')
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.setStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ, true)
    game.state.currentRoom.characters.push(new Mira())
    expect(game.state.getStoryFlag(FLAG_ACT3_RUINS_LEFT)).toBe(false)
    run(game, 'talk to mira')
    expect(game.state.currentRoom.name).toBe('Lower Switchbacks')
    expect(game.state.getStoryFlag(FLAG_ACT3_RUINS_LEFT)).toBe(true)
  })
})

describe('Pier Warden: truth told in an earlier act', () => {
  it('still asks his question and takes the truth', () => {
    const game = gameIn('CollapsedPier')
    game.state.addVirtue(VIRTUE_TRUTH)
    game.state.setStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ, true)
    expect(run(game, 'talk to pier warden')).toContain('Tell me the sea will')
    expect(run(game, 'say truth to pier warden')).toContain(REMEMBERED_TRUTH)
  })
})

describe('Wandering phantoms: mercy', () => {
  it('ends every whisper with the clear word rest', () => {
    const game = gameIn('StillnessVestibule')
    for (let i = 0; i < 6; i++) {
      expect(run(game, 'talk to wandering phantoms')).toContain(
        'one word comes clear, over and over: ',
      )
    }
  })

  it('frees them with rest: fading, remembered line, they leave', () => {
    const game = gameIn('StillnessVestibule')
    const answer = run(game, 'say rest to wandering phantoms')
    expect(answer).toContain('You say rest to the')
    expect(answer).toContain('then they are gone')
    expect(answer).toContain(REMEMBERED_MERCY)
    expect(answer.indexOf('then they are gone')).toBeLessThan(
      answer.indexOf(REMEMBERED_MERCY),
    )
    expect(game.state.hasVirtue(VIRTUE_MERCY)).toBe(true)
    expect(
      game.state.currentRoom.characters.some(
        (c) => c.name === 'wandering phantoms',
      ),
    ).toBe(false)
    expect(run(game, 'say rest to wandering phantoms')).not.toContain('✦')
  })

  it('answers other words with the do-not-answer line', () => {
    const game = gameIn('StillnessVestibule')
    const answer = game.commandParser.parse('say hello to wandering phantoms')
    expect(answer).toContain(
      "The phantoms' whispers rise and fall, and do not answer that.",
    )
    expect(game.state.hasVirtue(VIRTUE_MERCY)).toBe(false)
  })

  /** Chant the rubbings at blessed stones in the vestibule. */
  function chant(game: Game): string {
    run(game, 'cast bless on echo stones')
    game.state.setStoryFlag(FLAG_ACT3_POOLS_STILLED, true)
    const rubbings = new ResonantChantRubbings()
    game.state.addItemToInventory(rubbings)
    return run(game, 'use resonant chant rubbings with echo stones')
  }

  it('the chant after the mercy ends in a settling silence', () => {
    const game = gameIn('StillnessVestibule')
    run(game, 'say rest to wandering phantoms')
    const answer = chant(game)
    expect(answer).toContain(
      'a harmonious silence that settles over the empty chamber.',
    )
    expect(answer).not.toContain('banishes the wandering phantoms')
    expect(game.state.hasVirtue(VIRTUE_MERCY)).toBe(true)
  })

  it('the chant without the mercy banishes them and records nothing', () => {
    const game = gameIn('StillnessVestibule')
    const answer = chant(game)
    expect(answer).toContain('banishes the wandering phantoms')
    expect(game.state.hasVirtue(VIRTUE_MERCY)).toBe(false)
  })
})

describe("Dragon's prison: selflessness", () => {
  /** A game in the Dragon's Hall that has heard the memory. */
  function hall(): Game {
    const game = gameIn('DragonsHall')
    game.state.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)
    return game
  }

  /** Take the scale as the oath would have given it. */
  function takeScale(game: Game): void {
    game.state.currentRoom.addItem(new DragonsScale())
    run(game, 'take scale')
    expect(game.state.getStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED)).toBe(true)
  }

  it('needs nothing from the player before the scale is taken', () => {
    const game = hall()
    const answer = run(game, 'cast bless on sigils')
    expect(answer).toContain('They need nothing from you yet.')
    expect(game.state.hasVirtue(VIRTUE_SELFLESS)).toBe(false)
    expect(run(game, 'look')).not.toContain('hairline crack')
  })

  it('shows the cracked sigils and the price once the scale is taken', () => {
    const game = hall()
    takeScale(game)
    expect(game.state.currentRoom.descriptionFor(game.state)).toMatch(
      /Where the scale lay, the sigils around the dragon have dimmed, and a hairline crack runs through the nearest ring\.$/,
    )
    const talk = run(game, 'talk to ancient dragon')
    expect(talk).toContain('That is the price, and it is mine to pay')
    expect(talk).not.toContain('The scale awaits')
  })

  it('mending records selflessness once and steadies room and dragon', () => {
    const game = hall()
    takeScale(game)
    const answer = run(game, 'cast bless on sigils')
    expect(answer).toContain('You cast')
    expect(answer).toContain('brighten, steady, and hold.')
    expect(answer).toContain(
      'You said you would return what you took. Most forget by the time ' +
        'they reach the door. Your parents would have done the same.',
    )
    expect(answer).not.toContain('You owed me nothing')
    expect(answer).toContain(REMEMBERED_SELFLESS)
    expect(answer.indexOf('Your parents would')).toBeLessThan(
      answer.indexOf(REMEMBERED_SELFLESS),
    )
    expect(game.state.hasVirtue(VIRTUE_SELFLESS)).toBe(true)
    expect(game.state.currentRoom.descriptionFor(game.state)).toMatch(
      /The sigils around the dragon burn steady and whole again\.$/,
    )
    expect(run(game, 'talk to ancient dragon')).toContain(
      'Go with my blessing, young one. The prison holds.',
    )
    const second = run(game, 'cast bless on sigils')
    expect(second).toContain('There is nothing left to mend.')
    expect(second).not.toContain('✦')
  })
})

describe('virtues are remembered', () => {
  it('survive a save/load round-trip and the move into the next act', () => {
    const game = gameIn('StillnessVestibule')
    run(game, 'say rest to wandering phantoms')
    game.state.addVirtue(VIRTUE_TRUTH)
    game.state.addVirtue(VIRTUE_SELFLESS)
    const fresh = new Game([new Act3()])
    fresh.loadSaveData(game.toSaveData())
    expect(fresh.state.virtues).toEqual([
      VIRTUE_MERCY,
      VIRTUE_TRUTH,
      VIRTUE_SELFLESS,
    ])
  })
})
