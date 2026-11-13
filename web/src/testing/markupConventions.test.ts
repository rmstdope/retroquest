import { describe, expect, it } from 'vitest'
import {
  markupConventionProblems,
  talkedTwice,
  wordsTriedWrongFirst,
} from './markupConventions'

const CAST = ['Mira', 'Elior']
const check = (answer: string): string[] =>
  markupConventionProblems([{ command: 'x', answer }], CAST)

describe('markupConventionProblems', () => {
  it('accepts unsigned writing and a single word of a longer cast name', () => {
    expect(
      markupConventionProblems(
        [
          {
            command: 'x',
            answer:
              '[character_name][/character_name]\n[dialogue]A page.[/dialogue]\n' +
              '[character_name]Lyria[/character_name]\n[dialogue]Hello.[/dialogue]',
          },
        ],
        ['Master Healer Lyria'],
      ),
    ).toEqual([])
  })

  it('reports malformed markup', () => {
    expect(check('[dialogue]Unclosed').join('\n')).toContain('malformed')
  })

  it('lets a command that shows a written text quote it', () => {
    const answer = "The wall reads 'Let stillness echo.'"
    expect(
      markupConventionProblems([{ command: 'read', answer }], CAST),
    ).not.toEqual([])
    expect(
      markupConventionProblems([{ command: 'read', answer }], CAST, ['read']),
    ).toEqual([])
  })

  it('accepts a named speaker with plain dialogue', () => {
    expect(
      check(
        '[character_name]Mira[/character_name]\n[dialogue]Come along.[/dialogue]',
      ),
    ).toEqual([])
  })

  it.each([
    [
      'a speaker outside the cast',
      '[character_name]Hemlock[/character_name]\n[dialogue]Come.[/dialogue]',
      'unknown speaker "hemlock"',
    ],
    ['speech in the narration', "She says 'Come along.'", 'speech outside'],
  ])('reports %s', (_name, answer, expected) => {
    expect(check(answer).join('\n')).toContain(expected)
  })
})

describe('the path builders', () => {
  it('makes every talk twice', () => {
    expect(talkedTwice(['n', 'talk to x'])).toEqual([
      'n',
      'talk to x',
      'talk to x',
    ])
  })

  it('tries a wrong word before every word said', () => {
    expect(wordsTriedWrongFirst(['say a to x', 'n'])).toEqual([
      'say hello to x',
      'say a to x',
      'n',
    ])
  })
})
