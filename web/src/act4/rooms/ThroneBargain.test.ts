import { describe, it, expect } from 'vitest'
import { Game, dialogue } from '@/engine'
import { Act4 } from '../Act4'
import { ACT4_GOLDEN_PATH } from '../Act4GoldenPath'
import { farewell } from '../endings'
import { FLAG_ACT4_THRONE_BARGAIN_SEEN } from '../Act4StoryFlags'
import {
  executeCommands,
  expectItemInInventory,
  expectStoryFlag,
} from '@/testing/gameHelpers'

/** A game in the Throne Chamber, before the offer is heard. */
function inThrone(): Game {
  const game = new Game([new Act4()])
  const talk = ACT4_GOLDEN_PATH.indexOf('talk to malakar')
  executeCommands(game, ACT4_GOLDEN_PATH.slice(0, talk))
  return game
}

/** A game where Malakar has made his offer. */
function offered(): Game {
  const game = inThrone()
  executeCommands(game, ['talk to malakar'])
  return game
}

const BARGAIN = [
  "Malakar's hand closes on the amulet, and for a moment neither of you lets go. Then you do.",
  "He lifts it toward the thread of light that bleeds from the king's crown. The wound in the air yawns wide, and the chamber goes grey, and then gold.",
  '[breath]A workshop in the late sun. Aren bends over the workbench; Lysa laughs at something he has said. They are young. They do not look up.[/breath]',
  dialogue('Shadow of the Past', 'Not like this. Not by force.'),
  'The amulet will not break. The light runs backwards through the chamber and Malakar is thrown against the throne. You are standing where you stood, and the amulet is warm in your hand.',
  dialogue('Malakar', 'You saw. Then you know I was not lying.'),
].join('\n')

const AGAIN =
  '[dim]Malakar does not reach for it. He has seen what it will not do.[/dim]'

const AFTER_TALK = dialogue(
  'Malakar',
  'It would not break for me. Perhaps it would for you.',
)

const LYSA_LINE = dialogue(
  'Lysa',
  'We saw you at the workbench with us, for a moment. You let it go. That was the bravest thing you did today.',
)

describe('the Bargain', () => {
  it('is not offered before Malakar has been talked to', () => {
    const game = inThrone()
    expect(executeCommands(game, ['give amulet to malakar'])).toContain(
      'Your mother and father told him no once, in a letter. It did not stop him.',
    )
    expect(game.state.getStoryFlag(FLAG_ACT4_THRONE_BARGAIN_SEEN)).toBe(false)
  })

  it('plays once in order, keeps the amulet and records itself', () => {
    const game = offered()
    expect(executeCommands(game, ['give amulet to malakar'])).toBe(BARGAIN)
    expectStoryFlag(game.state, FLAG_ACT4_THRONE_BARGAIN_SEEN, true)
    expectItemInInventory(game.state, 'ancient amulet')
  })

  it('gives a dim line instead of replaying', () => {
    const game = offered()
    executeCommands(game, ['give amulet to malakar'])
    expect(executeCommands(game, ['give amulet to malakar'])).toBe(AGAIN)
  })

  it('gives Malakar a new line to talk to, until the refrain', () => {
    const game = offered()
    executeCommands(game, ['give amulet to malakar'])
    expect(executeCommands(game, ['talk to malakar'])).toBe(AFTER_TALK)
    expect(executeCommands(game, ['talk to malakar'])).toBe(AFTER_TALK)
    executeCommands(game, ['say refrain to malakar'])
    expect(executeCommands(game, ['talk to malakar'])).toContain(
      'Then show me what they left you.',
    )
  })

  it('leaves giving unchanged once the refrain is said', () => {
    const game = offered()
    executeCommands(game, ['say refrain to malakar'])
    const out = executeCommands(game, ['give amulet to malakar'])
    expect(out).not.toContain('workshop')
    expect(game.state.getStoryFlag(FLAG_ACT4_THRONE_BARGAIN_SEEN)).toBe(false)
  })

  it('keeps the burn scene for raising the amulet, in either order', () => {
    const burn = 'it burns white'
    const raisedFirst = offered()
    expect(executeCommands(raisedFirst, ['use amulet on malakar'])).toContain(
      burn,
    )
    expect(executeCommands(raisedFirst, ['give amulet to malakar'])).toBe(
      BARGAIN,
    )
    const givenFirst = offered()
    executeCommands(givenFirst, ['give amulet to malakar'])
    expect(executeCommands(givenFirst, ['use amulet on malakar'])).toContain(
      burn,
    )
  })

  it('survives a save and load', () => {
    const game = offered()
    executeCommands(game, ['give amulet to malakar'])
    const loaded = new Game([new Act4()])
    expect(loaded.loadSaveData(game.toSaveData())).toContain(
      'Game loaded successfully.',
    )
    expectStoryFlag(loaded.state, FLAG_ACT4_THRONE_BARGAIN_SEEN, true)
    expectItemInInventory(loaded.state, 'ancient amulet')
    expect(executeCommands(loaded, ['give amulet to malakar'])).toBe(AGAIN)
    expect(executeCommands(loaded, ['talk to malakar'])).toBe(AFTER_TALK)
  })
})

describe('Lysa in the farewell', () => {
  const WATCHED =
    'We watched over you all this time, from inside the light. We could not hold you, but we could hold the door shut.'

  it('says the extra line after her own in every ending, only if seen', () => {
    for (const ending of ['redemption', 'justice', 'sacrifice'] as const) {
      const game = offered()
      const without = farewell(ending, game.state)
      expect(without).not.toContain('bravest thing you did today')
      executeCommands(game, ['give amulet to malakar'])
      const seen = farewell(ending, game.state)
      expect(seen).toContain(`${dialogue('Lysa', WATCHED)}\n${LYSA_LINE}`)
    }
  })

  it('reaches the played Redemption ending', () => {
    const game = new Game([new Act4()])
    const talk = ACT4_GOLDEN_PATH.indexOf('talk to malakar')
    const ending = ACT4_GOLDEN_PATH.indexOf('cast forgiveness on wound')
    executeCommands(game, ACT4_GOLDEN_PATH.slice(0, talk + 1))
    executeCommands(game, ['give amulet to malakar'])
    executeCommands(game, ACT4_GOLDEN_PATH.slice(talk + 1, ending))
    const out = executeCommands(game, [ACT4_GOLDEN_PATH[ending]])
    expect(out).toContain(LYSA_LINE)
  })
})
