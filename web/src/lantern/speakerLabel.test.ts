import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '@/act1/Act1'
import { ACT1_GOLDEN_PATH } from '@/act1/Act1GoldenPath'
import { Act2 } from '@/act2/Act2'
import { ACT2_GOLDEN_PATH } from '@/act2/Act2GoldenPath'
import { Act3 } from '@/act3/Act3'
import { ACT3_GOLDEN_PATH } from '@/act3/Act3GoldenPath'
import { parseTurn } from './parseTurn'

/**
 * Play a golden path and return every text block the story view would show
 * directly before a labelled quote.
 */
function textBeforeQuotes(game: Game, path: string[]): string[] {
  const found: string[] = []
  for (const command of path) {
    const blocks = parseTurn(game.commandParser.parse(command))
    game.state.settleQuests()
    blocks.forEach((block, index) => {
      const next = blocks[index + 1]
      if (block.kind === 'text' && next?.kind === 'dialogue')
        found.push(block.markup)
    })
  }
  return found
}

/** A line holding only "Name:" must never survive in front of its quote. */
const NAME_COLON = /^\[character_name\][^[]*\[\/character_name\]:$/

describe('speaker names in the story view', () => {
  it.each([
    ['Act 1', () => new Game([new Act1()]), ACT1_GOLDEN_PATH],
    ['Act 2', () => new Game([new Act2()]), ACT2_GOLDEN_PATH],
    ['Act 3', () => new Game([new Act3()]), ACT3_GOLDEN_PATH],
  ])('%s shows no "Name:" line before a labelled quote', (_act, make, path) => {
    const lines = textBeforeQuotes(make(), path)
    expect(lines.filter((line) => NAME_COLON.test(line))).toEqual([])
  })
})
