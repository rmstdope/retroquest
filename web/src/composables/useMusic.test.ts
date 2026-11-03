import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick, ref } from 'vue'
import {
  MUSIC_CROSSFADE_MS,
  MUSIC_DUCK,
  MUSIC_DUCK_FADE_MS,
  MUSIC_FADE_IN_MS,
  useMusic,
} from './useMusic'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { FakeAudioContext } from '@/testing/fakeAudioContext'
import { sharedAudioContext } from './musicVoice'
import { Ambience } from './ambience'

/**
 * Minimal localStorage mock for Node test environment.
 */
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

function createMockAudio() {
  return {
    src: '',
    paused: true,
    volume: 1,
    play: vi.fn(function (this: { paused: boolean }) {
      this.paused = false
      return Promise.resolve()
    }),
    pause: vi.fn(function (this: { paused: boolean }) {
      this.paused = true
    }),
    load: vi.fn(),
    removeAttribute: vi.fn(),
  } as unknown as HTMLAudioElement
}

describe('useMusic', () => {
  let audio: HTMLAudioElement

  beforeEach(() => {
    audio = createMockAudio()
    localStorageMock.clear()
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // --- Initial state ---

  describe('initial state', () => {
    it('starts unmuted by default', () => {
      const { musicMuted } = useMusic(audio)
      expect(musicMuted.value).toBe(false)
    })

    it('restores muted state from localStorage', () => {
      localStorage.setItem('retroquest_music_muted', 'true')
      const { musicMuted } = useMusic(audio)
      expect(musicMuted.value).toBe(true)
    })

    it('has empty track info', () => {
      const { currentMusicFile, musicInfo } = useMusic(audio)
      expect(currentMusicFile.value).toBe('')
      expect(musicInfo.value).toBe('')
    })
  })

  // --- loadTrack ---

  describe('loadTrack', () => {
    it('sets audio src and plays when not muted', () => {
      const { loadTrack } = useMusic(audio)
      loadTrack('tavern.mp3', 'Tavern theme')
      expect(audio.src).toBe('/audio/music/tavern.mp3')
      expect(audio.play).toHaveBeenCalled()
    })

    it('keeps the folder of a file in a folder', () => {
      const { loadTrack } = useMusic(audio)
      loadTrack('generated/hall one.mp3', 'Made for RetroQuest')
      expect(audio.src).toBe('/audio/music/generated/hall%20one.mp3')
    })

    it('updates reactive state', () => {
      const { loadTrack, currentMusicFile, musicInfo } = useMusic(audio)
      loadTrack('forest.mp3', 'Forest ambience')
      expect(currentMusicFile.value).toBe('forest.mp3')
      expect(musicInfo.value).toBe('Forest ambience')
    })

    it('does not play when muted', () => {
      localStorage.setItem('retroquest_music_muted', 'true')
      const { loadTrack } = useMusic(audio)
      loadTrack('tavern.mp3', 'Tavern theme')
      expect(audio.src).toBe('/audio/music/tavern.mp3')
      expect(audio.play).not.toHaveBeenCalled()
    })

    it('skips reload if same file', () => {
      const { loadTrack } = useMusic(audio)
      loadTrack('tavern.mp3', 'Theme')
      ;(audio.play as ReturnType<typeof vi.fn>).mockClear()
      loadTrack('tavern.mp3', 'Theme')
      expect(audio.play).not.toHaveBeenCalled()
    })

    it('stops audio when file is empty', () => {
      const { loadTrack, currentMusicFile } = useMusic(audio)
      loadTrack('tavern.mp3', 'Theme')
      loadTrack('', '')
      expect(currentMusicFile.value).toBe('')
      expect(audio.pause).toHaveBeenCalled()
      expect(audio.removeAttribute).toHaveBeenCalledWith('src')
      expect(audio.load).toHaveBeenCalled()
    })

    it('encodes special characters in filename', () => {
      const { loadTrack } = useMusic(audio)
      loadTrack('my track (remix).mp3', 'Info')
      expect(audio.src).toBe('/audio/music/my%20track%20(remix).mp3')
    })

    it('silently catches autoplay rejection', async () => {
      ;(audio.play as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Autoplay blocked'),
      )
      const { loadTrack } = useMusic(audio)
      // Should not throw
      loadTrack('tavern.mp3', 'Theme')
      // Allow promise to settle
      await vi.waitFor(() => {
        expect(audio.play).toHaveBeenCalled()
      })
    })
  })

  describe('fading the first music in', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('rises from silence to the set volume over the fade time', async () => {
      useSettingsStore().musicVolume = 80
      const { loadTrack } = useMusic(audio)
      loadTrack('a.mp3', 'A', MUSIC_FADE_IN_MS)
      await vi.advanceTimersByTimeAsync(0)
      expect(audio.play).toHaveBeenCalled()
      expect(audio.volume).toBe(0)
      await vi.advanceTimersByTimeAsync(MUSIC_FADE_IN_MS / 2)
      expect(audio.volume).toBeGreaterThan(0)
      expect(audio.volume).toBeLessThan(0.8)
      await vi.advanceTimersByTimeAsync(MUSIC_FADE_IN_MS / 2)
      expect(audio.volume).toBeCloseTo(0.8)
    })

    it('lasts two seconds', () => {
      expect(MUSIC_FADE_IN_MS).toBe(2000)
    })

    it('starts at full volume without a fade time', () => {
      const { loadTrack } = useMusic(audio)
      loadTrack('a.mp3', 'A')
      expect(audio.volume).toBe(1)
    })

    it('does not ramp while muted', async () => {
      localStorage.setItem('retroquest_music_muted', 'true')
      const { loadTrack } = useMusic(audio)
      loadTrack('a.mp3', 'A', MUSIC_FADE_IN_MS)
      await vi.advanceTimersByTimeAsync(MUSIC_FADE_IN_MS)
      expect(audio.play).not.toHaveBeenCalled()
      expect(audio.volume).toBe(1)
    })

    it('ramps after the first input when autoplay was blocked', async () => {
      const play = audio.play as ReturnType<typeof vi.fn>
      play.mockRejectedValueOnce(new Error('Autoplay blocked'))
      const { loadTrack, ensureMusicStarted } = useMusic(audio)
      loadTrack('a.mp3', 'A', MUSIC_FADE_IN_MS)
      await vi.advanceTimersByTimeAsync(MUSIC_FADE_IN_MS * 3)
      expect(audio.volume).toBe(0)
      ensureMusicStarted()
      await vi.advanceTimersByTimeAsync(MUSIC_FADE_IN_MS)
      expect(audio.volume).toBeCloseTo(1)
    })

    it('keeps the ramp when a voice starts or ends before the sound does', async () => {
      const narrating = ref(false)
      let start: () => void = () => {}
      ;(audio.play as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise<void>((resolve) => (start = resolve)),
      )
      const { loadTrack } = useMusic(audio, narrating)
      loadTrack('a.mp3', 'A', MUSIC_FADE_IN_MS)
      narrating.value = true
      await vi.advanceTimersByTimeAsync(MUSIC_DUCK_FADE_MS * 2)
      expect(audio.volume).toBe(0)
      start()
      await vi.advanceTimersByTimeAsync(MUSIC_FADE_IN_MS)
      expect(audio.volume).toBeCloseTo(MUSIC_DUCK)
    })

    it('starts the ramp only when playback has started', async () => {
      let start: () => void = () => {}
      ;(audio.play as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise<void>((resolve) => (start = resolve)),
      )
      const { loadTrack } = useMusic(audio)
      loadTrack('a.mp3', 'A', MUSIC_FADE_IN_MS)
      await vi.advanceTimersByTimeAsync(MUSIC_FADE_IN_MS * 3)
      expect(audio.volume).toBe(0)
      start()
      await vi.advanceTimersByTimeAsync(MUSIC_FADE_IN_MS)
      expect(audio.volume).toBeCloseTo(1)
    })
  })

  // --- toggleMute ---

  describe('toggleMute', () => {
    it('toggles from unmuted to muted', () => {
      const { toggleMute, musicMuted } = useMusic(audio)
      toggleMute()
      expect(musicMuted.value).toBe(true)
      expect(audio.pause).toHaveBeenCalled()
    })

    it('toggles from muted to unmuted and plays', () => {
      localStorage.setItem('retroquest_music_muted', 'true')
      const { toggleMute, loadTrack, musicMuted } = useMusic(audio)
      loadTrack('tavern.mp3', 'Theme')
      ;(audio.play as ReturnType<typeof vi.fn>).mockClear()
      toggleMute()
      expect(musicMuted.value).toBe(false)
      expect(audio.play).toHaveBeenCalled()
    })

    it('stores the mute choice in the settings, not the old key', () => {
      const { toggleMute } = useMusic(audio)
      toggleMute()
      expect(useSettingsStore().musicOn).toBe(false)
      toggleMute()
      expect(useSettingsStore().musicOn).toBe(true)
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        'retroquest_music_muted',
        expect.anything(),
      )
    })

    it('does not play when unmuting with no track', () => {
      localStorage.setItem('retroquest_music_muted', 'true')
      const { toggleMute } = useMusic(audio)
      toggleMute()
      expect(audio.play).not.toHaveBeenCalled()
    })
  })

  // --- ensureMusicStarted ---

  describe('ensureMusicStarted', () => {
    it('retries play if track loaded and paused', () => {
      const { loadTrack, ensureMusicStarted } = useMusic(audio)
      loadTrack('tavern.mp3', 'Theme')
      ;(audio as { paused: boolean }).paused = true
      ;(audio.play as ReturnType<typeof vi.fn>).mockClear()
      ensureMusicStarted()
      expect(audio.play).toHaveBeenCalled()
    })

    it('does nothing when muted', () => {
      localStorage.setItem('retroquest_music_muted', 'true')
      const { loadTrack, ensureMusicStarted } = useMusic(audio)
      loadTrack('tavern.mp3', 'Theme')
      ;(audio.play as ReturnType<typeof vi.fn>).mockClear()
      ensureMusicStarted()
      expect(audio.play).not.toHaveBeenCalled()
    })

    it('does nothing when no track loaded', () => {
      const { ensureMusicStarted } = useMusic(audio)
      ensureMusicStarted()
      expect(audio.play).not.toHaveBeenCalled()
    })
  })

  // --- buildAttributionHtml ---

  describe('buildAttributionHtml', () => {
    it('returns empty string when no music info', () => {
      const { buildAttributionHtml } = useMusic(audio)
      expect(buildAttributionHtml()).toBe('')
    })

    it('renders attribution with track info', () => {
      const { loadTrack, buildAttributionHtml } = useMusic(audio)
      loadTrack('tavern.mp3', 'Tavern Theme by Artist')
      const html = buildAttributionHtml()
      expect(html).toContain('Now playing')
      expect(html).toContain('Tavern Theme by Artist')
    })

    it('linkifies URLs in music info', () => {
      const { loadTrack, buildAttributionHtml } = useMusic(audio)
      loadTrack('tavern.mp3', 'Track by Artist\nhttps://example.com/track')
      const html = buildAttributionHtml()
      expect(html).toContain('href="https://example.com/track"')
      expect(html).toContain('target="_blank"')
      expect(html).toContain('rel="noopener"')
    })

    it('escapes HTML in music info', () => {
      const { loadTrack, buildAttributionHtml } = useMusic(audio)
      loadTrack('tavern.mp3', '<script>alert("xss")</script>')
      const html = buildAttributionHtml()
      expect(html).not.toContain('<script>')
      expect(html).toContain('&lt;script&gt;')
    })

    it('handles multi-line info', () => {
      const { loadTrack, buildAttributionHtml } = useMusic(audio)
      loadTrack('t.mp3', 'Line 1\nLine 2\nLine 3')
      const html = buildAttributionHtml()
      expect(html).toContain('Line 1')
      expect(html).toContain('Line 2')
      expect(html).toContain('Line 3')
      expect(html).toContain('<br>')
    })

    it('skips blank lines', () => {
      const { loadTrack, buildAttributionHtml } = useMusic(audio)
      loadTrack('t.mp3', 'Line 1\n\n\nLine 2')
      const html = buildAttributionHtml()
      // Should not have consecutive <br>s for empty lines
      expect(html).not.toContain('<br><br>')
    })
  })

  // --- Dipping under narration ---

  describe('while a voice is narrating', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('fades down to the duck level, then back up when the voice ends', async () => {
      useSettingsStore().musicVolume = 50
      const narrating = ref(false)
      useMusic(audio, narrating)
      expect(audio.volume).toBe(0.5)

      narrating.value = true
      await nextTick()
      vi.advanceTimersByTime(MUSIC_DUCK_FADE_MS / 2)
      expect(audio.volume).toBeLessThan(0.5)
      expect(audio.volume).toBeGreaterThan(0.5 * MUSIC_DUCK)
      vi.advanceTimersByTime(MUSIC_DUCK_FADE_MS)
      expect(audio.volume).toBeCloseTo(0.5 * MUSIC_DUCK)

      narrating.value = false
      await nextTick()
      vi.advanceTimersByTime(MUSIC_DUCK_FADE_MS * 2)
      expect(audio.volume).toBeCloseTo(0.5)
    })

    it('keeps the dip when the volume setting changes during narration', async () => {
      const narrating = ref(true)
      useMusic(audio, narrating)
      vi.advanceTimersByTime(MUSIC_DUCK_FADE_MS * 2)
      useSettingsStore().musicVolume = 80
      await nextTick()
      vi.advanceTimersByTime(MUSIC_DUCK_FADE_MS * 2)
      expect(audio.volume).toBeCloseTo(0.8 * MUSIC_DUCK)
    })

    it('plays at full volume when nothing narrates', () => {
      useSettingsStore().musicVolume = 60
      useMusic(audio)
      expect(audio.volume).toBe(0.6)
    })
  })

  // --- Crossfade ---

  describe('crossfade between tracks', () => {
    /** An element that records its own volume, like the game's. */
    class FadeAudio {
      static made: FadeAudio[] = []
      src = ''
      loop = false
      currentTime = 0
      volume = 1
      paused = true
      srcSets: string[] = []
      play = vi.fn(() => {
        this.paused = false
        return Promise.resolve()
      })
      pause = vi.fn(() => {
        this.paused = true
      })
      constructor() {
        FadeAudio.made.push(this)
      }
    }

    beforeEach(() => {
      vi.useFakeTimers()
      FadeAudio.made = []
      vi.stubGlobal('Audio', FadeAudio)
      useSettingsStore().musicVolume = 50
    })
    afterEach(() => {
      vi.useRealTimers()
      vi.unstubAllGlobals()
    })

    /** A playing element that records every src it is given. */
    function playing(): FadeAudio {
      const el = new FadeAudio()
      el.paused = false
      let src = ''
      Object.defineProperty(el, 'src', {
        get: () => src,
        set: (value: string) => {
          src = value
          el.srcSets.push(value)
        },
      })
      FadeAudio.made = []
      return el
    }

    it('fades the playing element out untouched and the new loop in on another', () => {
      const el = playing()
      const { loadTrack } = useMusic(el as unknown as HTMLAudioElement)
      loadTrack('a.mp3', '')
      el.paused = false
      el.volume = 0.5
      loadTrack('b.mp3', '')

      const next = FadeAudio.made[0]
      expect(el.srcSets).toEqual([expect.stringContaining('a.mp3')])
      expect(el.paused).toBe(false)
      expect(next.src).toContain('b.mp3')
      expect(next.loop).toBe(true)
      expect(next.paused).toBe(false)
      expect(next.volume).toBe(0)

      vi.advanceTimersByTime(MUSIC_CROSSFADE_MS / 2)
      expect(el.volume).toBeGreaterThan(0)
      expect(el.volume).toBeLessThan(0.5)
      expect(next.volume).toBeGreaterThan(0)
      expect(next.volume).toBeLessThan(0.5)

      vi.advanceTimersByTime(MUSIC_CROSSFADE_MS)
      expect(el.volume).toBe(0)
      expect(el.paused).toBe(true)
      expect(next.volume).toBeCloseTo(0.5)
    })

    it('swaps the two elements on every later change', () => {
      const el = playing()
      const { loadTrack } = useMusic(el as unknown as HTMLAudioElement)
      loadTrack('a.mp3', '')
      el.paused = false
      loadTrack('b.mp3', '')
      vi.advanceTimersByTime(MUSIC_CROSSFADE_MS * 2)
      loadTrack('c.mp3', '')
      expect(FadeAudio.made).toHaveLength(1)
      expect(el.src).toContain('c.mp3')
      expect(el.paused).toBe(false)
      expect(FadeAudio.made[0].paused).toBe(false)
      vi.advanceTimersByTime(MUSIC_CROSSFADE_MS * 2)
      expect(FadeAudio.made[0].paused).toBe(true)
      expect(el.volume).toBeCloseTo(0.5)
    })

    it('carries on without a break when the same loop is loaded again', () => {
      const el = playing()
      const { loadTrack } = useMusic(el as unknown as HTMLAudioElement)
      loadTrack('a.mp3', '')
      el.paused = false
      loadTrack('a.mp3', '')
      expect(FadeAudio.made).toHaveLength(0)
      expect(el.volume).toBe(0.5)
    })

    it('silences both loops at once when the music is muted mid-fade', () => {
      const el = playing()
      const { loadTrack } = useMusic(el as unknown as HTMLAudioElement)
      loadTrack('a.mp3', '')
      el.paused = false
      loadTrack('b.mp3', '')
      vi.advanceTimersByTime(MUSIC_CROSSFADE_MS / 3)
      useSettingsStore().musicOn = false
      expect(el.paused).toBe(true)
      expect(FadeAudio.made[0].paused).toBe(true)
    })

    it('silences the fading loop when stopped', () => {
      const el = playing()
      const music = useMusic(el as unknown as HTMLAudioElement)
      music.loadTrack('a.mp3', '')
      el.paused = false
      music.loadTrack('b.mp3', '')
      music.stopCrossfade()
      expect(el.paused).toBe(true)
    })

    it('ducks the fading loop under a voice that starts mid-fade', async () => {
      const el = playing()
      const narrating = ref(false)
      const { loadTrack } = useMusic(
        el as unknown as HTMLAudioElement,
        narrating,
      )
      loadTrack('a.mp3', '')
      el.paused = false
      loadTrack('b.mp3', '')
      vi.advanceTimersByTime(MUSIC_CROSSFADE_MS / 10)
      narrating.value = true
      await nextTick()
      vi.advanceTimersByTime(MUSIC_CROSSFADE_MS / 10)
      expect(el.volume).toBeLessThanOrEqual(0.5 * 0.8 * MUSIC_DUCK + 1e-9)
    })

    it('fades the loop back up, without reloading it, when the player walks back', () => {
      const el = playing()
      const { loadTrack } = useMusic(el as unknown as HTMLAudioElement)
      loadTrack('a.mp3', '')
      el.paused = false
      el.volume = 0.5
      loadTrack('b.mp3', '')
      vi.advanceTimersByTime(MUSIC_CROSSFADE_MS / 2)
      const heard = el.volume
      loadTrack('a.mp3', '')
      expect(el.srcSets).toHaveLength(1)
      expect(el.paused).toBe(false)
      expect(el.volume).toBe(heard)
      vi.advanceTimersByTime(MUSIC_CROSSFADE_MS * 2)
      expect(el.volume).toBeCloseTo(0.5)
      expect(FadeAudio.made[0].paused).toBe(true)
    })

    it('keeps the volume, duck and mute controls on the new element after a crossfade', async () => {
      const el = playing()
      const narrating = ref(false)
      const music = useMusic(el as unknown as HTMLAudioElement, narrating)
      music.loadTrack('a.mp3', '')
      el.paused = false
      music.loadTrack('b.mp3', '')
      vi.advanceTimersByTime(MUSIC_CROSSFADE_MS * 2)
      const next = FadeAudio.made[0]

      useSettingsStore().musicVolume = 40
      await nextTick()
      expect(next.volume).toBeCloseTo(0.4)
      narrating.value = true
      await nextTick()
      vi.advanceTimersByTime(MUSIC_DUCK_FADE_MS * 2)
      expect(next.volume).toBeCloseTo(0.4 * MUSIC_DUCK)

      useSettingsStore().musicOn = false
      expect(next.paused).toBe(true)
      useSettingsStore().musicOn = true
      expect(next.paused).toBe(false)
    })

    it('ends with the newest loop alone when the room changes twice quickly', () => {
      const el = playing()
      const { loadTrack } = useMusic(el as unknown as HTMLAudioElement)
      loadTrack('a.mp3', '')
      el.paused = false
      loadTrack('b.mp3', '')
      vi.advanceTimersByTime(MUSIC_CROSSFADE_MS / 3)
      loadTrack('c.mp3', '')
      vi.advanceTimersByTime(MUSIC_CROSSFADE_MS * 2)
      const all = [el, ...FadeAudio.made]
      expect(all.filter((a) => !a.paused)).toHaveLength(1)
      const alive = all.find((a) => !a.paused)
      expect(alive?.src).toContain('c.mp3')
      expect(alive?.volume).toBeCloseTo(0.5)
    })

    it('cuts straight over when the music is not playing yet', () => {
      const el = playing()
      const { loadTrack } = useMusic(el as unknown as HTMLAudioElement)
      loadTrack('a.mp3', '')
      el.paused = true
      loadTrack('b.mp3', '')
      expect(FadeAudio.made).toHaveLength(0)
      expect(el.volume).toBe(0.5)
    })

    it('cuts straight over when the music is muted', () => {
      const el = playing()
      const { loadTrack } = useMusic(el as unknown as HTMLAudioElement)
      loadTrack('a.mp3', '')
      el.paused = false
      useSettingsStore().musicOn = false
      loadTrack('b.mp3', '')
      expect(FadeAudio.made).toHaveLength(0)
    })
  })

  // --- Settings ---

  describe('settings', () => {
    it('plays at the music volume from the settings', () => {
      useSettingsStore().musicVolume = 25
      useMusic(audio)
      expect(audio.volume).toBe(0.25)
    })

    it('follows volume changes', async () => {
      useMusic(audio)
      useSettingsStore().musicVolume = 40
      await nextTick()
      expect(audio.volume).toBe(0.4)
    })

    it('pauses when music is turned off in the settings', () => {
      const { loadTrack, musicMuted } = useMusic(audio)
      loadTrack('tavern.mp3', 'Theme')
      useSettingsStore().musicOn = false
      expect(musicMuted.value).toBe(true)
      expect(audio.pause).toHaveBeenCalled()
    })

    it('resumes the track when music is turned on in the settings', () => {
      const settings = useSettingsStore()
      settings.musicOn = false
      const { loadTrack } = useMusic(audio)
      loadTrack('tavern.mp3', 'Theme')
      expect(audio.play).not.toHaveBeenCalled()
      settings.musicOn = true
      expect(audio.play).toHaveBeenCalledTimes(1)
    })
  })
})

