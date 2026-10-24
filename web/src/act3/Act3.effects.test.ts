import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import { parseTurn } from '@/lantern/parseTurn'
import { Act3 } from './Act3'
import {
  FLAG_ACT3_DRAGONS_MEMORY_RECEIVED,
  FLAG_ACT3_OATH_SCROLLS_EXAMINED,
} from './Act3StoryFlags'
import { AncientDragon } from './characters/AncientDragon'

/** Every non-test TypeScript file under `dir`, recursively. */
function contentFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return contentFiles(path)
    return path.endsWith('.ts') && !path.endsWith('.test.ts') ? [path] : []
  })
}

/** Act III answers narrate their effect: no echo of the command is written. */
describe('Act III effects', () => {
  it('writes no grey event line: only the engine keeps those markers', () => {
    const offenders = contentFiles(__dirname).filter((file) =>
      /\bevent\(/.test(readFileSync(file, 'utf8')),
    )
    expect(offenders).toEqual([])
  })

  it('never opens an answer by repeating the typed command', () => {
    // Exempt, as effects rather than echoes: "You give her the dragon's
    // words." (Mira's relay answers `talk to mira`), "You recite the resonant
    // chant at each stone." (`use rubbings with echo stones`) and "You stand
    // still and count." (`rest` or `wait` in the warded passages).
    const echo =
      /['"`](You (speak with|say|cast|examine|give(?! her the dragon's words)|recite(?! the resonant chant at each stone)|daub|stand still(?! and count)|arrive at|unfold|offer|study|seat|combine|wedge|bind|hammer)\b)/
    const offenders = contentFiles(__dirname).filter((file) =>
      echo.test(readFileSync(file, 'utf8')),
    )
    expect(offenders).toEqual([])
  })

  it('narrates the oath Elior speaks, then labels the dragon’s answer from it', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)
    game.state.setStoryFlag(FLAG_ACT3_OATH_SCROLLS_EXAMINED, true)
    const blocks = parseTurn(new AncientDragon().sayTo(game.state, 'it'))
    expect(blocks.map((block) => block.kind)).toEqual(['text', 'dialogue'])
    expect(JSON.stringify(blocks[0])).toContain(
      '“I take what is given, and I return it.”',
    )
    expect(blocks[1]).toMatchObject({ speaker: 'ancient dragon' })
  })
})
