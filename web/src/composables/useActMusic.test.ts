// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useActMusic } from './useActMusic'
import { useGameStore } from '@/stores/useGameStore'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { MUSIC_DUCK, MUSIC_DUCK_FADE_MS } from './useMusic'

/** Lets the manifest fetch settle and the watchers run. */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}

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
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false })),
    )
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
    await settle()

    expect(FakeAudio.last.loop).toBe(true)
    expect(FakeAudio.last.src).toContain('willowbrook.mp3')
    scope.stop()
  })

  it('starts on the first click or key press (browsers block autoplay)', async () => {
    const scope = effectScope()
    scope.run(() => useActMusic())
    useGameStore().musicFile = 'willowbrook.mp3'
    await settle()
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
    await settle()
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
    await settle()
    expect(FakeAudio.last.paused).toBe(false)

    scope.stop()

    expect(FakeAudio.last.paused).toBe(true)
  })

  describe('chosen takes', () => {
    const MARKET = 'Conquest - Market (freetouse.com).mp3'
    const manifest = {
      market: { file: 'market.mp3', duration: 90 },
      'act1-village-square': { file: 'square.mp3', duration: 60 },
    }

    /** Starts the music with `manifest` served (or the fetch failing) and returns the scope. */
    async function start(
      served: unknown,
    ): Promise<ReturnType<typeof effectScope>> {
      vi.stubGlobal(
        'fetch',
        vi.fn(() =>
          served === null
            ? Promise.reject(new Error('offline'))
            : Promise.resolve({
                ok: true,
                json: () => Promise.resolve(served),
              }),
        ),
      )
      const scope = effectScope()
      scope.run(() => useActMusic())
      const game = useGameStore()
      game.musicFile = MARKET
      game.musicActName = 'Act1'
      game.musicRoomKey = 'VillageSquare'
      await settle()
      return scope
    }

    it("plays the room's chosen take in that room", async () => {
      const scope = await start(manifest)
      expect(FakeAudio.last.src).toBe('/audio/music/generated/square.mp3')
      scope.stop()
    })

    it("plays the act's chosen take in a room with none", async () => {
      const scope = await start(manifest)
      useGameStore().musicRoomKey = 'ForestPath'
      await settle()
      expect(FakeAudio.last.src).toBe('/audio/music/generated/market.mp3')
      scope.stop()
    })

    it("plays the game's own file where no take was chosen", async () => {
      const scope = await start({})
      expect(FakeAudio.last.src).toBe(
        `/audio/music/${encodeURIComponent(MARKET)}`,
      )
      scope.stop()
    })

    it("plays the game's own file when the manifest cannot be read", async () => {
      const scope = await start(null)
      expect(FakeAudio.last.src).toBe(
        `/audio/music/${encodeURIComponent(MARKET)}`,
      )
      scope.stop()
    })
  })
})
