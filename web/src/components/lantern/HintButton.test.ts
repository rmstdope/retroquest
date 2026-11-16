// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HintButton from './HintButton.vue'
import { useGameStore } from '@/stores/useGameStore'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { useArrivalStore } from '@/stores/useArrivalStore'

describe('HintButton', () => {
  let submit: ReturnType<typeof vi.fn<(command: string) => void>>

  beforeEach(() => {
    setActivePinia(createPinia())
    const game = useGameStore()
    game.acceptInput = true
    submit = vi.fn<(command: string) => void>()
    vi.spyOn(game, 'submitCommand').mockImplementation(submit)
  })

  it('reads "💡 Hint" and sends hint', async () => {
    const w = mount(HintButton)

    expect(w.text()).toBe('💡 Hint')
    expect(w.attributes('aria-label')).toBe('Hint')
    await w.trigger('click')
    expect(submit).toHaveBeenCalledWith('hint')
  })

  it('is the round 💡 alone when compact', () => {
    const w = mount(HintButton, { props: { compact: true } })

    expect(w.text()).toBe('💡')
    expect(w.attributes('aria-label')).toBe('Hint')
  })

  it('dims Hint while the game is not accepting input', async () => {
    useGameStore().acceptInput = false
    const w = mount(HintButton)

    expect(w.get('button').attributes('aria-disabled')).toBe('true')
    await w.get('button').trigger('click')
    expect(submit).not.toHaveBeenCalled()
  })

  it('dims Hint while a turn is read aloud', async () => {
    const narration = useNarrationStore()
    narration.setAudioFactory(() => ({
      volume: 1,
      currentTime: 0,
      onended: null,
      onerror: null,
      play: () => Promise.resolve(),
      pause: () => {},
    }))
    const w = mount(HintButton)
    narration.begin(
      1,
      [
        {
          kind: 'block',
          parts: [
            {
              markup: 'a b',
              clip: {
                file: 'x.mp3',
                speaker: 'narrator',
                duration: 2,
                words: [],
              },
            },
          ],
        },
      ],
      'act1',
    )
    await w.vm.$nextTick()
    const hint = w.get('button')

    expect(hint.attributes('aria-disabled')).toBe('true')
    await hint.trigger('click')
    expect(submit).not.toHaveBeenCalled()

    narration.skipAll()
    await w.vm.$nextTick()
    expect(hint.attributes('aria-disabled')).toBe('false')
  })

  it('offers Hint during a narrated arrival, and a press ends it and sends hint', async () => {
    const narration = useNarrationStore()
    narration.setAudioFactory(() => ({
      volume: 1,
      currentTime: 0,
      onended: null,
      onerror: null,
      play: () => Promise.resolve(),
      pause: () => {},
    }))
    const w = mount(HintButton)
    narration.begin(
      1,
      [
        {
          kind: 'block',
          parts: [
            {
              markup: 'a b',
              clip: {
                file: 'x.mp3',
                speaker: 'narrator',
                duration: 2,
                words: [],
              },
            },
          ],
        },
      ],
      'act1',
    )
    const arrival = useArrivalStore()
    arrival.show(
      1,
      [
        {
          kind: 'description',
          lines: [{ unit: 0, markup: 'a b' }],
          voiced: true,
        },
      ],
      true,
    )
    await w.vm.$nextTick()
    expect(narration.isNarrating).toBe(true)
    expect(arrival.active).toBe(true)
    const hint = w.get('button')

    expect(hint.attributes('aria-disabled')).toBe('false')
    await hint.trigger('click')
    expect(arrival.active).toBe(false)
    expect(narration.isNarrating).toBe(false)
    expect(submit).toHaveBeenCalledWith('hint')
  })
})
