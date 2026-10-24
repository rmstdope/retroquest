import { describe, it, expect } from 'vitest'
import {
  MARKUP_TAGS,
  characterName,
  clue,
  dialogue,
  event,
  findMarkupProblems,
  remembered,
  speech,
  writing,
} from './markup'

describe('markup helpers', () => {
  it('wraps text in an event span', () => {
    expect(event('You wait.')).toBe('[event]You wait.[/event]')
  })

  it('wraps a name and speech inline without adding a line', () => {
    expect(characterName('Mira')).toBe('[character_name]Mira[/character_name]')
    expect(speech("'Hi.'")).toBe("[dialogue]'Hi.'[/dialogue]")
    expect(
      findMarkupProblems(characterName('Mira') + ' says ' + speech('Hi')),
    ).toEqual([])
  })

  it('attributes dialogue to its speaker', () => {
    expect(dialogue('Mira', "'Hello.'")).toBe(
      "[character_name]Mira[/character_name]\n[dialogue]'Hello.'[/dialogue]",
    )
  })

  it('produces output the checker accepts', () => {
    expect(
      findMarkupProblems(event('x') + '\n' + dialogue('Mira', 'Hi')),
    ).toEqual([])
  })

  it('knows the full tag vocabulary', () => {
    expect(MARKUP_TAGS).toContain('dialogue')
    expect(MARKUP_TAGS).toContain('event')
  })
})

describe('writing', () => {
  it('marks words as deliberately unsigned and is well formed', () => {
    expect(writing("'Dear Mira.'")).toBe(
      "[character_name][/character_name]\n[dialogue]'Dear Mira.'[/dialogue]",
    )
    expect(findMarkupProblems(writing('x'))).toEqual([])
  })
})

describe('findMarkupProblems', () => {
  it('reports bracketed words that are not tags', () => {
    expect(findMarkupProblems('You see [nothing] here.')).toEqual([
      expect.stringContaining('unknown tag [nothing]'),
    ])
  })

  it('reports an unknown tag', () => {
    expect(findMarkupProblems('[shout]hi[/shout]')).toEqual([
      expect.stringContaining('unknown tag [shout]'),
      expect.stringContaining('unknown tag [/shout]'),
    ])
  })

  it('reports an unclosed tag', () => {
    expect(findMarkupProblems('[event]You read.\nMore')).toEqual([
      expect.stringContaining('unclosed [event]'),
    ])
  })

  it('reports an unbalanced closing tag', () => {
    expect(findMarkupProblems('[bold]a[/event]')).toEqual(
      expect.arrayContaining([expect.stringContaining('unbalanced [/event]')]),
    )
  })

  it('reports a tag nested in itself', () => {
    expect(findMarkupProblems('[bold]a[bold]b[/bold][/bold]')).toEqual([
      expect.stringContaining('nested [bold]'),
    ])
  })

  it('reports dialogue with no speaker before it', () => {
    expect(findMarkupProblems('[dialogue]Hi[/dialogue]')).toEqual([
      expect.stringContaining('unattributed dialogue'),
    ])
  })

  it('does not count a name inside dialogue as the speaker', () => {
    const text =
      '[dialogue]Oh, [character_name]Elior[/character_name].[/dialogue]'
    expect(findMarkupProblems(text)).toEqual([
      expect.stringContaining('unattributed dialogue'),
    ])
  })

  it('accepts a name in narration before the dialogue', () => {
    const text =
      'You speak with [character_name]Mira[/character_name].\n' +
      '[dialogue]Hello, [character_name]Elior[/character_name].[/dialogue]'
    expect(findMarkupProblems(text)).toEqual([])
  })
})

describe('remembered', () => {
  it('writes the amber "remembered" event line for a virtue', () => {
    expect(remembered('Mercy')).toBe(
      '[event]✦ Mercy — this will be remembered[/event]',
    )
    expect(findMarkupProblems(remembered('Truth'))).toEqual([])
  })
})

describe('clue', () => {
  it('writes a failure that carries a clue, still a [failure] for the game', () => {
    expect(clue('A glimmer.')).toBe(
      '[failure][clue]A glimmer.[/clue][/failure]',
    )
    expect(findMarkupProblems(clue('A glimmer.'))).toEqual([])
    expect(MARKUP_TAGS).toContain('clue')
  })
})
