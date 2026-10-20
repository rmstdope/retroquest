import { describe, it, expect } from 'vitest'
import { MARKUP_TAGS, dialogue, event, findMarkupProblems } from './markup'

describe('markup helpers', () => {
  it('wraps text in an event span', () => {
    expect(event('You wait.')).toBe('[event]You wait.[/event]')
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
