import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Turn } from './useGameStore'
import { useNarrationStore, type NarrationAudio } from './useNarrationStore'
import { useStageSpeechStore } from './useStageSpeechStore'
import { narrationKey } from '@/lantern/narrationKey'
import {
  narrationWords,
  type NarrationManifest,
} from '@/lantern/narrationManifest'
import { turnUnits } from '@/lantern/narrationUnits'
import { readingPauseMs } from '@/lantern/stageSpeech'

let nextId = 1

/** A player's command that addressed `addressed` (or nobody), answered with `text`. */
function turn(
  text: string,
  addressed: string | null,
  command = 'talk to someone',
  moved = false,
): Turn {
  return {
    id: nextId++,
    command,
    text,
    room: 'Cottage',
    description: moved ? { moved: true, firstVisit: false } : null,
    gained: [],
    lost: [],
    arrival: null,
    ...(addressed ? { addressed } : {}),
  }
}

const say = (name: string, words: string): string =>
  `[character_name]${name}[/character_name]\n[dialogue]${words}[/dialogue]`

describe('useStageSpeechStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
  })
  afterEach(() => vi.useRealTimers())

  it('starts with no conversation', () => {
    const speech = useStageSpeechStore()
    expect(speech.conversation).toBeNull()
    expect(speech.visible).toEqual([])
  })

  it('shows nothing when a talk moves Elior to another room', () => {
    const speech = useStageSpeechStore()
    speech.observe(turn(say('Voice', 'Wake.'), 'Voice', 'talk to voice', true))
    expect(speech.conversation).toBeNull()
    expect(speech.visible).toEqual([])
  })

  it('starts a conversation after turns it did not observe elsewhere', () => {
    const speech = useStageSpeechStore()
    speech.observe(turn(say('Grandmother', 'Hm.'), 'Grandmother'))
    // Turns in other rooms went unobserved (narrow window); this talk did not move.
    speech.observe(turn(say('Grandmother', 'There.'), 'Grandmother'))
  })

  it('starts a conversation with the one addressed and shows what they say', () => {
    const speech = useStageSpeechStore()
    speech.observe(turn(say('Grandmother', 'There you are.'), 'Grandmother'))
    expect(speech.visible.map((l) => [l.speaker, l.markup])).toEqual([
      ['Grandmother', 'There you are.'],
    ])
  })

  it('stacks while the same character is addressed, whatever the case', () => {
    const speech = useStageSpeechStore()
    speech.observe(turn(say('Grandmother', 'One.'), 'Grandmother'))
    speech.observe(
      turn(say('Grandmother', 'Two.'), 'grandmother', 'say why to grandmother'),
    )
    expect(speech.visible.map((l) => l.speaker)).toEqual([
      'Grandmother',
      'Elior',
    ])
    vi.runAllTimers()
    expect(speech.visible.map((l) => [l.speaker, l.side])).toEqual([
      ['Grandmother', 'right'],
      ['Elior', 'left'],
      ['Grandmother', 'right'],
    ])
  })

  it('shows a second speaker on the right and keeps the earlier names', () => {
    const speech = useStageSpeechStore()
    speech.observe(
      turn(
        say('Grandmother', 'One.') + '\n' + say('Villager', 'Two.'),
        'Grandmother',
      ),
    )
    vi.runAllTimers()
    expect(speech.visible.map((l) => l.speaker)).toEqual([
      'Grandmother',
      'Villager',
    ])
  })

  it('starts afresh when someone else is addressed', () => {
    const speech = useStageSpeechStore()
    speech.observe(turn(say('Grandmother', 'One.'), 'Grandmother'))
    speech.observe(turn(say('Mira', 'Hello.'), 'Mira'))
    expect(speech.visible.map((l) => l.speaker)).toEqual(['Mira'])
    expect(speech.conversation?.with).toBe('Mira')
  })

  it.each(['look', 'take bread', 'go north'])(
    'is cleared by a turn that addresses no one (%s)',
    (command) => {
      const speech = useStageSpeechStore()
      speech.observe(turn(say('Grandmother', 'One.'), 'Grandmother'))
      speech.observe(turn('Nothing happens.', null, command))
      expect(speech.conversation).toBeNull()
      expect(speech.visible).toEqual([])
    },
  )

  it('shows nothing of unsigned writing or narration', () => {
    const speech = useStageSpeechStore()
    speech.observe(
      turn(
        'She nods.\n[character_name][/character_name]\n[dialogue]Dear.[/dialogue]',
        'Grandmother',
      ),
    )
    expect(speech.visible).toEqual([])
  })

  it('releases the lines of an unnarrated turn one at a time by their length', () => {
    const speech = useStageSpeechStore()
    const first = 'First line.'
    const second = 'Second line.'
    speech.observe(turn(say('Mira', `${first}\n\n${second}\n\nThird.`), 'Mira'))
    expect(speech.visible.map((l) => l.markup)).toEqual([first])
    vi.advanceTimersByTime(readingPauseMs(first) - 1)
    expect(speech.visible).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(speech.visible.map((l) => l.markup)).toEqual([first, second])
    vi.advanceTimersByTime(readingPauseMs(second))
    expect(speech.visible).toHaveLength(3)
  })

  it('shows the rest of the turn at once on revealAll, and when the next turn comes', () => {
    const speech = useStageSpeechStore()
    speech.observe(turn(say('Mira', 'A.\n\nB.\n\nC.'), 'Mira'))
    speech.revealAll()
    expect(speech.visible).toHaveLength(3)
    vi.runAllTimers()
    expect(speech.visible).toHaveLength(3)

    speech.observe(turn(say('Mira', 'D.\n\nE.'), 'Mira'))
    expect(speech.visible.map((l) => l.markup)).toEqual([
      'A.',
      'B.',
      'C.',
      'D.',
    ])
    speech.observe(turn(say('Mira', 'F.'), 'Mira'))
    expect(speech.visible.map((l) => l.markup)).toEqual([
      'A.',
      'B.',
      'C.',
      'D.',
      'E.',
      'F.',
    ])
  })

  it('stops releasing lines once cleared', () => {
    const speech = useStageSpeechStore()
    speech.observe(turn(say('Mira', 'A.\n\nB.'), 'Mira'))
    speech.clear()
    vi.runAllTimers()
    expect(speech.visible).toEqual([])
    expect(speech.conversation).toBeNull()
  })
})

