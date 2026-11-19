// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CommandBox from './CommandBox.vue'
import { useGameStore } from '@/stores/useGameStore'

describe('CommandBox', () => {
  let submit: ReturnType<typeof vi.fn<(command: string) => void>>
  let w: VueWrapper
  const input = () => w.get('input[aria-label="Command"]')
  const value = () => (input().element as HTMLInputElement).value
  const options = () =>
    w.findAll('[role="option"]:not([aria-disabled])').map((o) => o.text())

  beforeEach(() => {
    setActivePinia(createPinia())
    const game = useGameStore()
    game.acceptInput = true
    game.completionTree = {
      take: { bucket: null, bread: null },
      talk: { to: { mira: null } },
      look: { '@': null, at: { well: null } },
      inventory: null,
    }
    submit = vi.fn<(command: string) => void>()
    vi.spyOn(game, 'submitCommand').mockImplementation(submit)
    w = mount(CommandBox, { attachTo: document.body })
  })
  afterEach(() => w.unmount())

  it('is a slim box with the prompt mark, the placeholder and the F1 tag, and the cursor in it', () => {
    expect(w.get('.lq-box-mark').text()).toBe('›')
    expect(input().attributes('placeholder')).toBe('Type a command…')
    expect(w.get('kbd').text()).toBe('F1 hides')
    expect(document.activeElement).toBe(input().element)
  })

  it('sends the command on Enter, and stays up empty and focused', async () => {
    await input().setValue('take bucket')
    await input().trigger('keydown', { key: 'Enter' })
    expect(submit).toHaveBeenCalledWith('take bucket')
    expect(value()).toBe('')
    expect(document.activeElement).toBe(input().element)
    expect(w.emitted('hide')).toBeUndefined()
  })

  it('does nothing on Enter in an empty box', async () => {
    await input().trigger('keydown', { key: 'Enter' })
    await input().setValue('   ')
    await input().trigger('keydown', { key: 'Enter' })
    expect(submit).not.toHaveBeenCalled()
  })

  it('lets text be typed while the game is busy, and keeps it until the game takes it', async () => {
    useGameStore().acceptInput = false
    await w.vm.$nextTick()
    expect(input().attributes('disabled')).toBeUndefined()
    await input().setValue('look')
    await input().trigger('keydown', { key: 'Enter' })
    expect(submit).not.toHaveBeenCalled()
    expect(value()).toBe('look')
  })

  it('completes with Tab as the Type box did', async () => {
    await input().setValue('lo')
    await input().trigger('keydown', { key: 'Tab' })
    expect(value()).toBe('look ')
  })

  it('lists matching words, and Enter applies a highlighted one instead of sending', async () => {
    await input().setValue('take b')
    expect(options()).toEqual(['bucket', 'bread'])
    await input().trigger('keydown', { key: 'ArrowDown' })
    await input().trigger('keydown', { key: 'Enter' })
    expect(submit).not.toHaveBeenCalled()
    expect(value()).toBe('take bread ')
  })

  it('closes an open word list on the first Escape, and hides the box on the next', async () => {
    await input().setValue('ta')
    expect(w.find('[role="listbox"]').exists()).toBe(true)
    const first = new KeyboardEvent('keydown', {
      key: 'Escape',
      cancelable: true,
    })
    input().element.dispatchEvent(first)
    await w.vm.$nextTick()
    expect(w.find('[role="listbox"]').exists()).toBe(false)
    expect(w.emitted('hide')).toBeUndefined()
    await input().trigger('keydown', { key: 'Escape' })
    expect(w.emitted('hide')).toHaveLength(1)
  })

  it('hides on Escape and takes the key, so the menu does not also open', async () => {
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    })
    input().element.dispatchEvent(event)
    expect(w.emitted('hide')).toHaveLength(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it('hides when its F1 pill is clicked, for a player using only the mouse (rq-v29l.3)', async () => {
    const pill = w.get('button[aria-label="F1 hides the typing box"]')
    expect(pill.text()).toBe('F1 hides')
    await pill.trigger('click')
    expect(w.emitted('hide')).toHaveLength(1)
    expect(submit).not.toHaveBeenCalled()
  })

  it('takes focus back on request', async () => {
    ;(document.activeElement as HTMLElement).blur()
    ;(w.vm as unknown as { focus: () => void }).focus()
    expect(document.activeElement).toBe(input().element)
  })
})
