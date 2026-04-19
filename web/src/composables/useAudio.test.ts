import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useAudio } from './useAudio'
import type { AudioFactory } from './useAudio'

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

function createMockFactory() {
  const playFn = vi.fn(() => Promise.resolve())
  const factory = vi.fn(() => ({ play: playFn })) as unknown as AudioFactory
  return { factory, playFn }
}

describe('useAudio', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // --- Initial state ---

  describe('initial state', () => {
    it('starts unmuted by default', () => {
      const { factory } = createMockFactory()
      const { soundMuted } = useAudio(factory)
      expect(soundMuted.value).toBe(false)
    })

    it('restores muted state from localStorage', () => {
      localStorage.setItem('retroquest_sfx_muted', 'true')
      const { factory } = createMockFactory()
      const { soundMuted } = useAudio(factory)
      expect(soundMuted.value).toBe(true)
    })
  })

  // --- playNewQuest ---

  describe('playNewQuest', () => {
    it('creates an audio element and plays it when unmuted', () => {
      const { factory, playFn } = createMockFactory()
      const { playNewQuest } = useAudio(factory)
      playNewQuest()
      expect(factory).toHaveBeenCalledOnce()
      expect(playFn).toHaveBeenCalledOnce()
    })

    it('uses the new-quest sound file path', () => {
      const { factory } = createMockFactory()
      const { playNewQuest } = useAudio(factory)
      playNewQuest()
      const src = (factory as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as string
      expect(src).toContain('Voicy_New%20Quest.mp3')
    })

    it('does not play when muted', () => {
      localStorage.setItem('retroquest_sfx_muted', 'true')
      const { factory, playFn } = createMockFactory()
      const { playNewQuest } = useAudio(factory)
      playNewQuest()
      expect(factory).not.toHaveBeenCalled()
      expect(playFn).not.toHaveBeenCalled()
    })

    it('silently catches autoplay rejection', async () => {
      const { factory, playFn } = createMockFactory()
      playFn.mockRejectedValue(new Error('NotAllowedError'))
      const { playNewQuest } = useAudio(factory)
      // Should not throw
      playNewQuest()
      await vi.waitFor(() => {
        expect(playFn).toHaveBeenCalled()
      })
    })
  })

  // --- playQuestComplete ---

  describe('playQuestComplete', () => {
    it('creates an audio element and plays it when unmuted', () => {
      const { factory, playFn } = createMockFactory()
      const { playQuestComplete } = useAudio(factory)
      playQuestComplete()
      expect(factory).toHaveBeenCalledOnce()
      expect(playFn).toHaveBeenCalledOnce()
    })

    it('uses the quest-complete sound file path', () => {
      const { factory } = createMockFactory()
      const { playQuestComplete } = useAudio(factory)
      playQuestComplete()
      const src = (factory as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as string
      expect(src).toContain('Voicy_Quest%20Completed.mp3')
    })

    it('does not play when muted', () => {
      localStorage.setItem('retroquest_sfx_muted', 'true')
      const { factory, playFn } = createMockFactory()
      const { playQuestComplete } = useAudio(factory)
      playQuestComplete()
      expect(factory).not.toHaveBeenCalled()
      expect(playFn).not.toHaveBeenCalled()
    })

    it('silently catches autoplay rejection', async () => {
      const { factory, playFn } = createMockFactory()
      playFn.mockRejectedValue(new Error('NotAllowedError'))
      const { playQuestComplete } = useAudio(factory)
      playQuestComplete()
      await vi.waitFor(() => {
        expect(playFn).toHaveBeenCalled()
      })
    })
  })

  // --- toggleMute ---

  describe('toggleMute', () => {
    it('toggles from unmuted to muted', () => {
      const { factory } = createMockFactory()
      const { toggleMute, soundMuted } = useAudio(factory)
      toggleMute()
      expect(soundMuted.value).toBe(true)
    })

    it('toggles from muted to unmuted', () => {
      localStorage.setItem('retroquest_sfx_muted', 'true')
      const { factory } = createMockFactory()
      const { toggleMute, soundMuted } = useAudio(factory)
      toggleMute()
      expect(soundMuted.value).toBe(false)
    })

    it('persists muted state to localStorage', () => {
      const { factory } = createMockFactory()
      const { toggleMute } = useAudio(factory)
      toggleMute()
      expect(localStorage.getItem('retroquest_sfx_muted')).toBe('true')
      toggleMute()
      expect(localStorage.getItem('retroquest_sfx_muted')).toBe('false')
    })

    it('silences sounds after being muted', () => {
      const { factory, playFn } = createMockFactory()
      const { toggleMute, playNewQuest } = useAudio(factory)
      toggleMute() // now muted
      playNewQuest()
      expect(factory).not.toHaveBeenCalled()
      expect(playFn).not.toHaveBeenCalled()
    })
  })
})
