// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { useGameStore } from '@/stores/useGameStore'
import {
  useSceneStore,
  SCENE_HALF_MS,
  INTERLUDE_FADE_MS,
} from '@/stores/useSceneStore'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { useArrivalStore } from '@/stores/useArrivalStore'
import { startedHoldStore } from '@/testing/holdGame'
import { useStageSpeechStore } from '@/stores/useStageSpeechStore'
import { useBridge, type ActClass } from '@/composables/useBridge'
import { readingPauseMs } from '@/lantern/stageSpeech'
import { readingTimeMs } from '@/lantern/stageArrival'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { parseTurn, type TurnBlock } from '@/lantern/parseTurn'
import { setPictureProbe } from '@/lantern/roomPicture'
import { Act1 } from '@/act1/Act1'
import { Key } from '@/act1/items/Key'
import { Game } from '@/engine'

/** The words of a block of a turn ('' for a checklist). */
function markupOf(block: TurnBlock): string {
  return block.kind === 'checklist' ? '' : block.markup
}

/**
 * The change of scene on the picture stage over the real engine: a move to a
 * room with another picture fades through the dark, and the move's words wait
 * until the new picture is fully up.
 */
describe('LanternLayout: change of scene', () => {
  let w: VueWrapper

  /** Mount a started game on the laptop stage (or the phone's), the Hall's picture up. */
  async function stage(
    phone = false,
  ): Promise<ReturnType<typeof useGameStore>> {
    setActivePinia(createPinia())
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: !phone && query.includes('min-width'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    const game = await startedHoldStore()
    game.showTitle = false
    w = mount(LanternLayout, { attachTo: document.body })
    await w.vm.$nextTick()
    // The Hall's picture loads and is up.
    game.musicRoomKey = 'Hall'
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    await w.get('img.lq-loading').trigger('load')
    return game
  }

  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    w.unmount()
    setPictureProbe(null)
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('moves through the dark and holds the words until the picture is up', async () => {
    const game = await stage()
    const scene = useSceneStore()
    expect(scene.shown).toContain('hall')
    game.submitCommand('go north')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    const turn = game.turns.at(-1)!
    expect(scene.turn).toBe(turn.id)
    expect(scene.holds(turn.id, 0)).toBe(true)
    expect(useNarrationStore().revealed(turn.id, 0)).toBe(false)
    // The new picture loads out of sight; the old one stays under the veil.
    await w.get('img.lq-loading').trigger('load')
    expect(w.classes('lq-scene-out') || w.find('.lq-scene-out').exists()).toBe(
      true,
    )
    // The room's name changes at the darkest moment.
    expect(game.roomName).toBe('Hall')
    vi.advanceTimersByTime(SCENE_HALF_MS)
    await w.vm.$nextTick()
    expect(game.roomName).toBe('Garden')
    expect(scene.holds(turn.id, 0)).toBe(true)
    vi.advanceTimersByTime(SCENE_HALF_MS)
    await w.vm.$nextTick()
    expect(scene.holds(turn.id, 0)).toBe(false)
    expect(useNarrationStore().revealed(turn.id, 0)).toBe(true)
    expect(scene.shown).toContain('garden')
  })

  it('brings the new room up at once on Enter', async () => {
    const game = await stage()
    const scene = useSceneStore()
    game.submitCommand('go north')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(scene.turn).not.toBeNull()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(scene.turn).toBeNull()
    expect(scene.phase).toBe('idle')
  })

  it('brings the new room up at once on a click on the picture', async () => {
    const game = await stage()
    const scene = useSceneStore()
    game.submitCommand('go north')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    await w.get('.lq-stage-picture').trigger('click')
    expect(scene.turn).toBeNull()
  })

  it('changes the room name when the change is skipped before the dark', async () => {
    const game = await stage()
    game.submitCommand('go north')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(game.roomName).toBe('Hall')
    await w.get('.lq-stage-picture').trigger('click')
    expect(game.roomName).toBe('Garden')
  })

  it('skips on an Enter pressed in an empty command box', async () => {
    const game = await stage()
    const scene = useSceneStore()
    game.submitCommand('go north')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    const input = w.find('input')
    if (input.exists()) await input.trigger('keydown', { key: 'Enter' })
    else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(scene.turn).toBeNull()
  })

  it('on a phone skips on an Enter on the folded Actions, which stays folded', async () => {
    const game = await stage(true)
    const scene = useSceneStore()
    game.submitCommand('go north')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(scene.turn).not.toBeNull()
    const actions = w.get('.lq-dock-open').element
    const enter = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    })
    actions.dispatchEvent(enter)
    expect(scene.turn).toBeNull()
    // Handled: the browser does not also press the button and open the sheet.
    expect(enter.defaultPrevented).toBe(true)
  })

  it('on a phone skips on a Space on the folded Actions, which stays folded', async () => {
    const game = await stage(true)
    const scene = useSceneStore()
    game.submitCommand('go north')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(scene.turn).not.toBeNull()
    const actions = w.get('.lq-dock-open').element
    const space = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
      cancelable: true,
    })
    actions.dispatchEvent(space)
    expect(scene.turn).toBeNull()
    // Handled, key-up too: the browser does not also press the button and
    // open the sheet.
    expect(space.defaultPrevented).toBe(true)
    const up = new KeyboardEvent('keyup', {
      key: ' ',
      bubbles: true,
      cancelable: true,
    })
    actions.dispatchEvent(up)
    expect(up.defaultPrevented).toBe(true)
  })

  it('a command during the change skips it and leaves the new room up', async () => {
    const game = await stage()
    const scene = useSceneStore()
    game.submitCommand('go north')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    const first = scene.turn
    game.submitCommand('look')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(first).not.toBeNull()
    expect(scene.holds(first!, 0)).toBe(false)
    // The room now up is the Garden's: looking again changes nothing.
    expect(scene.shown).toContain('garden')
    expect(scene.turn).toBeNull()
  })

  it('does not change scene under Reduce motion', async () => {
    const game = await stage()
    const scene = useSceneStore()
    document.documentElement.style.setProperty('--lq-motion', '0')
    game.submitCommand('go north')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(scene.turn).toBeNull()
    expect(game.roomName).toBe('Garden')
    document.documentElement.style.removeProperty('--lq-motion')
  })

  it('does not change scene when the picture stays the same', async () => {
    const game = await stage()
    const scene = useSceneStore()
    game.submitCommand('look')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(scene.turn).toBeNull()
    expect(useArrivalStore().active).toBe(false)
  })

  /** Mount Act I's opening dream on the laptop stage (or a phone), its picture up. */
  async function dream(
    phone = false,
  ): Promise<ReturnType<typeof useGameStore>> {
    setActivePinia(createPinia())
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: !phone && query.includes('min-width'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    // Act I has music, which jsdom cannot play.
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockReturnValue()
    const game = useGameStore()
    game.setBridge(useBridge(async (): Promise<ActClass[]> => [Act1]))
    await game.initGame()
    game.dismissModal()
    game.showTitle = false
    w = mount(LanternLayout, { attachTo: document.body })
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    await w.get('img.lq-loading').trigger('load')
    return game
  }

  it('tells the answer to the dream voice over the dream, and changes scene before the waking', async () => {
    const game = await dream()
    const scene = useSceneStore()
    const narration = useNarrationStore()
    expect(scene.shown).toContain('the-dream')
    game.submitCommand('talk to voice')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    const turn = game.turns.at(-1)!
    const blocks = parseTurn(turn.text)
    const waking = blocks.findIndex(
      (block) =>
        block.kind === 'text' && block.markup.startsWith('The dark lets go'),
    )
    // The words up to the voice's are told over the dream, in the dream; the
    // waking and the arrival in the middle wait.
    expect(scene.turn).toBeNull()
    expect(scene.shown).toContain('the-dream')
    expect(game.musicRoomKey).toBe('TheDream')
    expect(game.roomName).toBe('The Dream')
    expect(narration.revealed(turn.id, waking - 1)).toBe(true)
    expect(narration.revealed(turn.id, waking)).toBe(false)
    expect(useArrivalStore().active).toBe(false)
    const voice = useStageSpeechStore().visible.at(-1)!
    expect(voice.markup).toContain('let them rest')
    vi.advanceTimersByTime(readingPauseMs(voice.markup) - 1)
    expect(scene.turn).toBeNull()
    // Once the voice's line is read, the dream goes dark and the waking waits.
    vi.advanceTimersByTime(1)
    await w.vm.$nextTick()
    expect(scene.turn).toBe(turn.id)
    expect(game.musicRoomKey).toBe('EliorsCottage')
    expect(narration.revealed(turn.id, waking - 1)).toBe(true)
    expect(narration.revealed(turn.id, waking)).toBe(false)
    // In the dark the waking is told in the middle; the cottage waits.
    vi.advanceTimersByTime(3 * SCENE_HALF_MS)
    await w.vm.$nextTick()
    expect(scene.turn).toBe(turn.id)
    expect(scene.interlude?.unit).toBe(waking)
    expect(narration.revealed(turn.id, waking)).toBe(true)
    expect(useArrivalStore().active).toBe(false)
    // Once it is read, the cottage rises and its room is told.
    vi.advanceTimersByTime(readingTimeMs(markupOf(blocks[waking])))
    vi.advanceTimersByTime(INTERLUDE_FADE_MS + SCENE_HALF_MS)
    await w.vm.$nextTick()
    expect(scene.turn).toBeNull()
    expect(game.roomName).toBe("Elior's Cottage")
    expect(useArrivalStore().active).toBe(true)
  })

  /**
   * Press a button in a held panel (since the room card lists nothing, the
   * stage has no such button until the map opens): one stands in the stage.
   */
  async function pressHeldPanel(): Promise<void> {
    const panel = document.createElement('div')
    panel.setAttribute('data-panel', '')
    const button = document.createElement('button')
    panel.append(button)
    w.get('.lq-stage').element.append(panel)
    button.click()
    panel.remove()
    await w.vm.$nextTick()
  }

  /** Submit `talk to voice` and return the turn and the index of its waking paragraph. */
  async function answerVoice(
    game: ReturnType<typeof useGameStore>,
  ): Promise<{ id: number; waking: number }> {
    game.submitCommand('talk to voice')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    const turn = game.turns.at(-1)!
    const waking = parseTurn(turn.text).findIndex(
      (block) =>
        block.kind === 'text' && block.markup.startsWith('The dark lets go'),
    )
    return { id: turn.id, waking }
  }

  it('tells the waking in the middle of the dark, then raises the cottage with its name and description', async () => {
    const game = await dream()
    useSettingsStore().narrationOn = false
    const scene = useSceneStore()
    const turn = await answerVoice(game)
    const waking = markupOf(parseTurn(game.turns.at(-1)!.text)[turn.waking])
    const interlude = () => w.find('[data-testid="scene-interlude"]')
    const story = (): string => w.get('.lq-story').text()
    // The voice's line is read: the dream fades out.
    const voice = useStageSpeechStore().visible.at(-1)!
    vi.advanceTimersByTime(readingPauseMs(voice.markup))
    await w.vm.$nextTick()
    expect(scene.phase).toBe('out')
    await w.get('img.lq-loading').trigger('load')
    vi.advanceTimersByTime(SCENE_HALF_MS)
    await w.vm.$nextTick()
    // In the dark: the waking, in the middle, and nothing else.
    expect(scene.phase).toBe('dark')
    expect(interlude().text()).toContain('The dark lets go of you')
    expect(story()).not.toContain('The dark lets go of you')
    expect(useArrivalStore().active).toBe(false)
    // It is read; then the cottage rises, and its room is told in the middle.
    vi.advanceTimersByTime(readingTimeMs(waking) - 1)
    await w.vm.$nextTick()
    expect(scene.phase).toBe('dark')
    vi.advanceTimersByTime(1)
    await w.vm.$nextTick()
    // Its words fade out in the dark; then the cottage rises.
    expect(scene.interlude).toBeNull()
    expect(scene.phase).toBe('dark')
    vi.advanceTimersByTime(INTERLUDE_FADE_MS)
    await w.vm.$nextTick()
    expect(scene.phase).toBe('in')
    vi.advanceTimersByTime(SCENE_HALF_MS)
    await w.vm.$nextTick()
    expect(scene.phase).toBe('idle')
    expect(game.roomName).toBe("Elior's Cottage")
    expect(useArrivalStore().active).toBe(true)
    expect(w.get('[data-testid="arrival-on-picture"]').text()).toContain(
      "Elior's Cottage",
    )
    expect(story()).not.toContain('The dark lets go of you')
  })

  it('brings the cottage up at once on Enter during the waking', async () => {
    const game = await dream()
    useSettingsStore().narrationOn = false
    const scene = useSceneStore()
    await answerVoice(game)
    const voice = useStageSpeechStore().visible.at(-1)!
    vi.advanceTimersByTime(readingPauseMs(voice.markup))
    await w.vm.$nextTick()
    await w.get('img.lq-loading').trigger('load')
    vi.advanceTimersByTime(SCENE_HALF_MS)
    await w.vm.$nextTick()
    expect(scene.interlude).not.toBeNull()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    await w.vm.$nextTick()
    expect(scene.phase).toBe('idle')
    expect(scene.interlude).toBeNull()
    expect(game.roomName).toBe("Elior's Cottage")
  })

  it('keeps what was told in the dream before the talk until the room changes', async () => {
    const game = await dream()
    game.submitCommand('look')
    await w.vm.$nextTick()
    await vi.advanceTimersByTimeAsync(0)
    const looked = (): boolean =>
      w.get('.lq-story').text().includes('it is raining hard')
    expect(looked()).toBe(true)
    await answerVoice(game)
    // Over the dream, the look is still on the left.
    expect(looked()).toBe(true)
    await pressHeldPanel()
    await w.vm.$nextTick()
    expect(looked()).toBe(false)
  })

  it('under Reduce motion changes picture and room at the same point, with no fade', async () => {
    const game = await dream()
    const scene = useSceneStore()
    const narration = useNarrationStore()
    document.documentElement.style.setProperty('--lq-motion', '0')
    const turn = await answerVoice(game)
    expect(game.musicRoomKey).toBe('TheDream')
    expect(narration.revealed(turn.id, turn.waking)).toBe(false)
    const voice = useStageSpeechStore().visible.at(-1)!
    vi.advanceTimersByTime(readingPauseMs(voice.markup))
    await w.vm.$nextTick()
    expect(scene.turn).toBeNull()
    expect(game.musicRoomKey).toBe('EliorsCottage')
    expect(game.roomName).toBe("Elior's Cottage")
    expect(narration.revealed(turn.id, turn.waking)).toBe(true)
    document.documentElement.style.removeProperty('--lq-motion')
  })

  it('a press on a held panel before the scene changes brings the cottage up at once', async () => {
    const game = await dream()
    const scene = useSceneStore()
    const narration = useNarrationStore()
    const turn = await answerVoice(game)
    expect(game.panelsHeld).toBe(true)
    await pressHeldPanel()
    expect(scene.turn).toBeNull()
    expect(game.musicRoomKey).toBe('EliorsCottage')
    expect(game.roomName).toBe("Elior's Cottage")
    expect(game.panelsHeld).toBe(false)
    expect(narration.revealed(turn.id, turn.waking)).toBe(true)
  })

  it('a new command before the scene changes shows the whole answer at once, from the waking on', async () => {
    const game = await dream()
    const narration = useNarrationStore()
    const turn = await answerVoice(game)
    game.submitCommand('look')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(narration.revealed(turn.id, turn.waking)).toBe(true)
    const story = w.get('.lq-story').text()
    expect(story).toContain('The dark lets go of you')
    expect(story).not.toContain('You answer it')
    expect(story).not.toContain('talk to voice')
  })

  for (const phone of [false, true])
    it(`clears what was told in the dream once the room changes${phone ? ', on a phone' : ''}`, async () => {
      const game = await dream(phone)
      const scene = useSceneStore()
      await answerVoice(game)
      const story = (): string => w.get('.lq-story').text()
      /** The story shows no card that tells nothing. */
      const noEmptyCard = (): void =>
        expect(
          w
            .findAll('.lq-story [data-testid="turn"]')
            .map((card) => card.text().trim())
            .filter((text) => text === ''),
        ).toEqual([])
      expect(story()).toContain('The whisper comes once more')
      // The voice's line is read: the dream fades, and its words go with it.
      const voice = useStageSpeechStore().visible.at(-1)!
      vi.advanceTimersByTime(readingPauseMs(voice.markup))
      await w.vm.$nextTick()
      expect(scene.turn).not.toBeNull()
      expect(story()).not.toContain('You answer it')
      noEmptyCard()
      // A press brings the cottage up at once.
      await pressHeldPanel()
      await w.vm.$nextTick()
      expect(scene.turn).toBeNull()
      noEmptyCard()
      // The waking is told only in the middle of the dark, which the press skipped.
      expect(story()).not.toContain('The dark lets go of you')
      expect(story()).not.toContain('talk to voice')
      expect(story()).not.toContain('You answer it')
      expect(story()).not.toContain('The whisper comes once more')
      expect(story()).not.toContain('let them rest')
      expect(useStageSpeechStore().visible).toEqual([])
    })

  /** Give every line a recording whose voice ends when the test says; the voices made so far. */
  function recordEverything(): { onended: (() => void) | null }[] {
    const narration = useNarrationStore()
    const voices: { onended: (() => void) | null }[] = []
    narration.setAudioFactory(() => {
      const voice = {
        volume: 1,
        currentTime: 0,
        onended: null,
        onerror: null,
        play: (): Promise<void> => Promise.resolve(),
        pause: (): void => {},
      }
      voices.push(voice)
      return voice
    })
    const clip = { file: 'x.mp3', speaker: 'narrator', duration: 1, words: [] }
    vi.spyOn(narration, 'manifestFor').mockReturnValue(
      new Proxy({}, { get: () => clip }),
    )
    return voices
  }

  it('narrated, a skip before the change leaves only the waking on screen', async () => {
    const game = await dream()
    const narration = useNarrationStore()
    recordEverything()
    const turn = await answerVoice(game)
    expect(narration.narrates(turn.id)).toBe(true)
    narration.skipAll()
    await w.vm.$nextTick()
    const story = w.get('.lq-story').text()
    expect(game.musicRoomKey).toBe('EliorsCottage')
    expect(story).toContain('The dark lets go of you')
    expect(story).not.toContain('You answer it')
  })

  it('narrated, the narrator stops before the waking while the dream changes to the cottage', async () => {
    const game = await dream()
    const scene = useSceneStore()
    const narration = useNarrationStore()
    const voices = recordEverything()
    const turn = await answerVoice(game)
    expect(narration.narrates(turn.id)).toBe(true)
    for (let i = 0; i < 10 && !narration.atSceneChange(turn.id); i++) {
      voices.at(-1)?.onended?.()
      await vi.advanceTimersByTimeAsync(400)
    }
    expect(narration.atSceneChange(turn.id)).toBe(true)
    await w.vm.$nextTick()
    // The voice's line is told; the dream goes dark and the waking waits.
    expect(narration.revealed(turn.id, turn.waking - 1)).toBe(true)
    expect(narration.revealed(turn.id, turn.waking)).toBe(false)
    expect(scene.turn).toBe(turn.id)
    expect(game.musicRoomKey).toBe('EliorsCottage')
    const spoken = voices.length
    // In the dark the narrator reads the waking, in the middle; the cottage waits.
    await vi.advanceTimersByTimeAsync(3 * SCENE_HALF_MS)
    await w.vm.$nextTick()
    expect(scene.interlude?.unit).toBe(turn.waking)
    expect(narration.revealed(turn.id, turn.waking)).toBe(true)
    expect(voices.length).toBe(spoken + 1)
    expect(scene.turn).toBe(turn.id)
    // The waking is read: the narrator stops before the room, the cottage rises.
    voices.at(-1)?.onended?.()
    await vi.advanceTimersByTimeAsync(400)
    await w.vm.$nextTick()
    expect(scene.interlude).toBeNull()
    expect(narration.revealed(turn.id, turn.waking + 1)).toBe(false)
    await vi.advanceTimersByTimeAsync(INTERLUDE_FADE_MS + SCENE_HALF_MS)
    await w.vm.$nextTick()
    expect(scene.turn).toBeNull()
    expect(game.roomName).toBe("Elior's Cottage")
    expect(voices.length).toBe(spoken + 2)
    // The rest of the turn (its quest news rings) is not left to run after the test.
    narration.skipAll()
    await vi.runAllTimersAsync()
  })

  it("narrated, Enter during a moving talk's fade shows the new room and its name together", async () => {
    const game = await dream()
    const scene = useSceneStore()
    const narration = useNarrationStore()
    const voices = recordEverything()
    await answerVoice(game)
    for (let i = 0; i < 10 && scene.turn === null; i++) {
      voices.at(-1)?.onended?.()
      await vi.advanceTimersByTimeAsync(400)
    }
    expect(scene.phase).toBe('out')
    expect(game.roomName).toBe('The Dream')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(game.roomName).toBe("Elior's Cottage")
    narration.skipAll()
    await vi.runAllTimersAsync()
  })

  /** Act I at the locked shed with the key in the bag, on the stage, its picture up and the inside painted. */
  async function lockedShed(): Promise<ReturnType<typeof useGameStore>> {
    const saved = new Game([new Act1()])
    saved.state.currentRoom = saved.state.allRooms.AbandonedShed
    saved.state.addItemToInventory(new Key())
    const save = saved.toSaveData()
    vi.stubGlobal('localStorage', {
      getItem: (key: string): string | null =>
        key === 'retroquest_save' ? save : null,
      setItem: (): void => {},
      removeItem: (): void => {},
    })
    setPictureProbe(() => Promise.resolve(true))
    const game = await dream()
    game.loadGame()
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    await w.get('img.lq-loading').trigger('load')
    await vi.advanceTimersByTimeAsync(0)
    return game
  }

  it("narrated, Enter during the door's fade shows the inside and its names together", async () => {
    const game = await lockedShed()
    const scene = useSceneStore()
    const narration = useNarrationStore()
    const voices = recordEverything()
    game.submitCommand('use key with door')
    await w.vm.$nextTick()
    const turn = game.turns.at(-1)!
    expect(turn.pictureChanged).toBe(true)
    expect(narration.narrates(turn.id)).toBe(true)
    for (let i = 0; i < 10 && scene.turn === null; i++) {
      voices.at(-1)?.onended?.()
      await vi.advanceTimersByTimeAsync(400)
    }
    expect(scene.phase).toBe('out')
    expect(game.items.join()).toBe('shed door,boards')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(scene.shown).toContain('inside')
    expect(game.items.join()).toContain('mysterious box')
    narration.skipAll()
    await vi.runAllTimersAsync()
  })
})
