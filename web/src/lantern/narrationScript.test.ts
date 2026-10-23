import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '@/act1/Act1'
import {
  ACT1_COMPLETING_COMMAND,
  ACT1_GOLDEN_PATH,
} from '@/act1/Act1GoldenPath'
import { narrationKey } from './narrationKey'
import {
  actScript,
  introBlocks,
  linesOfTurn,
  questCardBlocks,
  turnBlocks,
  UNSIGNED,
  type WriterRule,
} from './narrationScript'

/** Lines that stay silent: the chapter page's help line and the closing page's shared words. */
const SILENT = [
  "Let's get started!",
  'Congratulations — you have completed Act',
  'Take a moment to catch your breath',
]

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

describe('the voiced blocks a surface shows', () => {
  it('splits an answer into narration and speech, unsigned writing under its own name', () => {
    expect(
      turnBlocks(
        'She looks up.\n[character_name]Mira[/character_name]\n[dialogue]Come in.[/dialogue]\n' +
          '[character_name][/character_name]\n[dialogue]My dearest Elior.[/dialogue]\n[event]A chime.[/event]',
      ),
    ).toEqual([
      { speaker: 'narrator', markup: 'She looks up.' },
      { speaker: 'mira', markup: 'Come in.' },
      { speaker: UNSIGNED, markup: 'My dearest Elior.' },
    ])
  })

  it('gives a chapter page its heading, then its paragraphs', () => {
    expect(
      introBlocks(
        '[bold]ACT 1: THE CALL TO ADVENTURE[/bold]\n\nYou are Elior.\n\nA storm comes.',
      ),
    ).toEqual([
      { speaker: 'narrator', markup: 'Act I: The Call to Adventure' },
      { speaker: 'narrator', markup: 'You are Elior.' },
      { speaker: 'narrator', markup: 'A storm comes.' },
    ])
  })

  it('reads a quest card’s opening, then each checklist item as its own line', () => {
    expect(
      questCardBlocks(
        'You will need:\n[success]* Warm clothing[/success]\n[pending]* A map[/pending]',
      ),
    ).toEqual([
      { speaker: 'narrator', markup: 'You will need:' },
      { speaker: 'narrator', markup: 'Warm clothing' },
      { speaker: 'narrator', markup: 'A map' },
    ])
  })
})

describe('actScript for Act I', () => {
  const script = actScript(
    () => new Game([new Act1()]),
    [...ACT1_GOLDEN_PATH, ACT1_COMPLETING_COMMAND],
    WRITERS,
    SILENT,
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

  it('voices the mother’s letter as the mother, keyed as writing the page can find', () => {
    const letter = script.find((line) =>
      line.text.startsWith('My dearest Elior'),
    )
    expect(letter?.speaker).toBe('mother')
    expect(letter?.key).toBe(narrationKey(UNSIGNED, letter?.text ?? ''))
  })

  it('reads the act-complete chapter page', () => {
    expect(
      script.some((line) =>
        line.text.startsWith("The amulet was your parents'."),
      ),
    ).toBe(true)
  })

  it('reads a quest card’s opening apart from its list, so a count in an item does not silence it', () => {
    expect(
      find(
        'Mira has tasked you with preparing for your journey. She says you will need:',
      )?.speaker,
    ).toBe('narrator')
    expect(find('Warm clothing')?.speaker).toBe('narrator')
  })

  it('leaves the closing page’s shared congratulations silent', () => {
    expect(script.some((line) => line.text.startsWith('Congratulations'))).toBe(
      false,
    )
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