describe('useMusic on Web Audio', () => {
  const createdAudios: HTMLAudioElement[] = []
  let audio: HTMLAudioElement
  let ctx: FakeAudioContext

  /** Lets a pending fetch and decode settle. */
  async function ready(): Promise<void> {
    for (let i = 0; i < 5; i++) await Promise.resolve()
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  beforeEach(() => {
    audio = createMockAudio()
    createdAudios.length = 0
    vi.stubGlobal(
      'Audio',
      class {
        constructor() {
          const el = createMockAudio()
          createdAudios.push(el)
          return el
        }
      },
    )
    localStorageMock.clear()
    setActivePinia(createPinia())
    vi.stubGlobal('AudioContext', FakeAudioContext)
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)),
        }),
      ),
    )
    ctx = sharedAudioContext() as unknown as FakeAudioContext
    ctx.failDecode = false
    ctx.sources.length = 0
    ctx.gains.length = 0
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('starts the first music straight in at the set volume, with no ramp', async () => {
    const settings = useSettingsStore()
    settings.musicVolume = 60
    const music = useMusic(audio)
    music.loadTrack('a.mp3', 'A')
    expect(ctx.sources).toHaveLength(0)
    await ready()
    expect(ctx.sources).toHaveLength(1)
    expect(ctx.sources[0].loop).toBe(true)
    expect(ctx.gains.at(-1)?.gain.value).toBeCloseTo(0.6)
    expect(music.currentMusicFile.value).toBe('a.mp3')
    expect(audio.play).not.toHaveBeenCalled()
  })

  it('fades the first music in on Web Audio when asked to', async () => {
    vi.useFakeTimers()
    useSettingsStore().musicVolume = 100
    const music = useMusic(audio)
    music.loadTrack('a.mp3', 'A', MUSIC_FADE_IN_MS)
    await vi.advanceTimersByTimeAsync(0)
    expect(ctx.gains.at(-1)?.gain.value).toBe(0)
    await vi.advanceTimersByTimeAsync(MUSIC_FADE_IN_MS)
    expect(ctx.gains.at(-1)?.gain.value).toBeCloseTo(1)
  })

  it('starts the music ducked when a voice is already speaking', async () => {
    const narrating = ref(true)
    useSettingsStore().musicVolume = 100
    const music = useMusic(audio, narrating)
    music.loadTrack('a.mp3', 'A')
    await ready()
    expect(ctx.gains.at(-1)?.gain.value).toBeCloseTo(MUSIC_DUCK)
  })

  it('keeps the old music going, ducked, while the new loads, then crossfades', async () => {
    vi.useFakeTimers()
    const narrating = ref(false)
    useSettingsStore().musicVolume = 100
    const music = useMusic(audio, narrating)
    music.loadTrack('a.mp3', 'A')
    await vi.advanceTimersByTimeAsync(0)
    const first = ctx.gains.at(-1)!
    let release: () => void = () => {}
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            release = () =>
              resolve({
                ok: true,
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)),
              })
          }),
      ),
    )
    music.loadTrack('b.mp3', 'B')
    narrating.value = true
    await nextTick()
    await vi.advanceTimersByTimeAsync(MUSIC_DUCK_FADE_MS)
    expect(first.gain.value).toBeCloseTo(MUSIC_DUCK)
    expect(ctx.sources[0].stop).not.toHaveBeenCalled()
    expect(music.currentMusicFile.value).toBe('a.mp3')
    release()
    await vi.advanceTimersByTimeAsync(0)
    const second = ctx.gains.at(-1)!
    expect(second).not.toBe(first)
    expect(second.gain.value).toBe(0)
    await vi.advanceTimersByTimeAsync(MUSIC_CROSSFADE_MS)
    expect(second.gain.value).toBeCloseTo(MUSIC_DUCK)
    expect(ctx.sources[0].stop).toHaveBeenCalled()
    expect(music.currentMusicFile.value).toBe('b.mp3')
  })

  it('plays the room the player is in now when they move on before it is ready', async () => {
    const music = useMusic(audio)
    music.loadTrack('a.mp3', 'A')
    music.loadTrack('b.mp3', 'B')
    await ready()
    expect(ctx.sources).toHaveLength(1)
    expect(music.currentMusicFile.value).toBe('b.mp3')
  })

  it('plays the file on an element when it cannot be decoded, without a message', async () => {
    ctx.failDecode = true
    const music = useMusic(audio)
    music.loadTrack('a.mp3', 'A')
    await ready()
    expect(ctx.sources).toHaveLength(0)
    expect(audio.src).toBe('/audio/music/a.mp3')
    expect(audio.play).toHaveBeenCalled()
  })

  it('stays silent while muted and starts the loop when switched on', async () => {
    const settings = useSettingsStore()
    settings.musicOn = false
    const music = useMusic(audio)
    music.loadTrack('a.mp3', 'A')
    await ready()
    expect(ctx.sources).toHaveLength(0)
    settings.musicOn = true
    expect(ctx.sources).toHaveLength(1)
  })

  it('stops the loop when muted, and when the track is cleared', async () => {
    const settings = useSettingsStore()
    const music = useMusic(audio)
    music.loadTrack('a.mp3', 'A')
    await ready()
    settings.musicOn = false
    expect(ctx.sources[0].stop).toHaveBeenCalled()
    settings.musicOn = true
    music.loadTrack('', '')
    expect(ctx.sources.at(-1)?.stop).toHaveBeenCalled()
  })

  it('drops a load still under way when the track is cleared', async () => {
    const music = useMusic(audio)
    music.loadTrack('a.mp3', 'A')
    music.loadTrack('', '')
    await ready()
    expect(ctx.sources).toHaveLength(0)
  })

  it('goes on with the music playing when the player returns to its room while another loads', async () => {
    const music = useMusic(audio)
    music.loadTrack('a.mp3', 'A')
    await ready()
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    )
    music.loadTrack('b.mp3', 'B')
    music.loadTrack('a.mp3', 'A')
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(ctx.sources).toHaveLength(1)
    expect(ctx.sources[0].stop).not.toHaveBeenCalled()
    expect(music.currentMusicFile.value).toBe('a.mp3')
  })

  it('keeps playing after the track is cleared and two element tracks follow', async () => {
    vi.useFakeTimers()
    ctx.failDecode = true
    const music = useMusic(audio)
    music.loadTrack('', '')
    music.loadTrack('a.mp3', 'A')
    await vi.advanceTimersByTimeAsync(0)
    music.loadTrack('b.mp3', 'B')
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(MUSIC_CROSSFADE_MS + 100)
    expect(music.currentMusicFile.value).toBe('b.mp3')
    const sounding = [audio, ...createdAudios].filter(
      (el) => el.src.endsWith('b.mp3') && !el.paused,
    )
    expect(sounding).toHaveLength(1)
  })

  it('wakes the context on an input while the first music is still decoding', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    )
    const music = useMusic(audio)
    music.loadTrack('a.mp3', 'A')
    music.ensureMusicStarted()
    expect(ctx.resume).toHaveBeenCalled()
  })

  it('fades back up a loop still fading out when the player returns to its room', async () => {
    vi.useFakeTimers()
    useSettingsStore().musicVolume = 100
    const music = useMusic(audio)
    music.loadTrack('a.mp3', 'A')
    await vi.advanceTimersByTimeAsync(0)
    music.loadTrack('b.mp3', 'B')
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(MUSIC_CROSSFADE_MS / 2)
    const fetches = vi.mocked(fetch).mock.calls.length
    music.loadTrack('a.mp3', 'A')
    await vi.advanceTimersByTimeAsync(MUSIC_CROSSFADE_MS + 100)
    expect(vi.mocked(fetch).mock.calls.length).toBe(fetches)
    expect(music.currentMusicFile.value).toBe('a.mp3')
    expect(ctx.gains[0].gain.value).toBeCloseTo(1)
  })

  it('wakes a suspended context on a later input', async () => {
    const music = useMusic(audio)
    music.loadTrack('a.mp3', 'A')
    await ready()
    ctx.state = 'suspended'
    music.ensureMusicStarted()
    expect(ctx.resume).toHaveBeenCalled()
  })

  describe('with the effects of a track', () => {
    const rain = { duration: 20 } as unknown as AudioBuffer
    /** The ambiences made, by the file they were made for. */
    let made: { file: string; ambience: Ambience; gain: number }[]

    /** An ambience source giving `a.mp3` a rain loop and nothing else any. */
    function rainOnA(file: string, context: AudioContext) {
      if (file !== 'a.mp3') return Promise.resolve(null)
      const gain = ctx.gains.length
      const ambience = new Ambience(
        context,
        [{ buffer: rain, loops: true }],
        ctx as unknown as AudioNode,
      )
      made.push({ file, ambience, gain })
      return Promise.resolve(ambience)
    }

    /** The gain the rain of `a.mp3` sounds through. */
    function rainGain(): number {
      return ctx.gains[made[0].gain].gain.value
    }

    /** The sources playing the rain. */
    function rainSources() {
      return ctx.sources.filter((source) => source.buffer === rain)
    }

    beforeEach(() => {
      made = []
      ctx.state = 'running'
    })

    it('starts the effects with the music of their track, at the music’s share', async () => {
      useSettingsStore().musicVolume = 50
      const music = useMusic(audio, ref(false), rainOnA)
      music.loadTrack('a.mp3', 'A')
      await ready()
      expect(rainSources()).toHaveLength(1)
      expect(rainSources()[0].start).toHaveBeenCalled()
      expect(rainGain()).toBeCloseTo(1)
    })

    it('fades the effects in with the title page music', async () => {
      vi.useFakeTimers()
      const music = useMusic(audio, ref(false), rainOnA)
      music.loadTrack('a.mp3', 'A', MUSIC_FADE_IN_MS)
      await vi.advanceTimersByTimeAsync(0)
      expect(rainGain()).toBe(0)
      await vi.advanceTimersByTimeAsync(MUSIC_FADE_IN_MS / 2)
      expect(rainGain()).toBeCloseTo(0.5)
      await vi.advanceTimersByTimeAsync(MUSIC_FADE_IN_MS / 2)
      expect(rainGain()).toBeCloseTo(1)
    })

    it('fades the effects out with their music, then stops them', async () => {
      vi.useFakeTimers()
      const music = useMusic(audio, ref(false), rainOnA)
      music.loadTrack('a.mp3', 'A')
      await vi.advanceTimersByTimeAsync(0)
      music.loadTrack('b.mp3', 'B')
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(MUSIC_CROSSFADE_MS / 2)
      expect(rainGain()).toBeCloseTo(0.5)
      expect(rainSources()[0].stop).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(MUSIC_CROSSFADE_MS / 2)
      expect(rainGain()).toBe(0)
      expect(rainSources()[0].stop).toHaveBeenCalled()
    })

    it('stops the effects when the music is turned off, and starts them again with it', async () => {
      const settings = useSettingsStore()
      const music = useMusic(audio, ref(false), rainOnA)
      music.loadTrack('a.mp3', 'A')
      await ready()
      settings.musicOn = false
      expect(rainSources()[0].stop).toHaveBeenCalled()
      settings.musicOn = true
      expect(rainSources()).toHaveLength(2)
    })

    it('dips the effects with the music under a voice', async () => {
      vi.useFakeTimers()
      const narrating = ref(false)
      const music = useMusic(audio, narrating, rainOnA)
      music.loadTrack('a.mp3', 'A')
      await vi.advanceTimersByTimeAsync(0)
      narrating.value = true
      await nextTick()
      await vi.advanceTimersByTimeAsync(MUSIC_DUCK_FADE_MS)
      expect(rainGain()).toBeCloseTo(MUSIC_DUCK)
    })

    it('fades the effects back up when the player returns mid-fade', async () => {
      vi.useFakeTimers()
      const music = useMusic(audio, ref(false), rainOnA)
      music.loadTrack('a.mp3', 'A')
      await vi.advanceTimersByTimeAsync(0)
      music.loadTrack('b.mp3', 'B')
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(MUSIC_CROSSFADE_MS / 2)
      music.loadTrack('a.mp3', 'A')
      await vi.advanceTimersByTimeAsync(MUSIC_CROSSFADE_MS + 100)
      expect(rainGain()).toBeCloseTo(1)
      expect(rainSources()).toHaveLength(1)
      expect(rainSources()[0].stop).not.toHaveBeenCalled()
    })

    it('plays the music when its effects fail to prepare', async () => {
      const music = useMusic(audio, ref(false), () =>
        Promise.reject(new Error('bad manifest')),
      )
      music.loadTrack('a.mp3', 'A')
      await ready()
      expect(ctx.sources).toHaveLength(1)
      expect(ctx.sources[0].start).toHaveBeenCalled()
    })

    it('lets go of the effects of a track the player left before it was ready', async () => {
      const music = useMusic(audio, ref(false), rainOnA)
      music.loadTrack('a.mp3', 'A')
      music.loadTrack('b.mp3', 'B')
      await ready()
      expect(rainSources()).toHaveLength(0)
      expect(ctx.gains[made[0].gain].disconnect).toHaveBeenCalled()
    })
  })
})
