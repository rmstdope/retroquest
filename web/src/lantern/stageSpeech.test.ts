import { describe, expect, it } from 'vitest'
import { parseTurn } from './parseTurn'
import {
  ELIOR,
  eliorLine,
  readingPauseMs,
  speakerColor,
  speechLines,
} from './stageSpeech'

describe('speechLines', () => {
  it('puts the one spoken to on the right under the name the game shows', () => {
    const lines = speechLines(
      parseTurn(
        '[event]You speak with [character_name]grandmother[/character_name].[/event]\n' +
          '[dialogue]There you are.[/dialogue]',
      ),
    )
    expect(lines).toEqual([
      {
        unit: 1,
        speaker: 'Grandmother',
        side: 'right',
        markup: 'There you are.',
        firstWord: 0,
      },
    ])
  })

  it('puts a character named Elior on the left', () => {
    const [named] = speechLines(
      parseTurn(
        '[character_name]Elior[/character_name]\n[dialogue]Hello.[/dialogue]',
      ),
    )
    expect(named).toMatchObject({ speaker: ELIOR, side: 'left' })
  })

  it('leaves writing, quotes nobody names and narration off the picture', () => {
    const writing = parseTurn(
      'Mira nods.\n[character_name][/character_name]\n[dialogue]Dear.[/dialogue]',
    )
    expect(speechLines(writing)).toEqual([])
    const nameless = parseTurn("[dialogue]You say 'hi' to Mira.[/dialogue]")
    expect(speechLines(nameless)).toEqual([])
  })

  it('counts the narrated words before each paragraph of a quote', () => {
    const blocks = parseTurn(
      '[character_name]Mira[/character_name]\n[dialogue]One two.\nThree four five.\nSix.[/dialogue]',
    )
    expect(speechLines(blocks).map((l) => l.firstWord)).toEqual([0, 2, 5])
  })

  it('numbers the unit of each quote as the narration does', () => {
    const lines = speechLines(
      parseTurn(
        'She waits.\n[character_name]Mira[/character_name]\n[dialogue]One.[/dialogue]\n' +
          'Then:\n[character_name]Borin[/character_name]\n[dialogue]Two.[/dialogue]',
      ),
    )
    expect(lines.map((l) => [l.unit, l.speaker])).toEqual([
      [1, 'Mira'],
      [3, 'Borin'],
    ])
  })

  it('makes each paragraph of a speech a line, balanced on its own', () => {
    const lines = speechLines(
      parseTurn(
        '[character_name]Mira[/character_name]\n' +
          '[dialogue]First [bold]part\n\nstill bold[/bold] end.\n\nLast.[/dialogue]',
      ),
    )
    expect(lines.map((l) => l.unit)).toEqual([0, 0, 0])
    expect(lines.map((l) => l.markup)).toEqual([
      'First [bold]part[/bold]',
      '[bold]still bold[/bold] end.',
      'Last.',
    ])
  })
})

describe('speechLines with single line breaks', () => {
  it('makes each line-broken paragraph of a speech its own line', () => {
    const lines = speechLines(
      parseTurn(
        '[character_name]Mira[/character_name]\n' +
          '[dialogue]One.\nTwo.\nThree.[/dialogue]',
      ),
    )
    expect(lines.map((l) => l.markup)).toEqual(['One.', 'Two.', 'Three.'])
  })
})

describe('eliorLine', () => {
  it('is the words of a say command, as typed, on the left before any block', () => {
    expect(eliorLine('say Hello there to grandmother')).toEqual({
      unit: -1,
      speaker: ELIOR,
      side: 'left',
      markup: 'Hello there',
      firstWord: 0,
    })
    expect(eliorLine('  SAY why to the families ')?.markup).toBe('why')
  })

  it.each([
    null,
    'talk to mira',
    'say hi',
    'give bread to mira',
    'say to mira',
  ])('is nothing for %s', (command) => {
    expect(eliorLine(command)).toBeNull()
  })
})

describe('speakerColor', () => {
  it('is steady for a name, whatever its case', () => {
    expect(speakerColor('Mira')).toBe(speakerColor('mira'))
  })

  it('gives Elior amber and others a colour from the palette', () => {
    expect(speakerColor(ELIOR)).toBe('#c47a1a')
    expect(speakerColor('Mira')).toMatch(/^#[0-9a-f]{6}$/)
    expect(speakerColor('Mira')).not.toBe('#c47a1a')
  })

  it('tells the Act I cast apart mostly', () => {
    const names = ['Grandmother', 'Mira', 'Borin', 'Hemlock', 'Villager']
    expect(new Set(names.map(speakerColor)).size).toBeGreaterThanOrEqual(4)
  })
})

describe('readingPauseMs', () => {
  it('grows with the line and stays between 0.9 and 6 seconds', () => {
    expect(readingPauseMs('Hi')).toBe(900)
    expect(readingPauseMs('x'.repeat(100))).toBe(600 + 35 * 100)
    expect(readingPauseMs('x'.repeat(1000))).toBe(6000)
  })

  it('counts the words, not the markup', () => {
    expect(readingPauseMs('[bold]' + 'x'.repeat(100) + '[/bold]')).toBe(
      readingPauseMs('x'.repeat(100)),
    )
  })
})
