// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useGameStore, type Turn } from '@/stores/useGameStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import {
  useNarrationStore,
  type NarrationAudio,
} from '@/stores/useNarrationStore'
import { narrationKey } from '@/lantern/narrationKey'
import { narrationWords } from '@/lantern/narrationManifest'
import {
  useLanternPresentation,
  type LanternPresentation,
} from './useLanternPresentation'

/**
 * The coordinator of the Lantern's presentations, over the real stores: when
 * a story turn's or a chapter page's narration starts, what stops it, and
 * that nothing stale starts after the moment has passed.
 */
describe('useLanternPresentation', () => {
  const FIRST = 'Rain falls.'
  const SECOND = 'Then it stops.'
  const CALL = 'Act I: The Call'
  const ROAD = 'Act I: The Road'
  const BODY = 'The wind rises.'
  /** The recording each line is read from, by line. */
  const FILES: Record<string, string> = {
    [FIRST]: 'first.mp3',
    [SECOND]: 'second.mp3',
    [CALL]: 'call.mp3',
    [ROAD]: 'road.mp3',
    [BODY]: 'body.mp3',
  }
  const CALL_PAGE = {
    kind: 'intro' as const,
    act: 'Act I',
    title: 'The Call',
    body: BODY,
  }
  const ROAD_PAGE = { ...CALL_PAGE, title: 'The Road' }

  /** The recordings played, in order. */
  const played: string[] = []
  let wrapper: VueWrapper | null = null
  /** What the mounted component was given to call. */
  let presentation: LanternPresentation | null = null
  /** Lets the act's recordings arrive (the manifest's fetch answers). */
  let deliver: () => void = () => undefined

  /** A turn of two lines the act has recordings for. */
  function narratedTurn(id: number): Turn {
    return {
      id,
      command: 'look',
      text: `${FIRST}\n${SECOND}`,
      room: 'Square',
      description: null,
      gained: [],
      lost: [],
      arrival: null,
      narrate: true,
    }
  }

  /** The act's manifest, held back until `deliver` when `held`. */
  function stubRecordings(held: boolean): void {
    const manifest = Object.fromEntries(
      Object.entries(FILES).map(([line, file]) => [
        narrationKey('narrator', line),
        {
          file,
          speaker: 'narrator',
          duration: 5,
          words: narrationWords(line).map((word, i) => ({
            word,
            start: i,
            end: i + 1,
          })),
        },
      ]),
    )
    const answer = { ok: true, json: async () => manifest }
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            if (held) deliver = () => resolve(answer)
            else resolve(answer)
          }),
      ),
    )
  }

  /** Mount a component that uses the coordinator, off the picture stage. */
  async function present(held = false): Promise<void> {
    stubRecordings(held)
    useNarrationStore().setAudioFactory((src) => {
      played.push(src.split('/').at(-1) ?? src)
      const audio: NarrationAudio = {
        volume: 1,
        currentTime: 0,
        onended: null,
        onerror: null,
        play: () => Promise.resolve(),
        pause: () => undefined,
      }
      return audio
    })
    const game = useGameStore()
    game.actLabel = 'Act I'
    game.showTitle = false
    const Host = defineComponent({
      setup() {
        presentation = useLanternPresentation({
          staged: () => false,
          motionReduced: () => false,
        })
        return () => h('div')
      },
    })
    wrapper = mount(Host)
    await vi.advanceTimersByTimeAsync(0)
  }

  /** Open chapter page `page` over the game (going on is the engine's, not wanted here). */
  async function openChapter(page: typeof CALL_PAGE): Promise<void> {
    const game = useGameStore()
    vi.spyOn(game, 'continueChapter').mockImplementation(() => {})
    game.modalChapter = page
    game.showModal = true
    await vi.advanceTimersByTimeAsync(0)
  }

  beforeEach(() => {
    vi.useFakeTimers()
    played.length = 0
    try {
      localStorage.clear()
    } catch {
      // No storage in this environment.
    }
    setActivePinia(createPinia())
    useSettingsStore().narrationOn = true
  })
  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  /** A new turn of the story comes. */
  async function say(turn: Turn): Promise<void> {
    useGameStore().turns.push(turn)
    await vi.advanceTimersByTimeAsync(0)
  }

  describe('story turns', () => {
    it('cuts in: a new turn ends the one being told and is told itself', async () => {
      await present()
      const narration = useNarrationStore()
      await say(narratedTurn(1))
      expect(narration.narrates(1)).toBe(true)
      await say(narratedTurn(2))
      expect(narration.narrates(1)).toBe(false)
      expect(narration.narrates(2)).toBe(true)
      expect(played).toEqual(['first.mp3', 'first.mp3'])
    })

    it('a pop-up interrupts the story, and closing it does not resume it', async () => {
      await present()
      const game = useGameStore()
      const narration = useNarrationStore()
      await say(narratedTurn(1))
      game.showModal = true
      await vi.advanceTimersByTimeAsync(0)
      expect(narration.isNarrating).toBe(false)
      game.showModal = false
      await vi.advanceTimersByTimeAsync(5000)
      expect(narration.isNarrating).toBe(false)
      expect(played).toEqual(['first.mp3'])
    })

    it('switching narration off ends the turn being told', async () => {
      await present()
      await say(narratedTurn(1))
      expect(useNarrationStore().isNarrating).toBe(true)
      useSettingsStore().narrationOn = false
      await vi.advanceTimersByTimeAsync(0)
      expect(useNarrationStore().isNarrating).toBe(false)
    })

    it('stops the voice when its component goes', async () => {
      await present()
      await say(narratedTurn(1))
      expect(useNarrationStore().isNarrating).toBe(true)
      wrapper?.unmount()
      wrapper = null
      expect(useNarrationStore().isNarrating).toBe(false)
    })
  })

  describe('chapter pages', () => {
    it("reads a chapter page once its act's recordings are in", async () => {
      await present(true)
      await openChapter(CALL_PAGE)
      expect(useNarrationStore().isNarrating).toBe(false)
      deliver()
      await vi.advanceTimersByTimeAsync(0)
      expect(useNarrationStore().isNarrating).toBe(true)
      expect(played).toEqual(['call.mp3'])
    })

    it('reads nothing for a chapter page closed while its recordings load', async () => {
      await present(true)
      await openChapter(CALL_PAGE)
      useGameStore().showModal = false
      await vi.advanceTimersByTimeAsync(0)
      deliver()
      await vi.advanceTimersByTimeAsync(0)
      expect(useNarrationStore().isNarrating).toBe(false)
      expect(played).toEqual([])
    })

    it('reads the page that replaced another while the recordings loaded, not the old one', async () => {
      await present(true)
      await openChapter(CALL_PAGE)
      useGameStore().modalChapter = ROAD_PAGE
      await vi.advanceTimersByTimeAsync(0)
      deliver()
      await vi.advanceTimersByTimeAsync(0)
      expect(played).toEqual(['road.mp3'])
    })

    it('waits for the title page to go before reading', async () => {
      await present()
      const game = useGameStore()
      game.showTitle = true
      await openChapter(CALL_PAGE)
      expect(useNarrationStore().isNarrating).toBe(false)
      game.showTitle = false
      await vi.advanceTimersByTimeAsync(0)
      expect(played).toEqual(['call.mp3'])
    })

    it("stops the page's voice before the game goes on", async () => {
      await present()
      await openChapter(CALL_PAGE)
      const game = useGameStore()
      let voiceWhenGoingOn: boolean | null = null
      vi.spyOn(game, 'continueChapter').mockImplementation(() => {
        voiceWhenGoingOn = useNarrationStore().isNarrating
      })
      expect(useNarrationStore().isNarrating).toBe(true)
      presentation?.continueChapter()
      expect(voiceWhenGoingOn).toBe(false)
    })
  })
})
