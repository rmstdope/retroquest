// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import FinishDialog from './FinishDialog.vue'
import { useGameStore } from '@/stores/useGameStore'

describe('FinishDialog', () => {
  let wrapper: VueWrapper | undefined
  let finishes: boolean[]

  beforeEach(() => {
    setActivePinia(createPinia())
    const game = useGameStore()
    game.finishAsked = true
    finishes = []
    vi.spyOn(game, 'finishGame').mockImplementation((save: boolean) => {
      finishes.push(save)
      return true
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  function mountFinish(): VueWrapper {
    wrapper = mount(FinishDialog, { attachTo: document.body })
    return wrapper
  }

  function button(w: VueWrapper, label: string) {
    return w.findAll('button').find((b) => b.text() === label)!
  }

  it('asks whether to save before finishing, in the agreed words', () => {
    const w = mountFinish()

    expect(w.get('.lq-dialog-eyebrow').text()).toBe('The end')
    expect(w.get('[role="dialog"] h2').text()).toBe('Save before you finish?')
    expect(w.get('.lq-finish-text').text()).toBe(
      'This was the last act. Save now and you can load your finished ' +
        'game later.',
    )
    expect(w.find('[role="alert"]').exists()).toBe(false)
  })

  it('puts focus on Save and finish', async () => {
    const w = mountFinish()
    await nextTick()

    expect(document.activeElement).toBe(button(w, 'Save and finish').element)
  })

  it('saves and finishes', async () => {
    const w = mountFinish()

    await button(w, 'Save and finish').trigger('click')

    expect(finishes).toEqual([true])
  })

  it('stays open with the error when the save fails, and can try again', async () => {
    const game = useGameStore()
    vi.mocked(game.finishGame).mockImplementation((save: boolean) => {
      finishes.push(save)
      return !save
    })
    const w = mountFinish()

    await button(w, 'Save and finish').trigger('click')

    expect(w.get('[role="alert"]').text()).toBe(
      'Your game could not be saved. You can try again, or finish ' +
        'without saving.',
    )
    expect(button(w, 'Save and finish').exists()).toBe(true)
    await button(w, 'Save and finish').trigger('click')
    await button(w, 'Finish without saving').trigger('click')
    expect(finishes).toEqual([true, true, false])
  })

  it('finishes without saving', async () => {
    const w = mountFinish()

    await button(w, 'Finish without saving').trigger('click')

    expect(finishes).toEqual([false])
  })

  it.each([
    [
      'the close button',
      (w: VueWrapper) => w.get('[aria-label="Close"]').trigger('click'),
    ],
    [
      'Escape',
      (w: VueWrapper) =>
        w.get('[role="dialog"]').trigger('keydown', { key: 'Escape' }),
    ],
    [
      'a tap outside',
      (w: VueWrapper) => w.get('.lq-dialog-scrim').trigger('click'),
    ],
  ])('goes back to the chapter page with %s', async (_, close) => {
    const game = useGameStore()
    const w = mountFinish()

    await close(w)

    expect(game.finishAsked).toBe(false)
    expect(finishes).toEqual([])
  })
})
