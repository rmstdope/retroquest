import { describe, it, expect } from 'vitest'
import {
  isDebugScriptName,
  parseDebugScript,
  failureReason,
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
