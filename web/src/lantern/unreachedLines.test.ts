/**
 * The lines the acts' content can speak that the narration script lacks
 * (`unreachedLines`): the script holds what the golden path, the probes and
 * the branches reach, and a line added where none of them goes is found here,
 * by name, instead of by a reviewer. `tts/act<N>/unreached.json` acknowledges
 * the lines that were already missing when the check began.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { ScriptLine } from './narrationScript'
import {
  acknowledgedKey,
  authoredLines,
  contentFiles,
  staleAcknowledgements,
  unreachedLines,
} from './unreachedLines'

/** A source file of the repository relative to `web/`. */
const here = (path: string): URL => new URL(`../../${path}`, import.meta.url)

/** The web project's directory. */
const WEB_ROOT = fileURLToPath(here('.')).replace(/\/$/, '')

describe('authoredLines', () => {
  it('joins literals concatenated with + and drops markup', () => {
    const lines = authoredLines([
      {
        file: 'a.ts',
        text:
          "const x = 'You step into the cold. ' + '[dim]Nothing answers you.[/dim]'\n" +
          "const y = 'short'\nconst z = 'oneverylongwordwithoutanyspacesatall123456'",
      },
    ])
    expect(lines).toEqual([
      {
        file: 'a.ts',
        text: 'You step into the cold. Nothing answers you.',
      },
    ])
  })
})

describe('unreachedLines', () => {
  const authored = [
    { file: 'a.ts', text: 'A line the script already holds, in full.' },
    { file: 'b.ts', text: 'A new line that no path or branch reaches.' },
    { file: 'c.ts', text: 'A line somebody acknowledged as missing once.' },
  ]
  const script: ScriptLine[] = [
    {
      id: 'x',
      speaker: 'narrator',
      text: 'Before. A line the script already holds, in full. After.',
    },
  ]
  it('names the lines in no script line that nobody acknowledged', () => {
    const found = unreachedLines(authored, script, [
      acknowledgedKey(authored[2].text),
    ])
    expect(found).toEqual([authored[1]])
  })
})

describe.each([1, 2, 3, 4])('the lines of Act %i content', (act) => {
  it('are all in the script, or acknowledged in unreached.json', () => {
    const script = JSON.parse(
      readFileSync(here(`../tts/act${act}/script.json`), 'utf8'),
    ) as ScriptLine[]
    const acknowledged = JSON.parse(
      readFileSync(here(`../tts/act${act}/unreached.json`), 'utf8'),
    ) as string[]
    const missing = unreachedLines(
      authoredLines(contentFiles(WEB_ROOT, act)),
      script,
      acknowledged,
    ).map((line) => `${line.file.replace(`${WEB_ROOT}/`, '')}: ${line.text}`)
    expect(
      missing,
      'Lines the script lacks: reach them with an entry in tts/act<N>/branches.json (see tts/README.md)',
    ).toEqual([])
  })
})

describe.each([1, 2, 3, 4])('unreached.json of Act %i', (act) => {
  it('holds only lines still missing from the script', () => {
    const script = JSON.parse(
      readFileSync(here(`../tts/act${act}/script.json`), 'utf8'),
    ) as ScriptLine[]
    const acknowledged = JSON.parse(
      readFileSync(here(`../tts/act${act}/unreached.json`), 'utf8'),
    ) as string[]
    expect(
      staleAcknowledgements(
        authoredLines(contentFiles(WEB_ROOT, act)),
        script,
        acknowledged,
      ),
      'Remove these from unreached.json: the line is now spoken, reworded or gone',
    ).toEqual([])
  })
})
