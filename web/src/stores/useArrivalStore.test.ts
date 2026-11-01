import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useArrivalStore } from './useArrivalStore'
import { useNarrationStore, type NarrationAudio } from './useNarrationStore'
import { useSettingsStore } from './useSettingsStore'
import type { NarrationUnit } from '@/lantern/narrationUnits'
import {
  ARRIVAL_CLEAR_AFTER_MS,
  type ArrivalPart,
} from '@/lantern/stageArrival'

const WORDS_48 = Array.from({ length: 48 }, () => 'w').join(' ')

/** The description alone (a plain move) or after a silent events part. */
function parts(events: boolean, voiced: boolean): ArrivalPart[] {
  const description: ArrivalPart = {
    kind: 'description',
    lines: [{ unit: events ? 1 : 0, markup: WORDS_48 }],
    voiced,
  }
  return events
    ? [
        {
          kind: 'events',
          lines: [{ unit: 0, markup: 'He leaves.' }],
          voiced: false,
        },
        description,
      ]
    : [description]
}

class FakeAudio implements NarrationAudio {
  static all: FakeAudio[] = []
  volume = 1
  currentTime = 0
  onended: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor(public src: string) {
    FakeAudio.all.push(this)
  }
  play(): Promise<void> {
    return Promise.resolve()
  }
  pause(): void {}
}

/** A voiced one-part unit. */
const voiced: NarrationUnit = {
  kind: 'block',
  parts: [
    {
      markup: 'a b',
      clip: { file: 'x.mp3', speaker: 'narrator', duration: 2, words: [] },
    },
  ],
}
const silent: NarrationUnit = { kind: 'block', parts: [] }

