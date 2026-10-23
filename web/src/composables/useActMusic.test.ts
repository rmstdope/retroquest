// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useActMusic } from './useActMusic'
import { useGameStore } from '@/stores/useGameStore'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { MUSIC_DUCK, MUSIC_DUCK_FADE_MS } from './useMusic'

class FakeAudio {
  static last: FakeAudio
  src = ''
  loop = false
  volume = 1
  paused = true
  play = vi.fn(() => {
    this.paused = false
    return Promise.resolve()
  })
  pause = vi.fn(() => {
    this.paused = true
  })
  load = vi.fn()
  removeAttribute = vi.fn()
  constructor() {
    FakeAudio.last = this
  }
}

describe('useActMusic', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('Audio', FakeAudio)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('dips under a narrated turn and comes back up after it', async () => {
    vi.useFakeTimers()
    const scope = effectScope()
    scope.run(() => useActMusic())
    const music = FakeAudio.last
    const narration = useNarrationStore()
    narration.begin(
      1,
      [
        {
          kind: 'block',
          parts: [
            {
              markup: 'a b',
              clip: {
                file: 'a.mp3',
                speaker: 'narrator',
                duration: 2,
                words: [
                  { word: 'a', start: 0, end: 1 },
                  { word: 'b', start: 1, end: 2 },
                ],
              },
            },
          ],
        },
      ],
      'act1',
    )
    await nextTick()
    vi.advanceTimersByTime(MUSIC_DUCK_FADE_MS * 2)
    expect(music.volume).toBeCloseTo(MUSIC_DUCK)

    narration.skipAll()
    await nextTick()
    vi.advanceTimersByTime(MUSIC_DUCK_FADE_MS * 2)
    expect(music.volume).toBeCloseTo(1)
    scope.stop()
    vi.useRealTimers()
  })

  it("loops the current act's track", async () => {
    const scope = effectScope()
    scope.run(() => useActMusic())
    useGameStore().musicFile = 'willowbrook.mp3'
    await nextTick()

    expect(FakeAudio.last.loop).toBe(true)
    expect(FakeAudio.last.src).toContain('willowbrook.mp3')
    scope.stop()
  })

  it('starts on the first click or key press (browsers block autoplay)', async () => {
    const scope = effectScope()
    scope.run(() => useActMusic())
    useGameStore().musicFile = 'willowbrook.mp3'
    await nextTick()
    FakeAudio.last.pause()
    FakeAudio.last.play.mockClear()

    window.dispatchEvent(new Event('click'))
    window.dispatchEvent(new Event('keydown'))

    expect(FakeAudio.last.play).toHaveBeenCalledOnce()
    scope.stop()
  })

  it('stops listening for gestures when its scope ends', async () => {
    const scope = effectScope()
    scope.run(() => useActMusic())
    useGameStore().musicFile = 'willowbrook.mp3'
    await nextTick()
    scope.stop()
    FakeAudio.last.pause()
    FakeAudio.last.play.mockClear()

    window.dispatchEvent(new Event('click'))

    expect(FakeAudio.last.play).not.toHaveBeenCalled()
  })

  it('stops the music when its scope ends (no second track on a remount)', async () => {
    const scope = effectScope()
    scope.run(() => useActMusic())
    useGameStore().musicFile = 'willowbrook.mp3'
    await nextTick()
    expect(FakeAudio.last.paused).toBe(false)

    scope.stop()

    expect(FakeAudio.last.paused).toBe(true)
  })
})
