import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useNarrationStore, type NarrationAudio } from './useNarrationStore'
import { useSettingsStore } from './useSettingsStore'
import type { NarrationUnit } from '@/lantern/narrationUnits'
import type { NarrationClip } from '@/lantern/narrationManifest'

/** A recorded clip of `words` words, each a second long. */
function clip(words: number, duration = words): NarrationClip {
  return {
    file: `${words}.mp3`,
    speaker: 'narrator',
    duration,
    words: Array.from({ length: words }, (_, i) => ({
      word: `w${i}`,
      start: i,
      end: i + 1,
    })),
  }
}

/** A voiced one-part unit. */
function voiced(words = 2): NarrationUnit {
  return {
    kind: 'block',
    parts: [{ markup: 'a b', clip: clip(words) }],
  }
}

/** A silent unit (an event line, or a line with no recording). */
const silent: NarrationUnit = { kind: 'block', parts: [] }

/** Fake audio elements, kept so tests can end, fail or move them. */
class FakeAudio implements NarrationAudio {
  static all: FakeAudio[] = []
  volume = 1
  currentTime = 0
  paused = false
  onended: (() => void) | null = null
  onerror: (() => void) | null = null
  rejectPlay = false
  constructor(public src: string) {
    FakeAudio.all.push(this)
  }
  play(): Promise<void> {
    return this.rejectPlay
      ? Promise.reject(new Error('blocked'))
      : Promise.resolve()
  }
  pause(): void {
    this.paused = true
  }
}

const last = (): FakeAudio => FakeAudio.all[FakeAudio.all.length - 1]

