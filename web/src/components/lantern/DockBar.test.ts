// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DockBar from './DockBar.vue'
import { useGameStore } from '@/stores/useGameStore'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { useSettingsStore } from '@/stores/useSettingsStore'

describe('DockBar', () => {
  let submit: ReturnType<typeof vi.fn<(command: string) => void>>

  beforeEach(() => {
    setActivePinia(createPinia())
    const game = useGameStore()
    game.acceptInput = true
    game.exits = { north: "Mira's Hut", secret_passage: 'Hidden Library' }
    submit = vi.fn<(command: string) => void>()
    vi.spyOn(game, 'submitCommand').mockImplementation(submit)
  })

  it('offers the exits as small arrow buttons', async () => {
    const w = mount(DockBar)
    const north = w.get(`button[aria-label="Go north to Mira's Hut"]`)

    expect(north.text()).toBe('↑')
    await north.trigger('click')
    expect(submit).toHaveBeenCalledWith('go north')
    expect(
      w
        .find('button[aria-label="Go Secret Passage to Hidden Library"]')
        .exists(),
    ).toBe(true)
  })

  it('opens the actions', async () => {
    const w = mount(DockBar)

    await w.get('button.lq-dock-open').trigger('click')

    expect(w.get('button.lq-dock-open').text()).toBe('Actions ▴')
    expect(w.emitted('open')).toEqual([['actions']])
  })

  it('opens straight into typing', async () => {
    const w = mount(DockBar)

    await w.get('button[aria-label="Type a command"]').trigger('click')

    expect(w.emitted('open')).toEqual([['type']])
  })

  it('disables the exits while the game is not accepting input', () => {
    useGameStore().acceptInput = false

    expect(
      mount(DockBar).get('button[aria-label^="Go north"]').attributes(),
    ).toHaveProperty('disabled')
  })

  it('can put focus on the Actions button', () => {
    const w = mount(DockBar, { attachTo: document.body })

    ;(w.vm as unknown as { focus: () => void }).focus()

    expect(document.activeElement).toBe(w.get('button.lq-dock-open').element)
    w.unmount()
  })

  it('ends with a Hint button that sends hint', async () => {
    const w = mount(DockBar)
    const hint = w.findAll('button').at(-1)

    expect(hint?.text()).toBe('💡 Hint')
    expect(hint?.attributes('aria-label')).toBe('Hint')
    await hint?.trigger('click')
    expect(submit).toHaveBeenCalledWith('hint')
  })

  it('dims Hint while the game is not accepting input', async () => {
    useGameStore().acceptInput = false
    const w = mount(DockBar)

    expect(w.get('button.lq-dock-hint').attributes('aria-disabled')).toBe(
      'true',
    )
    await w.get('button.lq-dock-hint').trigger('click')
    expect(submit).not.toHaveBeenCalled()
  })

  it('dims Hint while a turn is read aloud', async () => {
    useSettingsStore().narrationOn = true
    const narration = useNarrationStore()
    narration.setAudioFactory(() => ({
      volume: 1,
      currentTime: 0,
      onended: null,
      onerror: null,
      play: () => Promise.resolve(),
      pause: () => {},
    }))
    const w = mount(DockBar)
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
    const hint = w.get('button.lq-dock-hint')

    expect(hint.attributes('aria-disabled')).toBe('true')
    await hint.trigger('click')
    expect(submit).not.toHaveBeenCalled()

    narration.skipAll()
    await w.vm.$nextTick()
    expect(hint.attributes('aria-disabled')).toBe('false')
  })
})
