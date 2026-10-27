import { beforeAll, describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '@/act1/Act1'
import { Act2 } from '@/act2/Act2'
import { ACT2_GOLDEN_PATH } from '@/act2/Act2GoldenPath'
import { Act4 } from '@/act4/Act4'
import { ACT4_GOLDEN_PATH } from '@/act4/Act4GoldenPath'
import { ACT1_GOLDEN_PATH } from '@/act1/Act1GoldenPath'
import { ACT_SOURCES } from '../../../tts/actScripts'
import { narrationKey } from './narrationKey'
import {
  actScript,
  blockVoice,
  chapterHeading,
  introBlocks,
  linesOfTurn,
  arrivalBlocks,
  newQuestBlocks,
  questCompleteBlocks,
  questTextBlocks,
  turnBlocks,
  UNSIGNED,
  type ScriptBranch,
  type ScriptLine,
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

describe('blockVoice', () => {
  it('voices text as the narrator and speech as its speaker, unsigned writing as UNSIGNED', () => {
    expect(blockVoice({ kind: 'text', markup: 'Rain.' })).toEqual({
      speaker: 'narrator',
      markup: 'Rain.',
    })
    expect(
      blockVoice({ kind: 'dialogue', speaker: 'Mira', markup: 'Hello.' }),
    ).toEqual({ speaker: 'mira', markup: 'Hello.' })
    expect(
      blockVoice({ kind: 'dialogue', speaker: null, markup: 'Dear Elior' }),
    ).toEqual({ speaker: UNSIGNED, markup: 'Dear Elior' })
  })

  it('leaves events, failures and checklists silent', () => {
    expect(blockVoice({ kind: 'event', markup: 'x' })).toBeNull()
    expect(blockVoice({ kind: 'failure', markup: 'x' })).toBeNull()
    expect(blockVoice({ kind: 'checklist', items: [] })).toBeNull()
  })

  it('reads a clue failure in the narrator’s voice', () => {
    expect(
      blockVoice({ kind: 'failure', markup: 'Shiny.', narrated: true }),
    ).toEqual({ speaker: 'narrator', markup: 'Shiny.' })
  })
})

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

  it('also gives narrated writing (a dim note on the page) to its writer, under the narrator’s key', () => {
    const [line] = linesOfTurn(
      'What a night, it was. A note in dim ink.',
      WRITERS,
    )
    expect(line.speaker).toBe('elior')
    expect(line.key).toBe(narrationKey('narrator', line.text))
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

  it('reads a room arrival’s name, then its description', () => {
    expect(arrivalBlocks('The Dream', 'Dark.\n\nA storm.')).toEqual([
      { speaker: 'narrator', markup: 'The Dream' },
      { speaker: 'narrator', markup: 'Dark.' },
      { speaker: 'narrator', markup: 'A storm.' },
    ])
  })

  it('reads a new quest’s heading and name before its text', () => {
    expect(
      newQuestBlocks({
        main: false,
        name: 'Fishing expedition',
        text: 'Help him.',
      }),
    ).toEqual([
      { speaker: 'narrator', markup: 'New side quest' },
      { speaker: 'narrator', markup: 'Fishing expedition' },
      { speaker: 'narrator', markup: 'Help him.' },
    ])
  })

  it('reads a completed quest’s heading and name before its completion text', () => {
    expect(
      questCompleteBlocks({
        main: true,
        name: 'The Faded Photograph',
        text: 'You found it.',
      }),
    ).toEqual([
      { speaker: 'narrator', markup: 'Main quest complete' },
      { speaker: 'narrator', markup: 'The Faded Photograph' },
      { speaker: 'narrator', markup: 'You found it.' },
    ])
  })

  it('reads a quest text’s opening, then each checklist item as its own line', () => {
    expect(
      questTextBlocks(
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
    ACT_SOURCES['1'].commands,
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
          'An old photograph of your parents, hidden away in a drawer.',
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

  it('reads the act-complete heading before the closing page', () => {
    expect(
      chapterHeading('complete', 'Act I', 'The Call to Adventure'),
    ).toEqual({
      speaker: 'narrator',
      markup: 'Act I complete. The Call to Adventure.',
    })
    expect(chapterHeading('intro', 'Act I', 'The Call to Adventure')).toEqual({
      speaker: 'narrator',
      markup: 'Act I: The Call to Adventure',
    })
    expect(chapterHeading('complete', '', 'x')).toBeNull()
    const lines = script.map((line) => line.text)
    const heading = lines.indexOf('Act I complete. The Call to Adventure.')
    expect(heading).toBeGreaterThan(-1)
    expect(lines[heading + 1]).toMatch(/^The amulet was your parents'\./)
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

  it('reads each room’s name on arrival, the opening room too', () => {
    expect(find('The Dream')?.speaker).toBe('narrator')
    expect(find('Village Square')?.speaker).toBe('narrator')
  })

  it('reads quest headings and quest names', () => {
    for (const words of [
      'New main quest',
      'New side quest',
      'Side quest complete',
      'Main quest complete',
      'The Faded Photograph',
    ])
      expect(find(words)?.speaker, words).toBe('narrator')
  })

  it('takes optional lines from examining what is at hand along the way', () => {
    expect(script.length).toBeGreaterThan(150)
  })

  it('reads the reply to resting, which the golden path never asks for', () => {
    expect(
      find('You rest for a moment, gathering your strength.')?.speaker,
    ).toBe('narrator')
    expect(
      find('You are asleep already. The voice says your name again, nearer.')
        ?.speaker,
    ).toBe('narrator')
  })

  it('reads the reply to searching, which the golden path never asks for', () => {
    expect(
      find(
        'You search around the Vegetable Field, but find nothing of interest beyond what you can already see.',
      )?.speaker,
    ).toBe('narrator')
  })

  it("reads both of the shed's written search answers", () => {
    for (const words of [
      'A pair of frightened green eyes watches you from behind the crates.',
      'You search around the shed again, but find nothing else of interest among the clutter.',
    ])
      expect(find(words)?.speaker, words).toBe('narrator')
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

describe('actScript branches', () => {
  const make = (): Game => new Game([new Act2()])
  const marcusIndex = ACT2_GOLDEN_PATH.lastIndexOf('talk to innkeeper marcus')
  const truth: ScriptBranch = {
    after: marcusIndex,
    commands: ['say truth to innkeeper marcus'],
  }
  /** Act II is played twice; that is slow under a loaded machine. */
  const SLOW = 60_000
  let plain: ScriptLine[] = []
  let branched: ScriptLine[] = []
  beforeAll(() => {
    plain = actScript(make, ACT2_GOLDEN_PATH, [])
    branched = actScript(make, ACT2_GOLDEN_PATH, [], [], [truth])
  }, SLOW)

  it('reads an optional scene the golden path does not take, played on a copy', () => {
    const onPurpose = (line: { text: string }): boolean =>
      line.text.startsWith('On purpose.')
    expect(plain.some(onPurpose)).toBe(false)
    expect(branched.find(onPurpose)?.speaker).toBe('innkeeper marcus')
  })

  it('leaves the lines of the golden path as they were', () => {
    const keys = new Set(branched.map((line) => line.key))
    expect(plain.every((line) => keys.has(line.key))).toBe(true)
  })
})

describe('actScript branches before the first command', () => {
  it('reads a scene of the opening dream, which the first command ends', () => {
    const dream: ScriptBranch = { after: -1, commands: ['go north'] }
    const lines = actScript(
      () => new Game([new Act1()]),
      ACT1_GOLDEN_PATH.slice(0, 1),
      [],
      [],
      [dream],
    )
    expect(lines.some((line) => line.text.includes('There is no door'))).toBe(
      true,
    )
  })
})

describe('actScript branches with story flags cleared', () => {
  const QUIET =
    'You rest for a while, but the glade remains quiet. Perhaps something more needs to happen for its magic to awaken.'
  const glade = ACT1_GOLDEN_PATH.indexOf('rest')
  const branch: ScriptBranch = {
    after: glade,
    commands: ['rest'],
    unset: ['deer_can_be_observed'],
  }
  /** Act I is played twice; that is slow under a loaded machine. */
  const SLOW = 60_000
  let script: ScriptLine[] = []
  beforeAll(() => {
    script = actScript(
      () => new Game([new Act1()]),
      ACT1_GOLDEN_PATH,
      WRITERS,
      SILENT,
      [branch],
    )
  }, SLOW)

  it('reads a scene as it plays before a story flag is set', () => {
    expect(script.find((line) => line.text === QUIET)?.speaker).toBe('narrator')
  })
})

describe('actScript hints', () => {
  /** Act I is played with its probes; that is slow under a loaded machine. */
  const SLOW = 60_000
  let script: ScriptLine[] = []
  beforeAll(() => {
    script = actScript(
      () => new Game([new Act1()]),
      ACT_SOURCES['1'].commands,
      WRITERS,
      SILENT,
    )
  }, SLOW)

  it('reads the opening line of a hint', () => {
    const line = script.find(
      (l) => l.text === 'You stop and think over what you know.',
    )
    expect(line?.speaker).toBe('narrator')
  })

  it('reads a quest line whole, with the quest name in front', () => {
    const line = script.find((l) =>
      l.text.startsWith('Shadows Over Willowbrook: Villagers speak'),
    )
    expect(line?.speaker).toBe('narrator')
  })

  it('reads the line for nothing open', () => {
    expect(
      script.some(
        (l) => l.text === 'You think it over. Nothing presses on you just now.',
      ),
    ).toBe(true)
  })
})

describe('actScript branches with virtues', () => {
  const make = (): Game => new Game([new Act4()])
  const amulet = ACT4_GOLDEN_PATH.indexOf('use ancient amulet')
  const sacrifice = [
    'use lifelight elixir on prison',
    'say sacrifice to malakar',
    'use ancient amulet on wound',
  ]
  const ARENS_LINE = 'We watched you give, again and again'
  let without: ScriptLine[] = []
  let withVirtues: ScriptLine[] = []
  beforeAll(() => {
    without = actScript(
      make,
      ACT4_GOLDEN_PATH,
      [],
      [],
      [{ after: amulet, commands: sacrifice }],
    )
    withVirtues = actScript(
      make,
      ACT4_GOLDEN_PATH,
      [],
      [],
      [
        {
          after: amulet,
          commands: sacrifice,
          virtues: ['selfless', 'selfless'],
        },
      ],
    )
  }, 120_000)

  it('plays the colour lines only for the virtues the branch earned', () => {
    const arens = (line: ScriptLine): boolean => line.text.includes(ARENS_LINE)
    expect(without.some(arens)).toBe(false)
    expect(withVirtues.some(arens)).toBe(true)
  })
})
