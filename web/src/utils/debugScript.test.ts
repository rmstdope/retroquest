import { describe, it, expect, vi } from 'vitest'
import {
  isDebugScriptName,
  parseDebugScript,
  failureReason,
  goldenPathLines,
  playDebugScript,
  type DebugScriptHost,
} from './debugScript'

describe('parseDebugScript', () => {
  it('keeps commands with their file line numbers', () => {
    expect(parseDebugScript('look\ntake bread\n')).toEqual([
      { line: 1, command: 'look' },
      { line: 2, command: 'take bread' },
    ])
  })

  it('skips comments and blank lines but counts them', () => {
    const text = '# start\n\n  go south  \r\n   # note\nlook'
    expect(parseDebugScript(text)).toEqual([
      { line: 3, command: 'go south' },
      { line: 5, command: 'look' },
    ])
  })
})

describe('isDebugScriptName', () => {
  it.each(['act1', 'act-1', 'my_script2'])('accepts %s', (name) => {
    expect(isDebugScriptName(name)).toBe(true)
  })
  it.each(['', '../x', 'a/b', 'a.txt', 'A B'])('rejects %j', (name) => {
    expect(isDebugScriptName(name)).toBe(false)
  })
})

describe('failureReason', () => {
  it('is null for an answer that is not a failure', () => {
    expect(failureReason('You take the [item_name]bread[/item_name].')).toBe(
      null,
    )
  })
  it('gives the failure text without markup', () => {
    expect(
      failureReason("[failure]There is no 'x' here to take.[/failure]"),
    ).toBe("There is no 'x' here to take.")
  })
})

describe('goldenPathLines', () => {
  it('numbers the path from 1', () => {
    expect(goldenPathLines(['look', 'take bread'])).toEqual([
      { line: 1, command: 'look' },
      { line: 2, command: 'take bread' },
    ])
  })
  it('is empty for an empty path', () => {
    expect(goldenPathLines([])).toEqual([])
  })
})

describe('playDebugScript for an act name', () => {
  function host(path: string[]): DebugScriptHost & { shown: string[] } {
    const shown: string[] = []
    return {
      shown,
      play: vi.fn(() => 'ok'),
      running: () => true,
      show: (text) => shown.push(text),
      goldenPath: () => path,
    }
  }

  it('plays the act golden path, without fetching', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const h = host(['look', 'take bread'])
    await playDebugScript('act1', h)
    expect(h.play).toHaveBeenCalledTimes(2)
    expect(h.play).toHaveBeenNthCalledWith(2, 'take bread')
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(h.shown.at(-1)).toContain('played 2 commands')
    vi.unstubAllGlobals()
  })

  it('says so when the act has no golden path', async () => {
    const h = host([])
    await playDebugScript('act4', h)
    expect(h.play).not.toHaveBeenCalled()
    expect(h.shown[0]).toContain("'act4' not found")
  })
})
