import { describe, expect, it } from 'vitest'
import { narrationWords } from './narrationManifest'
import {
  pageLines,
  paginate,
  splitParagraphs,
  splitSentences,
  type ArrivalPage,
} from './arrivalPages'

/** A page fits while its text is at most `chars` characters. */
const fitsChars =
  (chars: number) =>
  (page: ArrivalPage['pieces']): boolean =>
    page.map((p) => p.sep + p.markup).join('').length <= chars

describe('splitting', () => {
  it('splits a line at line breaks into paragraphs', () => {
    const pieces = splitParagraphs({ unit: 2, markup: 'One.\nTwo.\n\nThree.' })
    expect(pieces.map((p) => [p.markup, p.sep])).toEqual([
      ['One.', ''],
      ['Two.', '\n'],
      ['Three.', '\n'],
    ])
    expect(pieces.every((p) => p.unit === 2)).toBe(true)
  })

  it('splits a piece between sentences without losing a word', () => {
    const markup =
      'The dark lets go. You are in [room_name]Elior’s Cottage.[/room_name] ' +
      'Is it morning? “Yes,” she says. Done!'
    const [piece] = splitParagraphs({ unit: 0, markup })
    const sentences = splitSentences(piece)
    expect(sentences.map((s) => s.markup)).toEqual([
      'The dark lets go.',
      'You are in [room_name]Elior’s Cottage.[/room_name]',
      'Is it morning?',
      '“Yes,” she says.',
      'Done!',
    ])
    expect(sentences.map((s) => s.sep)).toEqual(['', ' ', ' ', ' ', ' '])
    expect(
      sentences.reduce((n, s) => n + narrationWords(s.markup).length, 0),
    ).toBe(narrationWords(markup).length)
  })

  it('numbers each piece from its place in the line', () => {
    const [piece] = splitParagraphs({ unit: 0, markup: 'A b. C d e. F.' })
    expect(splitSentences(piece).map((s) => s.wordStart)).toEqual([0, 2, 5])
  })

  it('keeps tags balanced when a tag spans sentences', () => {
    const [piece] = splitParagraphs({
      unit: 0,
      markup: '[event]It ends. It begins.[/event]',
    })
    expect(splitSentences(piece).map((s) => s.markup)).toEqual([
      '[event]It ends.[/event]',
      '[event]It begins.[/event]',
    ])
  })
})

describe('paginate', () => {
  it('puts a part that fits on one page', () => {
    const pages = paginate(
      [
        { unit: 0, markup: 'One.' },
        { unit: 1, markup: 'Two.' },
      ],
      fitsChars(100),
    )
    expect(pages).toHaveLength(1)
    expect(pages[0].scrolls).toBe(false)
  })

  it('packs whole lines, in order, as many as fit', () => {
    const pages = paginate(
      [
        { unit: 0, markup: 'aaaa' },
        { unit: 1, markup: 'bbbb' },
        { unit: 2, markup: 'cccc' },
      ],
      fitsChars(9),
    )
    expect(pages.map((p) => p.pieces.map((x) => x.markup))).toEqual([
      ['aaaa', 'bbbb'],
      ['cccc'],
    ])
    expect(pages.map((p) => [p.firstUnit, p.firstWord])).toEqual([
      [0, 0],
      [2, 0],
    ])
  })

  it('splits a line too tall for a page between paragraphs, then sentences', () => {
    const pages = paginate(
      [{ unit: 4, markup: 'Aa aa. Bb bb.\nCc cc. Dd dd.' }],
      fitsChars(14),
    )
    expect(pages.map((p) => pageLines(p).map((l) => l.markup))).toEqual([
      ['Aa aa. Bb bb.'],
      ['Cc cc. Dd dd.'],
    ])
    expect(pages[1].firstUnit).toBe(4)
    expect(pages[1].firstWord).toBe(4)
    const small = paginate(
      [{ unit: 4, markup: 'Aa aa. Bb bb.\nCc cc. Dd dd.' }],
      fitsChars(7),
    )
    expect(small.map((p) => pageLines(p)[0].markup)).toEqual([
      'Aa aa.',
      'Bb bb.',
      'Cc cc.',
      'Dd dd.',
    ])
  })

  it('gives a sentence too tall for any page its own scrolling page', () => {
    const pages = paginate(
      [
        { unit: 0, markup: 'Hi.' },
        { unit: 1, markup: 'A very long single sentence indeed' },
      ],
      fitsChars(10),
    )
    expect(pages.map((p) => p.scrolls)).toEqual([false, true])
  })

  it('has no pages for no lines', () => {
    expect(paginate([], fitsChars(10))).toEqual([])
  })
})

describe('pageLines', () => {
  it('joins the pieces of one line back, with their separators', () => {
    const pages = paginate(
      [{ unit: 3, markup: 'Aa. Bb.\nCc.' }],
      fitsChars(100),
    )
    expect(pageLines(pages[0])).toEqual([
      { unit: 3, markup: 'Aa. Bb.\nCc.', wordStart: 0 },
    ])
  })
})

describe('a single-paragraph line', () => {
  it('goes straight to sentences', () => {
    const pages = paginate([{ unit: 0, markup: 'Aa aa. Bb bb.' }], fitsChars(7))
    expect(pages.map((p) => p.scrolls)).toEqual([false, false])
    expect(pages).toHaveLength(2)
  })
})

describe('a speaker’s quote', () => {
  const lines = [
    { unit: 0, markup: 'aaaa' },
    { unit: 1, markup: 'bbbb' },
    { unit: 2, markup: 'qqqq', joinsPrevious: true },
    { unit: 3, markup: 'cccc' },
  ]

  it('stays on the page of the line before it', () => {
    const pages = paginate(lines, fitsChars(9))
    expect(pages.map((p) => p.pieces.map((x) => x.markup))).toEqual([
      ['aaaa'],
      ['bbbb', 'qqqq'],
      ['cccc'],
    ])
  })

  it('does not hold the line back when both fit with the page before', () => {
    const pages = paginate(lines, fitsChars(14))
    expect(pages.map((p) => p.pieces.map((x) => x.markup))).toEqual([
      ['aaaa', 'bbbb', 'qqqq'],
      ['cccc'],
    ])
  })

  it('parts from the line before it only when both together are too tall for a page', () => {
    const pages = paginate(lines.slice(1, 3), fitsChars(5))
    expect(pages.map((p) => p.pieces.map((x) => x.markup))).toEqual([
      ['bbbb'],
      ['qqqq'],
    ])
  })
})
