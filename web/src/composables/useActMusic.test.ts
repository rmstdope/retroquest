// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useActMusic } from './useActMusic'
import { useGameStore } from '@/stores/useGameStore'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { FakeAudioContext } from '@/testing/fakeAudioContext'
import type * as SceneMixModule from '@/lantern/sceneMix'
import { SCENE_MIX, type SceneEntry } from '@/lantern/sceneMix'
import { roomTrackId } from '@/lantern/musicLists'
import {
  MUSIC_DUCK,
  MUSIC_DUCK_FADE_MS,
  MUSIC_FADE_IN_MS,
  MUSIC_THROUGH_MS,
} from './useMusic'

/** Scenes whose mix a test gives in place of the committed one. */
const mixOf = vi.hoisted(() => ({}) as Record<string, SceneEntry>)
vi.mock('@/lantern/sceneMix', async (importOriginal) => {
  const actual = await importOriginal<typeof SceneMixModule>()
  return {
    ...actual,
    sceneMixOf: (scene: string): SceneEntry | undefined =>
      mixOf[scene] ?? actual.sceneMixOf(scene),
  }
})

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

  it('fades the title page music in, and only that', async () => {
    vi.useFakeTimers()
    const scope = effectScope()
    scope.run(() => useActMusic())
    const game = useGameStore()
    game.showTitle = true
    game.musicFile = 'willowbrook.mp3'
    await vi.advanceTimersByTimeAsync(0)
    await nextTick()
    await vi.advanceTimersByTimeAsync(0)
    expect(FakeAudio.last.volume).toBe(0)
    await vi.advanceTimersByTimeAsync(MUSIC_FADE_IN_MS)
    expect(FakeAudio.last.volume).toBeCloseTo(1)
    scope.stop()
    vi.useRealTimers()
  })

  it('goes through the dark on a walk to another room on the picture stage, and only then', async () => {
    vi.useFakeTimers()
    const scope = effectScope()
    scope.run(() => useActMusic())
    const game = useGameStore()
    game.setScenePicture(true)
    game.musicActName = 'Act'
    game.musicRoomKey = 'Hall'
    game.musicFile = 'a.mp3'
    await vi.advanceTimersByTimeAsync(0)
    await nextTick()
    await vi.advanceTimersByTimeAsync(0)
    game.musicRoomKey = 'Garden'
    game.musicFile = 'b.mp3'
    await vi.advanceTimersByTimeAsync(0)
    await nextTick()
    await vi.advanceTimersByTimeAsync(0)
    const next = FakeAudio.last
    expect(next.src).toContain('b.mp3')
    // Silent while the old loop fades out, then rising.
    await vi.advanceTimersByTimeAsync(MUSIC_THROUGH_MS / 2 - 100)
    expect(next.volume).toBe(0)
    await vi.advanceTimersByTimeAsync(MUSIC_THROUGH_MS / 2 + 200)
    expect(next.volume).toBeCloseTo(1)
    scope.stop()
    vi.useRealTimers()
  })

  it('starts at full volume when there is no title page', async () => {
    const scope = effectScope()
    scope.run(() => useActMusic())
    useGameStore().musicFile = 'willowbrook.mp3'
    await settle()
    expect(FakeAudio.last.volume).toBe(1)
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

  it('comes back on the next input after a pause from outside the game', async () => {
    const scope = effectScope()
    scope.run(() => useActMusic())
    useGameStore().musicFile = 'willowbrook.mp3'
    await settle()
    window.dispatchEvent(new Event('click'))
    // A headset taken out: the browser pauses the playing element.
    FakeAudio.last.pause()
    FakeAudio.last.play.mockClear()

    window.dispatchEvent(new Event('keydown'))

    expect(FakeAudio.last.play).toHaveBeenCalledOnce()
    expect(FakeAudio.last.paused).toBe(false)
    scope.stop()
  })

  it('ignores a headset or media-key pause and play', async () => {
    const handlers: Record<string, (() => void) | null> = {}
    vi.stubGlobal('navigator', {
      ...navigator,
      mediaSession: {
        setActionHandler: (action: string, handler: (() => void) | null) => {
          handlers[action] = handler
        },
      },
    })
    const scope = effectScope()
    scope.run(() => useActMusic())
    useGameStore().musicFile = 'willowbrook.mp3'
    await settle()

    expect(handlers.pause).toBeTypeOf('function')
    expect(handlers.play).toBeTypeOf('function')
    expect(handlers.stop).toBeTypeOf('function')
    handlers.pause?.()
    expect(FakeAudio.last.paused).toBe(false)

    scope.stop()
    expect(handlers.pause).toBeNull()
    expect(handlers.play).toBeNull()
    expect(handlers.stop).toBeNull()
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
    /** The element the act's music plays on (a crossfade plays the next loop on a second one). */
    let mainAudio: FakeAudio
    const MARKET = 'Conquest - Market (freetouse.com).mp3'
    const manifest = {
      market: { file: 'market.mp3', duration: 90 },
      'act1-village-square': { file: 'square.mp3', duration: 60 },
    }

    // These rooms play what the game chooses, whatever music the committed mix names.
    beforeEach(() => {
      for (const room of ['VillageSquare', 'ForestPath'])
        mixOf[roomTrackId('Act1', room)] = { effects: [] }
    })
    afterEach(() => {
      for (const scene of Object.keys(mixOf)) delete mixOf[scene]
    })

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
      mainAudio = FakeAudio.last
      const game = useGameStore()
      game.musicFile = MARKET
      game.musicActName = 'Act1'
      game.musicRoomKey = 'VillageSquare'
      await settle()
      return scope
    }

    it("plays the room's chosen take in that room", async () => {
      const scope = await start(manifest)
      expect(mainAudio.src).toBe('/audio/music/generated/square.mp3')
      scope.stop()
    })

    it('credits a chosen take to Content Studio', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() =>
          Promise.resolve({ ok: true, json: () => Promise.resolve(manifest) }),
        ),
      )
      const scope = effectScope()
      const music = scope.run(() => useActMusic())
      const game = useGameStore()
      game.musicFile = MARKET
      game.musicInfo = 'Market by Conquest'
      game.musicActName = 'Act1'
      game.musicRoomKey = 'VillageSquare'
      await settle()
      expect(music?.musicInfo.value).toBe(
        'Original music for RetroQuest\n' +
          'Images, narration and music made with Content Studio',
      )
      scope.stop()
    })

    it('does not restart the music between two rooms without takes', async () => {
      const scope = await start({})
      mainAudio.play.mockClear()
      useGameStore().musicRoomKey = 'ForestPath'
      await settle()
      expect(mainAudio.play).not.toHaveBeenCalled()
      scope.stop()
    })

    it("plays the act's chosen take in a room with none", async () => {
      const scope = await start(manifest)
      useGameStore().musicRoomKey = 'ForestPath'
      await settle()
      // The new loop plays on the element that was not playing before.
      expect(FakeAudio.last).not.toBe(mainAudio)
      expect(FakeAudio.last.src).toBe('/audio/music/generated/market.mp3')
      expect(mainAudio.src).toBe('/audio/music/generated/square.mp3')
      expect(mainAudio.paused).toBe(false)
      scope.stop()
    })

    it('silences every loop when the scope ends mid-crossfade', async () => {
      const scope = await start(manifest)
      useGameStore().musicRoomKey = 'ForestPath'
      await settle()
      scope.stop()
      expect(mainAudio.paused).toBe(true)
      expect(FakeAudio.last.paused).toBe(true)
    })

    it("plays the game's own file where no take was chosen", async () => {
      const scope = await start({})
      expect(mainAudio.src).toBe(`/audio/music/${encodeURIComponent(MARKET)}`)
      scope.stop()
    })

    it("plays the game's own file when the manifest cannot be read", async () => {
      const scope = await start(null)
      expect(mainAudio.src).toBe(`/audio/music/${encodeURIComponent(MARKET)}`)
      scope.stop()
    })
  })
})