describe('useArrivalStore', () => {
  let arrival: ReturnType<typeof useArrivalStore>
  let narration: ReturnType<typeof useNarrationStore>

  beforeEach(() => {
    vi.useFakeTimers()
    FakeAudio.all = []
    setActivePinia(createPinia())
    useSettingsStore().narrationOn = true
    narration = useNarrationStore()
    narration.setAudioFactory((src) => new FakeAudio(src))
    arrival = useArrivalStore()
  })
  afterEach(() => vi.useRealTimers())

  describe('when nobody narrates it', () => {
    it('stays for its reading time, shown by the bar, then clears', () => {
      arrival.show(1, parts(false, false), false)
      expect(arrival.active).toBe(true)
      expect(arrival.barMs).toBe(12000)
      vi.advanceTimersByTime(11999)
      expect(arrival.active).toBe(true)
      vi.advanceTimersByTime(1)
      expect(arrival.active).toBe(false)
    })

    it('tells the events first, each for its own reading time', () => {
      arrival.show(1, parts(true, false), false)
      expect(arrival.part?.kind).toBe('events')
      expect(arrival.barMs).toBe(6000)
      vi.advanceTimersByTime(6000)
      expect(arrival.part?.kind).toBe('description')
      expect(arrival.barMs).toBe(12000)
      vi.advanceTimersByTime(12000)
      expect(arrival.active).toBe(false)
    })

    it('goes on a part at a time, then clears', () => {
      arrival.show(1, parts(true, false), false)
      arrival.next()
      expect(arrival.part?.kind).toBe('description')
      vi.advanceTimersByTime(5000)
      arrival.next()
      expect(arrival.active).toBe(false)
    })

    it('restarts the reading time on each part', () => {
      arrival.show(1, parts(true, false), false)
      vi.advanceTimersByTime(5000)
      arrival.next()
      vi.advanceTimersByTime(11000)
      expect(arrival.active).toBe(true)
    })

    it('clear is idempotent and stops the clock', () => {
      arrival.show(1, parts(false, false), false)
      arrival.clear()
      arrival.clear()
      expect(arrival.active).toBe(false)
      expect(vi.getTimerCount()).toBe(0)
    })
  })

  describe('when the narrator tells it', () => {
    function narrate(units: NarrationUnit[], p: ArrivalPart[]): void {
      narration.begin(1, units, 'act1')
      arrival.show(1, p, narration.narrates(1))
    }

    it('has no bar and clears 1½ s after the narrator finishes', async () => {
      narrate([voiced], parts(false, true))
      expect(arrival.barMs).toBe(0)
      FakeAudio.all[0].onended?.()
      await nextTick()
      vi.advanceTimersByTime(ARRIVAL_CLEAR_AFTER_MS - 1)
      expect(arrival.active).toBe(true)
      vi.advanceTimersByTime(1)
      expect(arrival.active).toBe(false)
    })

    it('goes from the events to the description as the narration does', async () => {
      narrate([silent, voiced], parts(true, true))
      expect(arrival.part?.kind).toBe('events')
      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(arrival.part?.kind).toBe('description')
    })

    it('goes on with the narrator: a next on the events jumps to the description', async () => {
      narrate([silent, voiced], parts(true, true))
      arrival.next()
      await nextTick()
      expect(arrival.part?.kind).toBe('description')
      expect(narration.speaking(1)?.unit).toBe(1)
    })

    it('a next on the last part clears and stops the narrator', () => {
      narrate([voiced], parts(false, true))
      arrival.next()
      expect(arrival.active).toBe(false)
      expect(narration.isNarrating).toBe(false)
    })

    it('clear stops the narrator', () => {
      narrate([voiced], parts(false, true))
      arrival.clear()
      expect(narration.isNarrating).toBe(false)
    })

    it('reads a description with no voice for its reading time, with the bar', async () => {
      narrate(
        [voiced, silent],
        [
          { kind: 'events', lines: [{ unit: 0, markup: 'x' }], voiced: true },
          {
            kind: 'description',
            lines: [{ unit: 1, markup: WORDS_48 }],
            voiced: false,
          },
        ],
      )
      FakeAudio.all[0].onended?.()
      await nextTick()
      vi.advanceTimersByTime(400)
      await nextTick()
      expect(arrival.part?.kind).toBe('description')
      expect(arrival.barMs).toBe(12000)
      vi.advanceTimersByTime(12000)
      expect(arrival.active).toBe(false)
    })

    it('a silent events part shows its bar while the narrator waits', () => {
      narrate([silent, voiced], parts(true, true))
      expect(arrival.barMs).toBe(6000)
    })
  })

  describe('pages', () => {
    const start = (word: number, text = 'a b c') => ({ unit: 0, word, text })

    it('reads each page for its own reading time, with its own bar, then goes on', () => {
      arrival.show(1, parts(false, false), false)
      arrival.setPages([start(0), start(20, WORDS_48)])
      expect(arrival.pageCount).toBe(2)
      expect(arrival.page).toBe(0)
      expect(arrival.barMs).toBe(6000)
      const key = arrival.barKey
      vi.advanceTimersByTime(6000)
      expect(arrival.page).toBe(1)
      expect(arrival.active).toBe(true)
      expect(arrival.barMs).toBe(12000)
      expect(arrival.barKey).not.toBe(key)
      vi.advanceTimersByTime(12000)
      expect(arrival.active).toBe(false)
    })

    it('a next turns the pages, then the part, then clears', () => {
      arrival.show(1, parts(true, false), false)
      arrival.setPages([start(0), start(3)])
      arrival.next()
      expect(arrival.part?.kind).toBe('events')
      expect(arrival.page).toBe(1)
      arrival.next()
      expect(arrival.part?.kind).toBe('description')
      expect(arrival.page).toBe(0)
      expect(arrival.pageCount).toBe(1)
      arrival.setPages([start(0), start(5), start(9)])
      arrival.next()
      arrival.next()
      expect(arrival.active).toBe(true)
      arrival.next()
      expect(arrival.active).toBe(false)
    })

    it('a part reported as one page is one page', () => {
      arrival.show(1, parts(false, false), false)
      arrival.setPages([start(0)])
      expect(arrival.barMs).toBe(6000)
      arrival.next()
      expect(arrival.active).toBe(false)
    })

    it('a new cut keeps the paragraph the player was reading', () => {
      arrival.show(1, parts(false, false), false)
      arrival.setPages([start(0), start(10), start(20)])
      arrival.next()
      arrival.next()
      expect(arrival.page).toBe(2)
      arrival.setPages([start(0), start(15)])
      expect(arrival.page).toBe(1)
      arrival.setPages([start(0)])
      expect(arrival.page).toBe(0)
    })

    it('a new cut with the same pages does not restart the reading time', () => {
      arrival.show(1, parts(false, false), false)
      arrival.setPages([start(0), start(10)])
      vi.advanceTimersByTime(5000)
      arrival.setPages([start(0), start(10)])
      vi.advanceTimersByTime(1000)
      expect(arrival.page).toBe(1)
    })

    describe('with the narrator', () => {
      const unit: NarrationUnit = {
        kind: 'block',
        parts: [
          {
            markup: 'a b c d e f',
            clip: {
              file: 'x.mp3',
              speaker: 'narrator',
              duration: 6,
              words: Array.from({ length: 6 }, (_, k) => ({
                word: 'w',
                start: k,
                end: k + 1,
              })),
            },
          },
        ],
      }
      function narrate(): void {
        narration.begin(1, [unit], 'act1')
        arrival.show(1, parts(false, true), true)
        arrival.setPages([start(0), start(4)])
      }

      it('turns the page when the narrator reaches its first word', async () => {
        narrate()
        expect(arrival.page).toBe(0)
        FakeAudio.all[0].currentTime = 3
        vi.advanceTimersByTime(100)
        await nextTick()
        expect(arrival.page).toBe(0)
        FakeAudio.all[0].currentTime = 4
        vi.advanceTimersByTime(100)
        await nextTick()
        expect(arrival.page).toBe(1)
        expect(arrival.barMs).toBe(0)
      })

      it('never goes back when the narrator is moved back', async () => {
        narrate()
        FakeAudio.all[0].currentTime = 5
        vi.advanceTimersByTime(100)
        await nextTick()
        FakeAudio.all[0].currentTime = 1
        vi.advanceTimersByTime(100)
        await nextTick()
        expect(arrival.page).toBe(1)
      })

      it('a next jumps the narrator to the start of the next page', () => {
        narrate()
        arrival.next()
        expect(arrival.page).toBe(1)
        expect(FakeAudio.all[0].currentTime).toBe(4)
        expect(arrival.active).toBe(true)
      })

      it('keeps the page of a description nobody speaks when the narrator ends', async () => {
        narration.begin(1, [unit], 'act1')
        arrival.show(1, parts(false, false), true)
        arrival.setPages([start(0), start(5), start(9)])
        FakeAudio.all[0].onended?.()
        await nextTick()
        expect(arrival.page).toBe(0)
        expect(arrival.barMs).toBe(6000)
        vi.advanceTimersByTime(6000)
        expect(arrival.page).toBe(1)
      })

      it('a next on the last page clears and stops the narrator', () => {
        narrate()
        arrival.next()
        arrival.next()
        expect(arrival.active).toBe(false)
        expect(narration.isNarrating).toBe(false)
      })
    })
  })
})
