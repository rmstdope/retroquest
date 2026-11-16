import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { flushPromises } from '@vue/test-utils'
import { useUiSounds } from './useUiSounds'
import type { AudioFactory } from './useAudio'
import type { ChosenManifest } from './chosenMusic'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { TITLE_CHOOSE_EFFECT, TITLE_MOVE_EFFECT } from '@/lantern/effectLists'

const TAKES: ChosenManifest = {
  [TITLE_MOVE_EFFECT]: { file: 'title-move.mp3', duration: 1 },
  [TITLE_CHOOSE_EFFECT]: { file: 'title-choose.mp3', duration: 1 },
}

function player() {
  const made: Array<{
    src: string
    volume: number
    muted?: boolean
    play: ReturnType<typeof vi.fn>
  }> = []
  const factory = ((src: string) => {
    const element = {
      src,
      volume: 1,
      muted: undefined as boolean | undefined,
      play: vi.fn(() => Promise.resolve()),
    }
    made.push(element)
    return element
  }) as unknown as AudioFactory
  return { made, factory }
}

describe('useUiSounds', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('plays the chosen takes at the effects volume', async () => {
    const { made, factory } = player()
    useSettingsStore().effectsVolume = 40
    const sounds = useUiSounds(factory, () => Promise.resolve(TAKES))
    await flushPromises()
    sounds.playMove()
    sounds.playChoose()
    expect(made.map((m) => m.src)).toEqual([
      '/audio/soundeffects/generated/title-move.mp3',
      '/audio/soundeffects/generated/title-choose.mp3',
    ])
    expect(made[0].volume).toBe(0.4)
    expect(made[0].play).toHaveBeenCalledOnce()
  })

  it('is muted at volume 0', async () => {
    const { made, factory } = player()
    useSettingsStore().effectsVolume = 0
    const sounds = useUiSounds(factory, () => Promise.resolve(TAKES))
    await flushPromises()
    sounds.playMove()
    expect(made[0].muted).toBe(true)
  })

  it('is silent with no take, and with a manifest that cannot be read', async () => {
    const none = player()
    const a = useUiSounds(none.factory, () => Promise.resolve({}))
    const broken = player()
    const b = useUiSounds(broken.factory, () => Promise.reject(new Error('x')))
    await flushPromises()
    a.playMove()
    b.playChoose()
    expect(none.made).toEqual([])
    expect(broken.made).toEqual([])
  })
})