describe('useNarrationStore', () => {
  let narration: ReturnType<typeof useNarrationStore>

  beforeEach(() => {
    vi.useFakeTimers()
    FakeAudio.all = []
    setActivePinia(createPinia())
    narration = useNarrationStore()
    narration.setAudioFactory((src) => new FakeAudio(src))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows every unit of a turn that is not being narrated', () => {
    expect(narration.revealed(1, 0)).toBe(true)
    expect(narration.speaking(1)).toBeNull()
  })

  it('reveals a unit as its voice starts and the next one after a pause', async () => {
    narration.begin(7, [voiced(), voiced()], 'act1')
    expect(narration.revealed(7, 0)).toBe(true)
    expect(narration.revealed(7, 1)).toBe(false)
    expect(narration.speaking(7)).toMatchObject({ unit: 0, part: 0 })
    expect(last().src).toBe('/audio/narration/act1/2.mp3')

    last().onended?.()
    expect(narration.speaking(7)).toBeNull()
    expect(narration.revealed(7, 1)).toBe(false)
    await vi.advanceTimersByTimeAsync(350)
    expect(narration.revealed(7, 1)).toBe(true)
    expect(narration.speaking(7)).toMatchObject({ unit: 1 })

    last().onended?.()
    expect(narration.isNarrating).toBe(false)
    expect(narration.revealed(7, 1)).toBe(true)
  })

  it('takes silent units in their place without a pause', async () => {
    narration.begin(1, [voiced(), silent, voiced()], 'act1')
    last().onended?.()
    await vi.advanceTimersByTimeAsync(350)
    expect(narration.revealed(1, 1)).toBe(true)
    expect(narration.speaking(1)).toMatchObject({ unit: 2 })
  })

  it('does not begin when nothing in the turn is voiced or narration is off', () => {
    narration.begin(1, [silent, silent], 'act1')
    expect(narration.isNarrating).toBe(false)

    useSettingsStore().narrationOn = false
    narration.begin(2, [voiced()], 'act1')
    expect(narration.isNarrating).toBe(false)
    expect(FakeAudio.all).toHaveLength(0)
  })

  it('plays at the narration volume', () => {
    useSettingsStore().narrationVolume = 40
    narration.begin(1, [voiced()], 'act1')
    expect(last().volume).toBeCloseTo(0.4)
  })

  it('follows the spoken word', async () => {
    narration.begin(1, [voiced(3)], 'act1')
    expect(narration.speaking(1)?.word).toBe(-1)
    last().currentTime = 1.2
    await vi.advanceTimersByTimeAsync(60)
    expect(narration.speaking(1)?.word).toBe(1)
  })

  it('speaks the parts of a card in turn', async () => {
    const card: NarrationUnit = {
      kind: 'quest',
      parts: [
        { markup: 'a', clip: clip(1) },
        { markup: 'b', clip: clip(1) },
      ],
    }
    narration.begin(1, [card], 'act1')
    expect(narration.speaking(1)).toMatchObject({ unit: 0, part: 0 })
    last().onended?.()
    await vi.advanceTimersByTimeAsync(350)
    expect(narration.speaking(1)).toMatchObject({ unit: 0, part: 1 })
  })

  it('hurry completes the block, cuts its voice and plays the next one', async () => {
    narration.begin(1, [voiced(), voiced()], 'act1')
    const first = last()
    narration.hurry()
    expect(first.paused).toBe(true)
    await vi.advanceTimersByTimeAsync(80)
    expect(narration.revealed(1, 1)).toBe(true)
    expect(narration.speaking(1)).toMatchObject({ unit: 1 })
    expect(last()).not.toBe(first)
  })

  it('hurry during the pause brings the next block now', () => {
    narration.begin(1, [voiced(), voiced()], 'act1')
    last().onended?.()
    narration.hurry()
    expect(narration.speaking(1)).toMatchObject({ unit: 1 })
  })

  it('skipAll shows the rest of the turn at once, silently', async () => {
    narration.begin(1, [voiced(), voiced(), silent, voiced()], 'act1')
    const first = last()
    narration.skipAll()
    expect(first.paused).toBe(true)
    expect(narration.isNarrating).toBe(false)
    expect(narration.revealed(1, 3)).toBe(true)
    await vi.advanceTimersByTimeAsync(5000)
    expect(FakeAudio.all).toHaveLength(1)
  })

  it('a second tap within 300 ms skips, a lone tap hurries', async () => {
    narration.begin(1, [voiced(), voiced(), voiced()], 'act1')
    narration.tap()
    await vi.advanceTimersByTimeAsync(400)
    expect(narration.speaking(1)).toMatchObject({ unit: 1 })
    narration.tap()
    await vi.advanceTimersByTimeAsync(100)
    narration.tap()
    expect(narration.isNarrating).toBe(false)
  })

  it('a new turn cuts in on the one being narrated', () => {
    narration.begin(1, [voiced(), voiced()], 'act1')
    const first = last()
    narration.begin(2, [voiced()], 'act1')
    expect(first.paused).toBe(true)
    expect(narration.revealed(1, 1)).toBe(true)
    expect(narration.speaking(2)).toMatchObject({ unit: 0 })
  })

  it('carries on when the voice fails, is blocked or never finishes', async () => {
    narration.begin(1, [voiced(), voiced(), voiced(), voiced()], 'act1')
    last().onerror?.()
    await vi.advanceTimersByTimeAsync(350)
    expect(narration.speaking(1)).toMatchObject({ unit: 1 })

    last().rejectPlay = true
    // a rejected play ends the block; the third block's audio is blocked
    await vi.advanceTimersByTimeAsync((2 + 3) * 1000 + 350)
    expect(narration.speaking(1)).toMatchObject({ unit: 2 })
    FakeAudio.all[FakeAudio.all.length - 1].onerror?.()
    await vi.advanceTimersByTimeAsync(350)
    expect(narration.speaking(1)).toMatchObject({ unit: 3 })
  })

  it('ends the turn when the last voice never finishes', async () => {
    narration.begin(1, [voiced(2)], 'act1')
    await vi.advanceTimersByTimeAsync(5001)
    expect(narration.isNarrating).toBe(false)
  })

  it('counts the length of a clip from when it can play, not from when it was asked for', async () => {
    let start: () => void = () => undefined
    narration.setAudioFactory((src) => {
      const audio = new FakeAudio(src)
      audio.play = () => new Promise<void>((resolve) => (start = resolve))
      return audio
    })
    narration.begin(1, [voiced(2)], 'act1')
    // A slow fetch: more than the usual allowance passes before sound starts.
    await vi.advanceTimersByTimeAsync(8000)
    expect(narration.isNarrating).toBe(true)
    start()
    await vi.advanceTimersByTimeAsync(4000)
    expect(narration.isNarrating).toBe(true)
    await vi.advanceTimersByTimeAsync(1100)
    expect(narration.isNarrating).toBe(false)
  })

  it('treats a rejected play() as an ended block', async () => {
    narration.setAudioFactory((src) => {
      const audio = new FakeAudio(src)
      audio.rejectPlay = true
      return audio
    })
    narration.begin(1, [voiced(), voiced()], 'act1')
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(350)
    // Both blocks were tried, neither stalled the turn.
    expect(FakeAudio.all).toHaveLength(2)
    expect(narration.isNarrating).toBe(false)
  })

  describe('manifests', () => {
    it("loads an act's manifest once and keeps it", async () => {
      const manifest = { k: clip(1) }
      const fetcher = vi.fn(async () => ({
        ok: true,
        json: async () => manifest,
      }))
      vi.stubGlobal('fetch', fetcher)
      expect(narration.manifestFor('act1')).toBeNull()
      await narration.preload('act1')
      await narration.preload('act1')
      expect(fetcher).toHaveBeenCalledTimes(1)
      expect(fetcher).toHaveBeenCalledWith(
        '/audio/narration/act1/manifest.json',
      )
      expect(narration.manifestFor('act1')).toEqual(manifest)
      vi.unstubAllGlobals()
    })

    it('is silent for an act with no recordings', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({ ok: false })),
      )
      await narration.preload('act2')
      expect(narration.manifestFor('act2')).toEqual({})
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => Promise.reject(new Error('x'))),
      )
      await narration.preload('act3')
      expect(narration.manifestFor('act3')).toEqual({})
      vi.unstubAllGlobals()
    })
  })
})
