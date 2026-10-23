import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '@/act1/Act1'
import { ACT1_GOLDEN_PATH } from '@/act1/Act1GoldenPath'
import { narrationKey } from './narrationKey'
import { actScript, linesOfTurn, type WriterRule } from './narrationScript'

const WRITERS: WriterRule[] = [
  { opening: 'My dearest', speaker: 'mother' },
  { opening: 'What a night', speaker: 'elior' },
]

describe('linesOfTurn', () => {
  it('voices narration and speech, each by its speaker', () => {
    const lines = linesOfTurn(
      'She looks up.\n[character_name]Mira[/character_name]\n[dialogue]Come in, child.[/dialogue]',
      WRITERS,
    )
    expect(lines.map((l) => [l.speaker, l.text])).toEqual([
      ['narrator', 'She looks up.'],
      ['mira', 'Come in, child.'],
    ])
    expect(lines[1].key).toBe(narrationKey('mira', 'Come in, child.'))
  })

  it('leaves events, failures and checklists silent', () => {
    expect(
      linesOfTurn(
        '[event]You pick up the lantern.[/event]\n[failure]You cannot go that way.[/failure]\n[success]* Find the cat[/success]\n[pending]* Ring the bell[/pending]',
        WRITERS,
      ),
    ).toEqual([])
  })

  it('gives unsigned writing to its writer by its opening words, else to the narrator', () => {
    const lines = linesOfTurn(
      '[character_name][/character_name]\n[dialogue]My dearest Elior, you found the bend.[/dialogue]\n' +
        '[character_name][/character_name]\n[dialogue]MISSING - Our dear cat.[/dialogue]',
      WRITERS,
    )
    expect(lines.map((l) => l.speaker)).toEqual(['mother', 'narrator'])
  })
})

describe('actScript for Act I', () => {
  const script = actScript(
    () => new Game([new Act1()]),
    ACT1_GOLDEN_PATH,
    WRITERS,
  )
  const find = (text: string): { speaker: string } | undefined =>
    script.find((line) => line.text === text)

  it('starts with the chapter page, title first', () => {
    expect(script[0]).toMatchObject({
      speaker: 'narrator',
      text: 'Act I: The Call to Adventure',
    })
  })

  it('holds every speaker’s lines along the golden path', () => {
    expect(find('Some voices are older than memory.')?.speaker).toBe(
      'grandmother',
    )
  })

  it('reads a room’s description on the first visit', () => {
    expect(
      script.some(
        (line) =>
          line.speaker === 'narrator' &&
          line.text.startsWith('The heart of Willowbrook bustles with life.'),
      ),
    ).toBe(true)
  })

  it('reads quest cards', () => {
    expect(
      script.some((line) =>
        line.text.startsWith(
          'Somewhere in the cottage lies an old photograph of your parents',
        ),
      ),
    ).toBe(true)
  })

  it('gives the mother’s letter to the mother', () => {
    expect(
      script.find((line) => line.text.startsWith('My dearest Elior'))?.speaker,
    ).toBe('mother')
  })

  it('takes optional lines from examining what is at hand along the way', () => {
    expect(script.length).toBeGreaterThan(150)
  })

  it('takes lines from using what is carried, such as the locket inscription', () => {
    expect(
      script.find((line) => line.text.startsWith("From the founders' line"))
        ?.speaker,
    ).toBe('narrator')
  })

  it('lists every line once, with words', () => {
    const keys = script.map((line) => line.key)
    expect(new Set(keys).size).toBe(keys.length)
    expect(script.every((line) => line.text.length > 0)).toBe(true)
  })
})
