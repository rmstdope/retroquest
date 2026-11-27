import { describe, expect, it } from 'vitest'
import { joinPaths, markedPath } from './pathMarks'

describe('markedPath', () => {
  it('keeps the commands and gives each mark the index of the command it follows', () => {
    const path = markedPath(['look', '@looked', 'go east', 'rest', '@rested'])
    expect(path.commands).toEqual(['look', 'go east', 'rest'])
    expect(path.marks).toEqual({ looked: 0, rested: 2 })
  })

  it('puts a mark before the first command at -1', () => {
    expect(markedPath(['@opening', 'look']).marks).toEqual({ opening: -1 })
  })

  it('moves a mark with its command when a step is inserted before it', () => {
    const path = markedPath(['wait', 'look', '@looked'])
    expect(path.commands[path.marks.looked]).toBe('look')
  })

  it('refuses a name used twice', () => {
    expect(() => markedPath(['@here', 'look', '@here'])).toThrow(/@here/)
  })

  it('refuses a mark without a name', () => {
    expect(() => markedPath(['look', '@'])).toThrow(/no name/)
  })
})

describe('joinPaths', () => {
  it('plays the paths one after another, counting later marks from the whole', () => {
    const path = joinPaths(
      markedPath(['look', '@looked']),
      markedPath(['@before-rest', 'rest', '@rested']),
    )
    expect(path.commands).toEqual(['look', 'rest'])
    expect(path.marks).toEqual({
      looked: 0,
      'before-rest': 0,
      rested: 1,
    })
  })

  it('refuses a name used in two of the paths', () => {
    expect(() =>
      joinPaths(markedPath(['@here', 'look']), markedPath(['@here', 'rest'])),
    ).toThrow(/@here/)
  })
})
