import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { effectScope } from 'vue'
import { usePanelHold } from './usePanelHold'
import { useGameStore, type Turn } from '@/stores/useGameStore'
import {
  useNarrationStore,
  type NarrationAudio,
} from '@/stores/useNarrationStore'
import {
  SCENE_PAUSE_MS,
  firstQuestUnit,
  type NarrationUnit,
} from '@/lantern/narrationUnits'
import { parseTurn } from '@/lantern/parseTurn'
import { blockVoice } from '@/lantern/narrationScript'
import { GEM, startedHoldStore } from '@/testing/holdGame'
import { useBridge, type ActClass } from '@/composables/useBridge'
import { Act1 } from '@/act1/Act1'

/** A fake recording that never ends by itself. */
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

/** A voiced unit. */
function voiced(kind: NarrationUnit['kind']): NarrationUnit {
  return {
    kind,
    parts: [
      {
        markup: 'a',
        clip: { file: 'a.mp3', speaker: 'narrator', duration: 1, words: [] },
      },
    ],
  }
}

/** One silent unit per block of the turn, then a voiced one per arrival and quest card. */
function unitsOf(turn: Turn): NarrationUnit[] {
  const blocks = parseTurn(turn.text).map(
    (): NarrationUnit => ({ kind: 'block', parts: [] }),
  )
  return [
    ...blocks,
    ...(turn.arrival
      ? [{ ...voiced('arrival'), pauseBefore: SCENE_PAUSE_MS }]
      : []),
    ...(turn.quests ?? []).map(() => voiced('quest')),
  ]
}

describe('usePanelHold', () => {
  let game: ReturnType<typeof useGameStore>
  let narration: ReturnType<typeof useNarrationStore>
  let hold: ReturnType<typeof usePanelHold>

  beforeEach(async () => {
    vi.useFakeTimers()
    FakeAudio.all = []
    setActivePinia(createPinia())
    vi.stubGlobal('localStorage', {
      getItem: (): null => null,
      setItem: (): void => {},
      removeItem: (): void => {},
    })
    game = await startedHoldStore()
    game.markSeen('quests')
    narration = useNarrationStore()
    narration.setAudioFactory((src) => new FakeAudio(src))
    hold = effectScope().run(() => usePanelHold())!
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  /** Play a command and start narrating it as the layout does. */
  function narrate(command: string): Turn {
    game.submitCommand(command)
    const turn = game.turns.at(-1)!
    narration.begin(turn.id, unitsOf(turn), 'act1')
    hold.track(turn)
    return turn
  }

  it('releases the place when the arrival is revealed, with a flash', async () => {
    narrate('go north')
    await vi.advanceTimersByTimeAsync(0)
    expect(game.roomName).toBe('Hall')
    await vi.advanceTimersByTimeAsync(1100)
    expect(game.roomName).toBe('Garden')
    expect(game.panelFlash.place).toBe(1)
  })

  it('releases the quest count at the last quest card and the bag when the turn ends', async () => {
    const turn = narrate(`take ${GEM}`)
    expect(firstQuestUnit(turn)).toBe(parseTurn(turn.text).length)
    await vi.advanceTimersByTimeAsync(0)
    expect(game.activeQuests).toHaveLength(2)
    expect(game.rawInventory).toHaveLength(0)
    FakeAudio.all.at(-1)!.onended?.()
    await vi.advanceTimersByTimeAsync(0)
    expect(game.rawInventory).toHaveLength(1)
    expect(game.panelFlash.stock).toBe(1)
    expect(game.panelsHeld).toBe(false)
  })

  it('shows everything at once, without a flash, when the turn is skipped', async () => {
    narrate('go north')
    narration.skipAll()
    expect(game.roomName).toBe('Garden')
    expect(game.panelFlash.place).toBe(0)
    expect(game.panelsHeld).toBe(false)
  })

  it('catches up only while panels are held', async () => {
    narrate('go north')
    expect(hold.catchUp()).toBe(true)
    expect(narration.isNarrating).toBe(false)
    expect(game.roomName).toBe('Garden')
    expect(hold.catchUp()).toBe(false)
  })

  it('releases everything for a turn that did not start narrating', () => {
    game.submitCommand('go north')
    hold.settle(game.turns.at(-1)!)
    expect(game.roomName).toBe('Garden')
    expect(game.panelsHeld).toBe(false)
  })
})

describe('usePanelHold: the music of a narrated move', () => {
  let game: ReturnType<typeof useGameStore>
  let narration: ReturnType<typeof useNarrationStore>
  let hold: ReturnType<typeof usePanelHold>

  beforeEach(async () => {
    vi.useFakeTimers()
    FakeAudio.all = []
    setActivePinia(createPinia())
    vi.stubGlobal('localStorage', {
      getItem: (): null => null,
      setItem: (): void => {},
      removeItem: (): void => {},
    })
    game = useGameStore()
    game.setBridge(useBridge(async (): Promise<ActClass[]> => [Act1]))
    await game.initGame()
    game.dismissModal()
    game.setPanelHold(true)
    narration = useNarrationStore()
    narration.setAudioFactory((src) => new FakeAudio(src))
    hold = effectScope().run(() => usePanelHold())!
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  /** Every spoken block, the arrival and each quest card voiced. */
  function voicedUnitsOf(turn: Turn): NarrationUnit[] {
    return [
      ...parseTurn(turn.text).map(
        (block): NarrationUnit =>
          blockVoice(block) ? voiced('block') : { kind: 'block', parts: [] },
      ),
      ...(turn.arrival
        ? [{ ...voiced('arrival'), pauseBefore: SCENE_PAUSE_MS }]
        : []),
      ...(turn.quests ?? []).map(() => voiced('quest')),
    ]
  }

  /** End the voice being spoken and wait out the pause after it. */
  async function endVoice(): Promise<void> {
    FakeAudio.all.at(-1)!.onended?.()
    await vi.advanceTimersByTimeAsync(400)
  }

  it('keeps The Dream’s music until the wake-up text begins', async () => {
    expect(game.musicRoomKey).toBe('TheDream')
    game.submitCommand('talk to voice')
    const turn = game.turns.at(-1)!
    narration.begin(turn.id, voicedUnitsOf(turn), 'act1')
    hold.track(turn)
    await vi.advanceTimersByTimeAsync(0)

    // "You answer it…"
    expect(game.musicRoomKey).toBe('TheDream')
    await endVoice()
    // "…and let them rest…"
    expect(game.musicRoomKey).toBe('TheDream')
    await endVoice()
    // "You wake in your own bed…"
    expect(game.musicRoomKey).toBe('EliorsCottage')
  })
})
