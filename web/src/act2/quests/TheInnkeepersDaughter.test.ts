import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { ACT2_GOLDEN_PATH } from '../Act2GoldenPath'
import { QUEST_INNKEEPERS_DAUGHTER } from '../Act2StoryFlags'
import { pathIndex, playPath } from '../../testing/gameHelpers'

/** A word of the command line, which a hint never names. */
const COMMAND_WORD = /\b(use|cast|talk|give|take|go|hint|look|examine)\b/i

/** A game played along the golden path up to, not including, `command`. */
function playedTo(command: string): Game {
  const game = new Game([new Act2()])
  playPath(game, ACT2_GOLDEN_PATH, 0, pathIndex(ACT2_GOLDEN_PATH, command))
  return game
}

/** The hint the quest gives in a game, checked never to name a command. */
function hint(game: Game): string {
  const text =
    game.state.getQuest(QUEST_INNKEEPERS_DAUGHTER)?.hint(game.state) ?? ''
  expect(text).not.toMatch(COMMAND_WORD)
  return text
}

describe("The Innkeeper's Daughter log", () => {
  it('gives the opening before Lyria has explained the curse', () => {
    const game = playedTo('talk to master healer lyria')
    expect(hint(game)).toContain('nobody can say who laid it')
  })

  it('records the cure order once Lyria has explained it', () => {
    const game = playedTo('give healing herbs to master healer lyria')
    const log =
      game.state.getQuest(QUEST_INNKEEPERS_DAUGHTER)?.description ?? ''
    expect(log).toMatch(/healing.*untouched water.*unbinding/s)
    expect(hint(game)).toContain('made strong')
  })

  it('moves on to the water after greater heal shows the mask', () => {
    const game = playedTo('use crystal-clear water with barmaid elena')
    const quest = game.state.getQuest(QUEST_INNKEEPERS_DAUGHTER)
    expect(quest?.description).toContain('silver mask')
    expect(hint(game)).toContain('untouched water')
  })

  it('moves on to the unbinding after the water', () => {
    const game = playedTo('cast dispel on barmaid elena')
    expect(hint(game)).toContain('unbound')
  })

  it('keeps its progress through a save and load', () => {
    const game = playedTo('cast dispel on barmaid elena')
    const loaded = new Game([new Act2()])
    loaded.loadSaveData(game.toSaveData())
    const quest = loaded.state.getQuest(QUEST_INNKEEPERS_DAUGHTER)
    expect(quest?.hint(loaded.state)).toBe(hint(game))
    expect(quest?.description).toContain('silver mask')
  })
})