/** A recording for `markup` spoken by `speaker`, one second a word. */
function recorded(markup: string, speaker: string): NarrationManifest {
  return {
    [narrationKey(speaker, markup)]: {
      file: 'x.mp3',
      speaker,
      duration: 9,
      words: narrationWords(markup).map((word, i) => ({
        word,
        start: i,
        end: i + 1,
      })),
    },
  }
}

describe('useStageSpeechStore while the turn is narrated', () => {
  const audios: NarrationAudio[] = []

  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
    audios.length = 0
    useNarrationStore().setAudioFactory(() => {
      const audio: NarrationAudio = {
        volume: 1,
        currentTime: 0,
        onended: null,
        onerror: null,
        play: () => Promise.resolve(),
        pause: () => undefined,
      }
      audios.push(audio)
      return audio
    })
  })
  afterEach(() => vi.useRealTimers())

  const TEXT = `${say('Mira', 'Hello there.')}\nShe smiles.\n${say('Mira', 'Come in.')}`
  const manifest = {
    ...recorded('Hello there.', 'mira'),
    ...recorded('She smiles.', 'narrator'),
    ...recorded('Come in.', 'mira'),
  }

  it('shows each line as the narrator reaches it, and rings the one being read', async () => {
    const speech = useStageSpeechStore()
    const t = turn(TEXT, 'Mira')
    useNarrationStore().begin(t.id, turnUnits(t, true, manifest), 'act1')
    speech.observe(t)

    expect(speech.visible.map((l) => l.markup)).toEqual(['Hello there.'])
    expect(speech.isSpeaking(speech.visible[0])).toBe(true)

    audios[0].onended?.()
    await vi.advanceTimersByTimeAsync(350)
    audios[1].onended?.()
    await vi.advanceTimersByTimeAsync(350)
    expect(speech.visible.map((l) => l.markup)).toEqual([
      'Hello there.',
      'Come in.',
    ])
    expect(speech.isSpeaking(speech.visible[0])).toBe(false)
    expect(speech.isSpeaking(speech.visible[1])).toBe(true)
  })

  it('shows every line once the narration is skipped', () => {
    const speech = useStageSpeechStore()
    const t = turn(TEXT, 'Mira')
    useNarrationStore().begin(t.id, turnUnits(t, true, manifest), 'act1')
    speech.observe(t)
    useNarrationStore().skipAll()
    expect(speech.visible).toHaveLength(2)
  })

  it('shows the paragraphs of one narrated quote as the narrator reaches each, ringing the newest', async () => {
    const speech = useStageSpeechStore()
    const words = 'One two.\nThree four five.\nSix seven.'
    const t = turn(say('Mira', words), 'Mira')
    useNarrationStore().begin(
      t.id,
      turnUnits(t, true, recorded(words, 'mira')),
      'act1',
    )
    speech.observe(t)
    const shown = (): string[] => speech.visible.map((l) => l.markup)

    expect(shown()).toEqual(['One two.'])
    expect(speech.isSpeaking(speech.visible[0])).toBe(true)

    audios[0].currentTime = 2.5
    await vi.advanceTimersByTimeAsync(100)
    expect(shown()).toEqual(['One two.', 'Three four five.'])
    expect(speech.isSpeaking(speech.visible[0])).toBe(false)
    expect(speech.isSpeaking(speech.visible[1])).toBe(true)

    audios[0].currentTime = 5.5
    await vi.advanceTimersByTimeAsync(100)
    expect(shown()).toHaveLength(3)
    expect(speech.visible.map((l) => speech.isSpeaking(l))).toEqual([
      false,
      false,
      true,
    ])

    audios[0].onended?.()
    await vi.advanceTimersByTimeAsync(350)
    expect(shown()).toHaveLength(3)
  })

  it('shows every paragraph of a quote at once when the narration is skipped', () => {
    const speech = useStageSpeechStore()
    const words = 'One two.\nThree four.'
    const t = turn(say('Mira', words), 'Mira')
    useNarrationStore().begin(
      t.id,
      turnUnits(t, true, recorded(words, 'mira')),
      'act1',
    )
    speech.observe(t)
    useNarrationStore().skipAll()
    expect(speech.visible).toHaveLength(2)
  })

  it('shows and rings every paragraph of a quote whose recording does not match its words', () => {
    const speech = useStageSpeechStore()
    const words = 'One two.\nThree four.'
    const t = turn(say('Mira', words), 'Mira')
    const stale = recorded(words, 'mira')
    const clip = Object.values(stale)[0]
    clip.words = clip.words.slice(0, 2)
    useNarrationStore().begin(t.id, turnUnits(t, true, stale), 'act1')
    speech.observe(t)
    expect(speech.visible).toHaveLength(2)
    expect(speech.visible.map((l) => speech.isSpeaking(l))).toEqual([
      true,
      true,
    ])
  })

  it('counts words the same way when tags run across paragraphs', () => {
    const speech = useStageSpeechStore()
    const words = '[i]One two.\n[/i]\nThree [b]four[/b].'
    const t = turn(say('Mira', words), 'Mira')
    useNarrationStore().begin(
      t.id,
      turnUnits(t, true, recorded(words, 'mira')),
      'act1',
    )
    speech.observe(t)
    expect(speech.visible).toHaveLength(1)
    audios[0].currentTime = 2.5
    vi.advanceTimersByTime(100)
    expect(speech.visible).toHaveLength(2)
  })
})

describe('useStageSpeechStore.told', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
  })
  afterEach(() => vi.useRealTimers())

  it('has told a turn that said nothing on the picture, and one whose lines have all shown', () => {
    const speech = useStageSpeechStore()
    expect(speech.told(99)).toBe(true)
    const said = turn(
      `${say('Mira', 'Hello there.')}\n${say('Mira', 'And welcome.')}`,
      'Mira',
    )
    speech.observe(said)
    expect(speech.told(said.id)).toBe(false)
    vi.advanceTimersByTime(60000)
    expect(speech.told(said.id)).toBe(true)
  })
})
