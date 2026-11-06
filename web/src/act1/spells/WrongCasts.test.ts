import { describe, expect, it } from 'vitest'
import { clue, Game } from '@/engine'
import { executeCommands, expectMarkupWellFormed } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import {
  FLAG_JOURNEY_BLESS_COMPLETED,
  FLAG_MAGIC_FULLY_UNLOCKED,
  FLAG_VEGETABLE_FIELD_WATERED,
  FLAG_WELL_EXAMINED,
} from '../Act1StoryFlags'
import { Bucket } from '../items/Bucket'
import { BlessSpell } from './BlessSpell'
import { PurifySpell } from './PurifySpell'
import { ReviveSpell } from './ReviveSpell'

/**
 * The natural wrong casts at Act I's puzzles (rq-miya): each gets a reply
 * that says something true in-world and points the right way (Puzzle Rule 2),
 * and the natural ways of naming Elior count for bless.
 */

/** An Act I game with revive, purify and bless known and magic unlocked, in `roomKey`. */
function awakeIn(roomKey: string): Game {
  const game = new Game([new Act1()])
  game.state.setStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED, true)
  for (const spell of [new ReviveSpell(), new PurifySpell(), new BlessSpell()])
    game.state.learnSpell(spell)
  game.state.currentRoom = game.state.allRooms[roomKey]
  return game
}

/** The same game with a bucket of water drawn from the well as it stands. */
function withDrawnBucket(game: Game): Game {
  const bucket = new Bucket()
  game.state.addItemToInventory(bucket)
  const room = game.state.currentRoom
  game.state.currentRoom = game.state.allRooms.VillageWell
  executeCommands(game, ['use bucket with well'])
  game.state.currentRoom = room
  return game
}

const REVIVE_CROPS = clue(
  'The warmth runs into the leaves and straight back out again. ' +
    'These crops are not gone, only thirsty; what they are calling for is ' +
    'water.',
)
const PURIFY_BUCKET = clue(
  'The water in the bucket clears for a breath, then clouds again from the ' +
    'bottom up. The sourness came up with it from the well, and that is ' +
    'where it lives.',
)

describe('wrong casts at Act I puzzles', () => {
  it.each(['crops', 'rows'])(
    'says the %s are thirsty, not gone, to revive',
    (target) => {
      const game = awakeIn('VegetableField')
      const text = executeCommands(game, [`cast revive on ${target}`])
      expect(text).toBe(REVIVE_CROPS)
      expect(game.state.getStoryFlag(FLAG_VEGETABLE_FIELD_WATERED)).toBe(false)
    },
  )

  it('says the watered crops have nothing to call back', () => {
    const game = awakeIn('VegetableField')
    game.state.setStoryFlag(FLAG_VEGETABLE_FIELD_WATERED, true)
    const text = executeCommands(game, ['cast revive on crops'])
    expect(text).toBe(
      '[failure]The crops are green and standing; there is nothing in them ' +
        'to call back.[/failure]',
    )
  })

  it('says the sour bucket water comes from the well, to purify', () => {
    const game = withDrawnBucket(awakeIn('VegetableField'))
    const text = executeCommands(game, ['cast purify on bucket'])
    expect(text).toBe(PURIFY_BUCKET)
    expect(
      game.state.inventory.find((i) => i instanceof Bucket)?.description,
    ).toContain('murky')
  })

  it('says a bucket of clear water is already clean', () => {
    const game = awakeIn('VillageWell')
    game.state.setStoryFlag(FLAG_WELL_EXAMINED, true)
    executeCommands(game, ['cast purify on well'])
    withDrawnBucket(game)
    const text = executeCommands(game, ['cast purify on bucket'])
    expect(text).toBe(
      '[failure]The water in the [item_name]bucket[/item_name] is already ' +
        'clear.[/failure]',
    )
  })

  it('says the empty bucket has nothing in it to cleanse', () => {
    const game = awakeIn('VillageWell')
    game.state.addItemToInventory(new Bucket())
    const text = executeCommands(game, ['cast purify on bucket'])
    expect(text).toBe(
      '[failure]The [item_name]bucket[/item_name] is empty; there is ' +
        'nothing in it to cleanse.[/failure]',
    )
  })

  it.each(['me', 'myself', 'Elior', 'elior'])(
    'counts cast bless on %s as blessing Elior',
    (target) => {
      const game = awakeIn('VillageSquare')
      const text = executeCommands(game, [`cast bless on ${target}`])
      expect(text).toBe(
        executeCommands(awakeIn('VillageSquare'), ['cast bless']),
      )
      expect(game.state.getStoryFlag(FLAG_JOURNEY_BLESS_COMPLETED)).toBe(true)
    },
  )

  it('writes every reply in well-formed markup', () => {
    for (const line of [REVIVE_CROPS, PURIFY_BUCKET]) {
      expectMarkupWellFormed(line)
    }
  })
})
