import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Turn } from './useGameStore'
import { useNarrationStore, type NarrationAudio } from './useNarrationStore'
import { useStageSpeechStore } from './useStageSpeechStore'
import { useSceneStore } from './useSceneStore'
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

  it('shows what is said when the talk itself moves Elior to another room, in a fresh conversation', () => {
    const speech = useStageSpeechStore()
    speech.observe(turn(say('Mira', 'Hello.'), 'Mira'))
    speech.observe(turn(say('Voice', 'Wake.'), 'Voice', 'talk to voice', true))
    speech.revealAll()
    expect(speech.conversation?.with).toBe('Voice')
    expect(speech.visible.map((l) => [l.speaker, l.side, l.markup])).toEqual([
      ['Voice', 'right', 'Wake.'],
    ])
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

  it('keeps, dimmed as the turn before, an unread journal a later command cut off', () => {
    const speech = useStageSpeechStore()
    const journal = turn(
      `${say('Elior', 'The storm.')}\n${say('Elior', 'The voice.')}`,
      null,
      'use journal',
    )
    speech.observe(journal)
    expect(speech.visible.map((l) => l.markup)).toEqual(['The storm.'])
    speech.observe(turn('The hearth is warm.', null, 'examine hearth'))
    expect(speech.visible.map((l) => l.markup)).toEqual([
      'The storm.',
      'The voice.',
    ])
    expect(speech.ageOf(journal.id)).toBe('prev')
    // A later turn clears them as usual, once they have been on the picture.
    speech.observe(turn('Nothing happens.', null, 'look'))
    expect(speech.visible).toEqual([])
  })

  it('keeps a cut-off talk while someone else is addressed, and lets it go once it has been seen', () => {
    const speech = useStageSpeechStore()
    speech.observe(
      turn(
        `${say('Grandmother', 'One.')}\n${say('Grandmother', 'Two.')}`,
        'Grandmother',
      ),
    )
    speech.observe(turn(say('Mira', 'Hello.'), 'Mira'))
    expect(speech.conversation?.with).toBe('Mira')
    expect(speech.visible.map((l) => [l.speaker, l.markup])).toEqual([
      ['Grandmother', 'One.'],
      ['Grandmother', 'Two.'],
      ['Mira', 'Hello.'],
    ])
    vi.runAllTimers()
    speech.observe(turn(say('Mira', 'Again.'), 'Mira'))
    vi.runAllTimers()
    expect(speech.visible.map((l) => [l.speaker, l.markup])).toEqual([
      ['Mira', 'Hello.'],
      ['Mira', 'Again.'],
    ])
  })

  it('clears a cut-off talk when the command leaves the room', () => {
    const speech = useStageSpeechStore()
    speech.observe(
      turn(`${say('Mira', 'One.')}\n${say('Mira', 'Two.')}`, 'Mira'),
    )
    speech.observe(turn('You walk.', null, 'go north', true))
    expect(speech.visible).toEqual([])
  })

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

  it('shows every named line of a turn that addresses no one, on a fresh conversation', () => {
    const speech = useStageSpeechStore()
    speech.observe(turn(say('Mira', 'Hello.'), 'Mira'))
    speech.observe(
      turn(
        `The ink is smudged.\n${say('Elior', 'The storm.')}\n${say('Mira', 'Hm.')}`,
        null,
        'use journal',
      ),
    )
    speech.revealAll()
    expect(speech.visible.map((l) => [l.speaker, l.side, l.markup])).toEqual([
      ['Elior', 'left', 'The storm.'],
      ['Mira', 'right', 'Hm.'],
    ])
  })

  it("shows a character's reply to a spell cast on them as speech", () => {
    const speech = useStageSpeechStore()
    speech.observe(
      turn(
        `Warmth spreads through his arm.\n${say('fisherman', 'Not a twinge.')}`,
        null,
        'cast heal on fisherman',
      ),
    )
    speech.revealAll()
    expect(speech.visible.map((l) => [l.speaker, l.side, l.markup])).toEqual([
      ['Fisherman', 'right', 'Not a twinge.'],
    ])
  })

  it("does not show Elior's lines from a turn that leaves the room", () => {
    const speech = useStageSpeechStore()
    speech.observe(turn(say('Elior', 'Onwards.'), null, 'go north', true))
    speech.revealAll()
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

  describe('the last line of an unnarrated turn', () => {
    it('is reported when it appears, and not before', () => {
      const speech = useStageSpeechStore()
      const done = vi.fn()
      speech.observe(
        turn(say('Mira', 'First.\n\nSecond.\n\nThird.'), 'Mira'),
        null,
        done,
      )
      expect(done).not.toHaveBeenCalled()
      vi.advanceTimersByTime(readingPauseMs('First.'))
      expect(done).not.toHaveBeenCalled()
      vi.advanceTimersByTime(readingPauseMs('Second.'))
      expect(done).toHaveBeenCalledTimes(1)
      vi.runAllTimers()
      expect(done).toHaveBeenCalledTimes(1)
    })

    it('is reported at once for a turn of one line, or of none', () => {
      const speech = useStageSpeechStore()
      const one = vi.fn()
      speech.observe(turn(say('Mira', 'Only.'), 'Mira'), null, one)
      expect(one).toHaveBeenCalledTimes(1)
      const none = vi.fn()
      speech.observe(turn('The wind blows.', null), null, none)
      expect(none).toHaveBeenCalledTimes(1)
    })

    it('is reported when the rest is shown at once, or the next turn cuts in', () => {
      const speech = useStageSpeechStore()
      const first = vi.fn()
      speech.observe(turn(say('Mira', 'A.\n\nB.\n\nC.'), 'Mira'), null, first)
      speech.revealAll()
      expect(first).toHaveBeenCalledTimes(1)
      const second = vi.fn()
      speech.observe(turn(say('Mira', 'D.\n\nE.'), 'Mira'), null, second)
      speech.observe(turn(say('Mira', 'F.'), 'Mira'))
      expect(second).toHaveBeenCalledTimes(1)
    })
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

  it('answers for a line by turn and unit: held back until released, shown once the conversation lets go of it', () => {
    const speech = useStageSpeechStore()
    const first = turn(say('Mira', 'One.') + '\n' + say('Mira', 'Two.'), 'Mira')
    speech.observe(first)
    // Block 0 is shown at once (the first line of the unnarrated turn is released with no wait), block 1 is not yet.
    expect(speech.lineShown(first.id, 0, 0)).toBe(true)
    expect(speech.lineShown(first.id, 1, 0)).toBe(false)
    speech.clear()
    expect(speech.lineShown(first.id, 1, 0)).toBe(true)
    expect(speech.lineSpeaking(first.id, 1, 0)).toBe(false)
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

describe('useStageSpeechStore during a change of scene', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
  })
  afterEach(() => vi.useRealTimers())

  it('holds back a line of the moving turn, also before the conversation has taken it in, until the picture is up', () => {
    const speech = useStageSpeechStore()
    const scene = useSceneStore()
    const moving = turn(say('Voice', 'Wake.'), 'Voice', 'talk to voice', true)
    scene.begin(moving.id, '/new.png', () => speech.observe(moving))
    // The column asks while the scene changes and the turn is not yet observed.
    expect(speech.lineShown(moving.id, 0, 0)).toBe(false)
    expect(speech.lineShown(moving.id, -1, 0)).toBe(false)
    scene.skip()
    expect(speech.lineShown(moving.id, 0, 0)).toBe(true)
  })
})

describe('useStageSpeechStore: a talk that changes the scene partway', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
  })
  afterEach(() => vi.useRealTimers())

  const words = '…let them rest…'
  /** The dream's ending in short: two narrator blocks, the voice (block 2), the waking (3), the arrival line (4). */
  const waking = (): Turn =>
    turn(
      'You answer it.\n\nThe whisper comes once more.\n' +
        say('voice', words) +
        '\n\nYou wake.\n\n[event]You are in the Cottage.[/event]',
      'voice',
      'talk to voice',
      true,
    )

  it('says the scene may change once the lines before it are read, unnarrated', () => {
    const speech = useStageSpeechStore()
    const reached = vi.fn()
    speech.observe(waking(), { unit: 3, reached })
    expect(speech.visible.map((line) => line.markup)).toEqual([words])
    expect(reached).not.toHaveBeenCalled()
    vi.advanceTimersByTime(readingPauseMs(words) - 1)
    expect(reached).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(reached).toHaveBeenCalledTimes(1)
    vi.runAllTimers()
    expect(reached).toHaveBeenCalledTimes(1)
  })

  it('holds the words from the scene change on until it is reached', () => {
    const speech = useStageSpeechStore()
    const scene = useSceneStore()
    const moving = waking()
    speech.observe(moving, { unit: 3, reached: () => {} })
    expect(scene.holds(moving.id, 2)).toBe(false)
    expect(scene.holds(moving.id, 3)).toBe(true)
    expect(scene.holds(moving.id, 4)).toBe(true)
    vi.runAllTimers()
    expect(scene.holds(moving.id, 3)).toBe(false)
  })

  it('changes the scene at once when the picture is cleared (the stage goes)', () => {
    const speech = useStageSpeechStore()
    const reached = vi.fn()
    speech.observe(waking(), { unit: 3, reached })
    speech.clear()
    expect(reached).toHaveBeenCalledTimes(1)
  })

  it('clears the lines said before the room changed, and counts the rest as told', () => {
    const speech = useStageSpeechStore()
    const scene = useSceneStore()
    const moving = waking()
    speech.observe(moving)
    expect(speech.visible.map((line) => line.markup)).toEqual([words])
    scene.cut(moving.id, 3)
    expect(speech.visible).toEqual([])
    expect(speech.told(moving.id)).toBe(true)
  })

  it('changes the scene at once when the turn is shown whole', () => {
    const speech = useStageSpeechStore()
    const reached = vi.fn()
    speech.observe(waking(), { unit: 3, reached })
    speech.revealAll()
    expect(reached).toHaveBeenCalledTimes(1)
    vi.runAllTimers()
    expect(reached).toHaveBeenCalledTimes(1)
  })

  it('holds a line from where the scene changes until the picture is up', () => {
    const speech = useStageSpeechStore()
    const scene = useSceneStore()
    scene.settled('a.png')
    const moving = waking()
    speech.observe(moving)
    scene.begin(moving.id, 'b.png', () => {}, 2)
    expect(speech.visible).toEqual([])
    expect(speech.lineShown(moving.id, 2, 0)).toBe(false)
    scene.skip()
    expect(speech.visible.map((line) => line.markup)).toEqual([words])
  })
  it('ages a turn by how many turns ago it was told, whether or not anyone spoke in the ones since', () => {
    const speech = useStageSpeechStore()
    const talk = turn(say('Borin', 'Well met.'), 'Borin')
    speech.observe(talk)
    expect(speech.ageOf(talk.id)).toBe('new')
    const give = turn('Borin takes the coin.', 'Borin', 'give coin to borin')
    speech.observe(give)
    expect(speech.ageOf(talk.id)).toBe('prev')
    expect(speech.ageOf(give.id)).toBe('new')
    speech.observe(turn("You don't have that.", 'Borin', 'give gold to borin'))
    expect(speech.ageOf(talk.id)).toBe('old')
    const again = turn(say('Borin', 'Again.'), 'Borin')
    speech.observe(again)
    expect(speech.ageOf(again.id)).toBe('new')
    expect(speech.ageOf(talk.id)).toBe('old')
  })
})