/**
 * Last in the file: the page's one AudioContext, once made, stays for every
 * test after.
 */
describe('useActMusic with the effects of a room', () => {
  let ctx: FakeAudioContext
  const DREAM_MUSIC = {
    'act1-the-dream': { file: 'dream.mp3', duration: 60 },
    'act1-old-mill': { file: 'mill.mp3', duration: 60 },
    'act1-abandoned-shed': { file: 'shed.mp3', duration: 60 },
    'act1-eliors-cottage': { file: 'cottage.mp3', duration: 60 },
  }
  const EFFECTS = {
    rain: { file: 'rain.mp3', duration: 20 },
    lightning: { file: 'lightning.mp3', duration: 4 },
    'wind-gusts': { file: 'wind.mp3', duration: 20 },
    'mechanism-whir': { file: 'whir.mp3', duration: 20 },
  }

  /** Serves the two manifests as JSON and any other file as audio. */
  function serve(): void {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve(
              url.startsWith('/audio/music/') ? DREAM_MUSIC : EFFECTS,
            ),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)),
        }),
      ),
    )
  }

  /** Lets the manifests, the fetches and the decodes settle. */
  async function ready(): Promise<void> {
    for (let i = 0; i < 3; i++) await settle()
  }

  /** How many gains the shared context had made when this test started (it lives on across tests). */
  let gainsBefore = 0
  /** How many sources it had made then. */
  let sourcesBefore = 0

  /**
   * The gain every effect plays into: the one, made in this test, out to the
   * speakers that an ambience's own gain connects to.
   */
  function effectsBus() {
    return ctx.gains
      .slice(gainsBefore)
      .find(
        (gain) =>
          gain.connect.mock.calls[0]?.[0] === ctx.destination &&
          ctx.gains.some((other) => other.connect.mock.calls[0]?.[0] === gain),
      )
  }

  /** Starts the music in Act I's room `roomKey`, in `soundState`, and returns the scope. */
  async function startIn(
    roomKey: string,
    soundState = '',
  ): Promise<ReturnType<typeof effectScope>> {
    gainsBefore = FakeAudioContext.last?.gains.length ?? 0
    sourcesBefore = FakeAudioContext.last?.sources.length ?? 0
    const scope = effectScope()
    scope.run(() => useActMusic())
    const game = useGameStore()
    game.musicFile = 'Conquest - Market (freetouse.com).mp3'
    game.musicActName = 'Act1'
    game.musicRoomKey = roomKey
    game.musicSoundState = soundState
    await ready()
    return scope
  }

  /** Starts the music in The Dream and returns the scope. */
  function startInTheDream(): Promise<ReturnType<typeof effectScope>> {
    return startIn('TheDream')
  }

  /** The loops sounding now: the music's and the effects'. */
  function loopsSounding() {
    return ctx.sources
      .slice(sourcesBefore)
      .filter((source) => source.loop && source.stop.mock.calls.length === 0)
  }

  beforeEach(() => {
    // The settings are saved; a test that turns the effects off must not leave them off.
    try {
      localStorage.clear()
    } catch {
      // No storage here: nothing was saved.
    }
    setActivePinia(createPinia())
    vi.stubGlobal('Audio', FakeAudio)
    vi.stubGlobal('AudioContext', FakeAudioContext)
    serve()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    for (const scene of Object.keys(mixOf)) delete mixOf[scene]
  })

  it("plays the rain round and round with The Dream's music", async () => {
    const scope = await startInTheDream()
    ctx = FakeAudioContext.last
    const loops = ctx.sources.filter((source) => source.loop)
    // The music's loop and the rain's.
    expect(loops).toHaveLength(2)
    for (const loop of loops) expect(loop.start).toHaveBeenCalled()
    scope.stop()
    for (const loop of loops) expect(loop.stop).toHaveBeenCalled()
  })

  it("plays the effects of the room's sound state, and follows it as it changes", async () => {
    const scope = await startIn('OldMill', 'whirring')
    ctx = FakeAudioContext.last
    // The music's loop, the wind's and the mechanism's whir.
    expect(loopsSounding()).toHaveLength(3)
    useGameStore().musicSoundState = 'jammed'
    await nextTick()
    // The whir falls silent; the music and the wind go on.
    expect(loopsSounding()).toHaveLength(2)
    scope.stop()
  })

  it("leaves the effects of a room it walks out of in that room's state", async () => {
    const scope = await startIn('OldMill', 'whirring')
    ctx = FakeAudioContext.last
    const mill = loopsSounding()
    expect(mill).toHaveLength(3)
    const game = useGameStore()
    game.musicRoomKey = 'TheDream'
    game.musicSoundState = ''
    await nextTick()
    // The mill fades out whole, its whir with it, while The Dream comes in.
    for (const loop of mill) expect(loop.stop).not.toHaveBeenCalled()
    scope.stop()
  })

  /** How often the clip file `name` was fetched. */
  function fetchesOf(name: string): number {
    return vi
      .mocked(fetch)
      .mock.calls.filter(
        ([url]) => String(url) === `/audio/soundeffects/generated/${name}`,
      ).length
  }

  /** Walks the music to Act I's room `roomKey` and lets it settle. */
  async function walkTo(roomKey: string): Promise<void> {
    const game = useGameStore()
    game.musicRoomKey = roomKey
    game.musicSoundState = ''
    await ready()
  }

  it('decodes a clip shared by two rooms once, walking from one to the other', async () => {
    const scope = await startIn('OldMill', 'whirring')
    await walkTo('AbandonedShed')
    expect(fetchesOf('wind.mp3')).toBe(1)
    scope.stop()
  })

  it('tries a clip that could not be had again in the next room', async () => {
    const served = vi.mocked(fetch).getMockImplementation()!
    let failed = false
    vi.mocked(fetch).mockImplementation((url) => {
      if (String(url).endsWith('/wind.mp3') && !failed) {
        failed = true
        return Promise.resolve({ ok: false } as Response)
      }
      return served(url)
    })
    const scope = await startIn('OldMill', 'whirring')
    await walkTo('AbandonedShed')
    expect(fetchesOf('wind.mp3')).toBe(2)
    scope.stop()
  })

  it('keeps the clips of the last two rooms only', async () => {
    const scope = await startIn('OldMill', 'whirring')
    await walkTo('TheDream')
    await walkTo('EliorsCottage')
    await walkTo('AbandonedShed')
    expect(fetchesOf('wind.mp3')).toBe(2)
    scope.stop()
  })

  /** Serves `manifest` as the chosen music's, everything else as before. */
  function serveMusic(manifest: Record<string, unknown>): void {
    const served = vi.mocked(fetch).getMockImplementation()!
    vi.mocked(fetch).mockImplementation((url) =>
      String(url).startsWith('/audio/music/') && String(url).endsWith('.json')
        ? Promise.resolve({
            ok: true,
            json: () => Promise.resolve(manifest),
          } as Response)
        : served(url),
    )
  }

  it("plays the room's effects under the act's own file when the room has no take", async () => {
    serveMusic({ 'act1-the-dream': DREAM_MUSIC['act1-the-dream'] })
    // The mill's effects, without the music the committed mix names.
    const mill = roomTrackId('Act1', 'OldMill')
    mixOf[mill] = { effects: SCENE_MIX[mill]?.effects ?? [] }
    const scope = await startIn('OldMill', 'whirring')
    ctx = FakeAudioContext.last
    // The act's file, the wind and the whir.
    expect(loopsSounding()).toHaveLength(3)
    scope.stop()
    expect(loopsSounding()).toHaveLength(0)
  })

  it("plays the effects of a room left before they arrived in that room's state", async () => {
    const served = vi.mocked(fetch).getMockImplementation()!
    let letWhirIn = (): void => {}
    const whirHeld = new Promise<void>((resolve) => (letWhirIn = resolve))
    vi.mocked(fetch).mockImplementation((url) =>
      String(url).endsWith('/whir.' + 'mp3')
        ? whirHeld.then(() => served(url))
        : served(url),
    )
    const scope = await startIn('OldMill', 'whirring')
    ctx = FakeAudioContext.last
    // Only the mill's music: its wind waits for the whir to be decoded.
    expect(loopsSounding()).toHaveLength(1)
    const game = useGameStore()
    game.musicRoomKey = 'TheDream'
    game.musicSoundState = ''
    await ready()
    letWhirIn()
    await ready()
    // The Dream's music and rain, and the mill's music, wind and whir as it fades out.
    expect(
      ctx.sources
        .slice(sourcesBefore)
        .filter((source) => source.loop && source.start.mock.calls.length > 0),
    ).toHaveLength(5)
    scope.stop()
  })

  it('keeps the state of the room the music starts in, for effects that arrive after it', async () => {
    const served = vi.mocked(fetch).getMockImplementation()!
    let letWhirIn = (): void => {}
    const whirHeld = new Promise<void>((resolve) => (letWhirIn = resolve))
    vi.mocked(fetch).mockImplementation((url) =>
      String(url).endsWith('/whir.' + 'mp3')
        ? whirHeld.then(() => served(url))
        : served(url),
    )
    sourcesBefore = FakeAudioContext.last?.sources.length ?? 0
    // The game is in the mill before the music starts.
    const game = useGameStore()
    game.musicFile = 'Conquest - Market (freetouse.com).mp3'
    game.musicActName = 'Act1'
    game.musicRoomKey = 'OldMill'
    game.musicSoundState = 'whirring'
    const scope = effectScope()
    scope.run(() => useActMusic())
    await ready()
    game.musicRoomKey = 'TheDream'
    game.musicSoundState = ''
    await ready()
    letWhirIn()
    await ready()
    ctx = FakeAudioContext.last
    // The Dream's music and rain, and the mill's music, wind and whir as it fades out.
    expect(
      ctx.sources
        .slice(sourcesBefore)
        .filter((source) => source.loop && source.start.mock.calls.length > 0),
    ).toHaveLength(5)
    scope.stop()
  })

  it('plays the effects but no music where the mix names no track', async () => {
    mixOf['act1-old-mill'] = {
      music: { track: null, level: 1 },
      effects: [{ id: 'wind-gusts', play: { mode: 'loop' }, level: 1 }],
    }
    const scope = await startIn('OldMill')
    ctx = FakeAudioContext.last
    // The wind alone: no music is fetched, from the takes or the act's file.
    expect(loopsSounding()).toHaveLength(1)
    expect(
      vi
        .mocked(fetch)
        .mock.calls.some(
          ([url]) =>
            String(url).includes('/mill.') || String(url).includes('Market'),
        ),
    ).toBe(false)
    scope.stop()
    expect(loopsSounding()).toHaveLength(0)
  })

  it("plays the music at the level the scene's mix gives it", async () => {
    /** The gain the music's loop (the first loop made) plays through. */
    const musicGain = (): number => levelOf(loopsSounding()[0])
    const plain = await startIn('OldMill')
    ctx = FakeAudioContext.last
    const atOne = musicGain()
    plain.stop()
    mixOf['act1-old-mill'] = {
      music: { track: 'act1-old-mill', level: 2 },
      effects: [],
    }
    const louder = await startIn('OldMill')
    expect(atOne).toBeGreaterThan(0)
    expect(musicGain()).toBeCloseTo(atOne * 2)
    louder.stop()
  })

  /** The level a source plays at: the gain it connects to. */
  function levelOf(source: { connect: { mock: { calls: unknown[][] } } }) {
    return (source.connect.mock.calls[0][0] as { gain: { value: number } }).gain
      .value
  }

  it('swaps the effects for the next room when the music carries on into it', async () => {
    const shared = DREAM_MUSIC['act1-old-mill']
    serveMusic({ 'act1-old-mill': shared, 'act1-abandoned-shed': shared })
    const scope = await startIn('OldMill', 'whirring')
    ctx = FakeAudioContext.last
    const [music, ...mill] = loopsSounding()
    expect(mill).toHaveLength(2)
    await walkTo('AbandonedShed')
    // The one music plays on; the mill's effects fade out for the shed's.
    expect(music.stop).not.toHaveBeenCalled()
    for (const loop of mill) expect(loop.stop).toHaveBeenCalled()
    expect(
      loopsSounding().filter((loop) => !mill.includes(loop)),
    ).not.toHaveLength(0)
    scope.stop()
    expect(loopsSounding()).toHaveLength(0)
  })

  describe('sound triggers', () => {
    /** The one-shots started since the test began. */
    function oneShots() {
      return ctx.sources.slice(sourcesBefore).filter((source) => !source.loop)
    }

    /** The cottage plays the rain whenever the game fires 'ding'. */
    function bindRainToDing(): void {
      mixOf['act1-eliors-cottage'] = {
        effects: [
          { id: 'rain', play: { mode: 'trigger', trigger: 'ding' }, level: 1 },
        ],
      }
    }

    it("plays the scene's effects bound to a trigger the game fires in the room", async () => {
      bindRainToDing()
      const scope = await startIn('EliorsCottage')
      ctx = FakeAudioContext.last
      expect(oneShots()).toHaveLength(0)
      useGameStore().musicSoundFirings = [
        { roomKey: 'EliorsCottage', trigger: 'ding' },
      ]
      await nextTick()
      expect(oneShots()).toHaveLength(1)
      expect(oneShots()[0].start).toHaveBeenCalled()
      scope.stop()
    })

    it('plays nothing for a trigger fired in another room, or one nothing is bound to', async () => {
      bindRainToDing()
      const scope = await startIn('EliorsCottage')
      ctx = FakeAudioContext.last
      useGameStore().musicSoundFirings = [
        { roomKey: 'TheDream', trigger: 'ding' },
        { roomKey: 'EliorsCottage', trigger: 'dong' },
      ]
      await nextTick()
      expect(oneShots()).toHaveLength(0)
      scope.stop()
    })

    it('plays a clip bound to a trigger and a state when the state is published with the firing', async () => {
      mixOf['act1-eliors-cottage'] = {
        effects: [
          {
            id: 'rain',
            play: { mode: 'trigger', trigger: 'ding' },
            state: 'warm',
            level: 1,
          },
        ],
      }
      const scope = await startIn('EliorsCottage')
      ctx = FakeAudioContext.last
      const game = useGameStore()
      game.musicSoundState = 'warm'
      game.musicSoundFirings = [{ roomKey: 'EliorsCottage', trigger: 'ding' }]
      await nextTick()
      expect(oneShots()).toHaveLength(1)
      scope.stop()
    })

    it('plays nothing while the effects volume is 0', async () => {
      bindRainToDing()
      useSettingsStore().effectsVolume = 0
      const scope = await startIn('EliorsCottage')
      ctx = FakeAudioContext.last
      useGameStore().musicSoundFirings = [
        { roomKey: 'EliorsCottage', trigger: 'ding' },
      ]
      await nextTick()
      expect(oneShots()).toHaveLength(0)
      scope.stop()
    })
  })

  it('fetches and plays no effects at all while the effects volume is 0', async () => {
    useSettingsStore().effectsVolume = 0
    const scope = await startInTheDream()
    ctx = FakeAudioContext.last
    const fetched = vi.mocked(fetch).mock.calls.map(([url]) => String(url))
    expect(
      fetched.some(
        (url) => url.includes('/soundeffects/') && url.endsWith('.mp3'),
      ),
    ).toBe(false)
    // Only the music's own loop.
    expect(loopsSounding()).toHaveLength(1)
    scope.stop()
  })

  it('plays the effects at the effects volume, and none with effects off', async () => {
    const settings = useSettingsStore()
    settings.effectsVolume = 40
    const scope = await startInTheDream()
    ctx = FakeAudioContext.last
    // The effects join the music as they are decoded.
    await vi.waitFor(() => expect(effectsBus()).toBeDefined())
    expect(effectsBus()?.gain.value).toBeCloseTo(0.4)
    settings.effectsVolume = 0
    await nextTick()
    expect(effectsBus()?.gain.value).toBe(0)
    settings.effectsVolume = 80
    await nextTick()
    expect(effectsBus()?.gain.value).toBeCloseTo(0.8)
    scope.stop()
  })
})
