import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { ACT2_GOLDEN_PATH } from '../Act2GoldenPath'
import { QUEST_LOST_CARAVAN } from '../Act2StoryFlags'
import { pathIndex, playPath } from '../../testing/gameHelpers'

/** A word of the command line, which a hint never names. */
const COMMAND_WORD = /\b(use|cast|talk|give|take|go|hint|look|examine)\b/i

/** A game played along the golden path up to, not including, `command`. */
function playedTo(command: string, occurrence = 1): Game {
  const game = new Game([new Act2()])
  const to = pathIndex(ACT2_GOLDEN_PATH, command, occurrence)
  playPath(game, ACT2_GOLDEN_PATH, 0, to)
  return game
}

/** The hint the quest gives in a game. */
function hint(game: Game): string | null {
  return game.state.getQuest(QUEST_LOST_CARAVAN)?.hint(game.state) ?? null
}

describe("The Merchant's Lost Caravan log", () => {
  it('asks after the merchants before the rescue', () => {
    const game = playedTo('use quality rope with ravine')
    expect(hint(game)).toContain('Find out what happened to the merchants')
  })

  it('sends the player back to Thorne after the rescue', () => {
    const game = playedTo('talk to caravan master thorne', 2)
    const text = hint(game)
    expect(text).toContain('Thorne')
    expect(text).toContain('Market District')
    expect(text).not.toContain('Find out what happened')
    expect(text).not.toMatch(COMMAND_WORD)
  })

  it('keeps the opening as the earlier entry', () => {
    const game = playedTo('talk to caravan master thorne', 2)
    const details = game.state.getQuest(QUEST_LOST_CARAVAN)?.details()
    expect(details?.kind).toBe('journal')
    if (details?.kind !== 'journal') return
    expect(details.earlier.join('')).toContain('Find out what happened')
  })

  it('keeps the rescue in the log through a save and load', () => {
    const game = playedTo('talk to caravan master thorne', 2)
    const loaded = new Game([new Act2()])
    loaded.loadSaveData(game.toSaveData())
    expect(hint(loaded)).toBe(hint(game))
  })
})
