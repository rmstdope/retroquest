import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAudio } from './useAudio'
import { SPELL_LEARNED_ID } from './questSounds'
import type { ChosenManifest } from './chosenMusic'
import { useSettingsStore } from '@/stores/useSettingsStore'
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
  const created: Array<{ play: typeof playFn; volume: number }> = []
  const factory = vi.fn(() => {
    const element = { play: playFn, volume: 1 }
    created.push(element)
    return element
  }) as unknown as AudioFactory
  return { factory, playFn, created }
}

describe('useAudio', () => {
  beforeEach(() => {
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

    it('stores the mute choice in the settings, not the old key', () => {
      const { factory } = createMockFactory()
      const { toggleMute } = useAudio(factory)
      toggleMute()
      expect(useSettingsStore().effectsOn).toBe(false)
      toggleMute()
      expect(useSettingsStore().effectsOn).toBe(true)
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        'retroquest_sfx_muted',
        expect.anything(),
      )
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

  // --- Settings ---

  describe('settings', () => {
    it('plays effects at the effects volume from the settings', () => {
      useSettingsStore().effectsVolume = 30
      const { factory, created } = createMockFactory()
      useAudio(factory).playQuestComplete()
      expect(created[0].volume).toBe(0.3)
    })

    it('stays silent when effects are turned off in the settings', () => {
      const { factory } = createMockFactory()
      const { playNewQuest, soundMuted } = useAudio(factory)
      useSettingsStore().effectsOn = false
      playNewQuest()
      expect(soundMuted.value).toBe(true)
      expect(factory).not.toHaveBeenCalled()
    })
  })

  describe('playNewSpell', () => {
    const TAKE: ChosenManifest = {
      [SPELL_LEARNED_ID]: { file: 'spell-learned.mp3', duration: 2.85 },
    }
    const loaded = (manifest: ChosenManifest) => () => Promise.resolve(manifest)
    const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

    it('plays the take chosen in the studio at the effects volume', async () => {
      const { factory, playFn, created } = createMockFactory()
      useSettingsStore().effectsVolume = 40
      const audio = useAudio(factory, loaded(TAKE))
      await flush()

      audio.playNewSpell()

      expect(factory).toHaveBeenCalledWith(
        '/audio/music/generated/spell-learned.mp3',
      )
      expect(created[0].volume).toBeCloseTo(0.4)
      expect(playFn).toHaveBeenCalledOnce()
    })

    it('rings once for each piece of spell news', async () => {
      const { factory, playFn } = createMockFactory()
      const audio = useAudio(factory, loaded(TAKE))
      await flush()
      audio.playNewSpell()
      audio.playNewSpell()
      expect(playFn).toHaveBeenCalledTimes(2)
    })

    it('is silent when no take was chosen', async () => {
      const { factory } = createMockFactory()
      const audio = useAudio(factory, loaded({}))
      await flush()
      audio.playNewSpell()
      expect(factory).not.toHaveBeenCalled()
    })

    it('is silent when the manifest cannot be read', async () => {
      const { factory } = createMockFactory()
      const audio = useAudio(factory, () => Promise.reject(new Error('down')))
      await flush()
      expect(() => audio.playNewSpell()).not.toThrow()
      expect(factory).not.toHaveBeenCalled()
    })

    it('is silent with sound effects off, and does not replay when they return', async () => {
      const { factory } = createMockFactory()
      const settings = useSettingsStore()
      settings.effectsOn = false
      const audio = useAudio(factory, loaded(TAKE))
      await flush()
      audio.playNewSpell()
      settings.effectsOn = true
      expect(factory).not.toHaveBeenCalled()
    })

    it('still plays with the music off', async () => {
      const { factory, playFn } = createMockFactory()
      const settings = useSettingsStore()
      settings.musicOn = false
      const audio = useAudio(factory, loaded(TAKE))
      await flush()
      audio.playNewSpell()
      expect(playFn).toHaveBeenCalledOnce()
    })

    it('shows nothing when the file fails to play', async () => {
      const failing = vi.fn(() => Promise.reject(new Error('no source')))
      const factory = vi.fn(() => ({ play: failing, volume: 1 }))
      const audio = useAudio(factory, loaded(TAKE))
      await flush()
      expect(() => audio.playNewSpell()).not.toThrow()
      await flush()
    })
  })
})
