/** The room effect levels the dev panel sets, and their saving to the volumes file. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { EFFECT_VOLUMES_URL } from '@/lantern/effectVolumes'
import { SAVE_DELAY_MS, useEffectMixStore } from './useEffectMixStore'

const DREAM = 'act1-the-dream'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.useFakeTimers()
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok: true })),
  )
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useEffectMixStore', () => {
  it('starts at the saved volumes, each effect at 1 where none is set', () => {
    const mix = useEffectMixStore()
    expect(mix.volumeOf(DREAM, 'lightning')).toBe(1)
  })

  it('sets the volume of one effect of one room', () => {
    const mix = useEffectMixStore()
    mix.setVolume(DREAM, 'lightning', 2.5)
    expect(mix.volumeOf(DREAM, 'lightning')).toBe(2.5)
    expect(mix.volumeOf(DREAM, 'rain')).toBe(1)
  })

  it('saves the volumes once the slider rests, the latest only', async () => {
    const mix = useEffectMixStore()
    mix.setVolume(DREAM, 'lightning', 2)
    mix.setVolume(DREAM, 'lightning', 2.5)
    expect(mix.saveState).toBe('saving')
    await vi.advanceTimersByTimeAsync(SAVE_DELAY_MS)
    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe(EFFECT_VOLUMES_URL)
    expect(init?.method).toBe('PUT')
    expect(JSON.parse(String(init?.body))).toEqual({
      [DREAM]: { lightning: 2.5 },
    })
    expect(mix.saveState).toBe('saved')
  })

  it('stays saving while a newer change waits, and only the latest save says saved', async () => {
    let answer = (_ok: boolean): void => {}
    vi.mocked(fetch).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          answer = (ok) => resolve({ ok } as Response)
        }),
    )
    const mix = useEffectMixStore()
    mix.setVolume(DREAM, 'rain', 0.5)
    await vi.advanceTimersByTimeAsync(SAVE_DELAY_MS)
    mix.setVolume(DREAM, 'rain', 0.4)
    answer(true)
    await vi.advanceTimersByTimeAsync(0)
    expect(mix.saveState).toBe('saving')
    await vi.advanceTimersByTimeAsync(SAVE_DELAY_MS)
    expect(mix.saveState).toBe('saved')
  })

  it('says so when the volumes could not be saved', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response)
    const mix = useEffectMixStore()
    mix.setVolume(DREAM, 'rain', 0.5)
    await vi.advanceTimersByTimeAsync(SAVE_DELAY_MS)
    expect(mix.saveState).toBe('failed')
  })

  it('asks for a one-shot to be played now, each time anew', () => {
    const mix = useEffectMixStore()
    mix.playNow(DREAM, 'lightning')
    const first = mix.request
    mix.playNow(DREAM, 'lightning')
    expect(mix.request).toEqual({
      track: DREAM,
      id: 'lightning',
      n: (first?.n ?? 0) + 1,
    })
  })

  it('solos one effect of a room, and lets it go when asked again', () => {
    const mix = useEffectMixStore()
    mix.toggleSolo(DREAM, 'rain')
    expect(mix.soloed).toEqual({ track: DREAM, id: 'rain' })
    mix.toggleSolo(DREAM, 'rain')
    expect(mix.soloed).toBeNull()
  })
})
