import { describe, expect, it } from 'vitest'
import { markupConventionProblems } from './markupConventions'

const CAST = ['Mira', 'Elior']
const check = (answer: string): string[] =>
  markupConventionProblems([{ command: 'x', answer }], CAST)

describe('markupConventionProblems', () => {
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
