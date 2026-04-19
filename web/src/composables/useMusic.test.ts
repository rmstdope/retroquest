import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useMusic } from './useMusic'

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
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
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
      expect(audio.src).toBe('/src/retroquest/audio/music/tavern.mp3')
      expect(audio.play).toHaveBeenCalled()
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
      expect(audio.src).toBe('/src/retroquest/audio/music/tavern.mp3')
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
      expect(audio.src).toBe(
        '/src/retroquest/audio/music/my%20track%20(remix).mp3',
      )
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

    it('persists muted state to localStorage', () => {
      const { toggleMute } = useMusic(audio)
      toggleMute()
      expect(localStorage.getItem('retroquest_music_muted')).toBe('true')
      toggleMute()
      expect(localStorage.getItem('retroquest_music_muted')).toBe('false')
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
})
