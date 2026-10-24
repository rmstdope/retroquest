import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from './Act1'
import { ACT1_GOLDEN_PATH } from './Act1GoldenPath'
import { executeCommands } from '@/testing/gameHelpers'

/** The grey lines Act I still shows: markers, never a repeat of the command. */
const ALLOWED_EVENT = /^(You take |You are in |✦ |Game (saved|loaded) )/

/** Play the golden path and keep each command with its answer. */
function playGoldenPath(): { command: string; answer: string }[] {
  const game = new Game([new Act1()])
  return ACT1_GOLDEN_PATH.map((command) => ({
    command,
    answer: executeCommands(game, [command]),
  }))
}

describe('Act 1 narrates effects and never echoes the command', () => {
  const turns = playGoldenPath()
  const all = turns.map((t) => t.answer).join('\n')

  it('keeps only marker lines as grey event lines along the golden path', () => {
    for (const { command, answer } of turns) {
      for (const line of answer.split('\n')) {
        const inner = /^\[event\](.*)\[\/event\]$/.exec(line)?.[1]
        if (inner === undefined) continue
        const plain = inner.replace(/\[[^\]]+\]/g, '')
        expect(plain, `after "${command}"`).toMatch(ALLOWED_EVENT)
      }
    }
  })

  it('never opens a line with a repeat of what the player did', () => {
    const echo =
      /(^|\n)(You (use|cast|speak|move|examine|give|offer|listen|light|open|till|try|study|attach|pour|walk the rows)\b)/
    for (const { command, answer } of turns) {
      expect(answer, `after "${command}"`).not.toMatch(echo)
    }
  })

  it('says what happened in the agreed words', () => {
    for (const phrase of [
      'The ground is tough, and you unearth a small, tarnished',
      'clamps onto the end of the [item_name]fishing rod[/item_name]',
      'lashes onto the [item_name]magnetic fishing rod[/item_name]',
      'fall away under the sharp',
      'The murky water shimmers and clears!',
      'You now carry the [item_name]Ancient Amulet[/item_name].',
    ]) {
      expect(all).toContain(phrase)
    }
  })
})
