import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { useCommandCompletion } from './useCommandCompletion'

type Complete = (input: string) => { newInput: string; candidates: string[] }

function setup(complete: Complete, enabled = true) {
  const text = ref('')
  const completion = useCommandCompletion(text, complete, () => enabled)
  return { text, ...completion }
}

const tab = () => ({ preventDefault: vi.fn() }) as unknown as KeyboardEvent

describe('useCommandCompletion', () => {
  it('completes a single match on Tab', () => {
    const c = setup(() => ({
      newInput: 'take bucket ',
      candidates: ['bucket'],
    }))
    c.text.value = 'take bu'

    const event = tab()
    c.onTab(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(c.text.value).toBe('take bucket ')
    expect(c.suggestions.value).toEqual([])
  })

  it('shows the choices when several words match', () => {
    const c = setup(() => ({
      newInput: 'take ',
      candidates: ['bucket', 'bread'],
    }))
    c.text.value = 'take b'

    c.onTab(tab())

    expect(c.text.value).toBe('take ')
    expect(c.suggestions.value).toEqual(['bucket', 'bread'])
    expect(c.activeIndex.value).toBe(-1)
  })

  it('closes the choices when nothing matches', () => {
    const complete = vi
      .fn<Complete>()
      .mockReturnValueOnce({ newInput: 'x ', candidates: ['a', 'b'] })
      .mockReturnValueOnce({ newInput: 'zz', candidates: [] })
    const c = setup(complete)

    c.onTab(tab())
    c.onTab(tab())

    expect(c.suggestions.value).toEqual([])
  })

  it('does nothing while input is not accepted', () => {
    const complete = vi.fn<Complete>()
    const c = setup(complete, false)
    const event = tab()

    c.onTab(event)

    expect(complete).not.toHaveBeenCalled()
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  it('cycles through the choices with the arrow keys', () => {
    const c = setup(() => ({
      newInput: 'take ',
      candidates: ['bucket', 'bread'],
    }))
    c.onTab(tab())

    c.onArrowDown()
    expect(c.activeIndex.value).toBe(0)
    c.onArrowDown()
    c.onArrowDown()
    expect(c.activeIndex.value).toBe(0)
    c.onArrowUp()
    expect(c.activeIndex.value).toBe(1)
  })

  it('applies the highlighted choice on Enter instead of sending', () => {
    const complete = vi
      .fn<Complete>()
      // Several matches leave the input as typed (as the store does).
      .mockReturnValueOnce({
        newInput: 'take b',
        candidates: ['bucket', 'bread'],
      })
      .mockReturnValueOnce({ newInput: 'take bread ', candidates: ['bread'] })
    const c = setup(complete)
    c.text.value = 'take b'
    c.onTab(tab())
    c.onArrowDown()
    c.onArrowDown()

    expect(c.applyActive()).toBe(true)
    expect(complete).toHaveBeenLastCalledWith('take bread ')
    expect(c.text.value).toBe('take bread ')
    expect(c.suggestions.value).toEqual([])
  })

  it('lets Enter send when no choice is highlighted', () => {
    const c = setup(() => ({
      newInput: 'take ',
      candidates: ['bucket', 'bread'],
    }))
    c.onTab(tab())

    expect(c.applyActive()).toBe(false)
    expect(c.suggestions.value).toEqual([])
  })

  it('closes the choices on Escape', () => {
    const c = setup(() => ({
      newInput: 'take ',
      candidates: ['bucket', 'bread'],
    }))
    c.onTab(tab())

    c.close()

    expect(c.suggestions.value).toEqual([])
    expect(c.activeIndex.value).toBe(-1)
  })
})
