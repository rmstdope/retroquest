// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import JournalDrawer from './JournalDrawer.vue'

describe('JournalDrawer', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('shows the Quests alone, with no tab row', () => {
    const w = mount(JournalDrawer)
    expect(w.findAll('[role="tab"]')).toHaveLength(0)
    expect(w.get('.lq-journal-title').text()).toBe('Quests')
    expect(w.text()).toContain('No quests yet.')
    expect(w.text()).not.toContain('Your bag is empty.')
  })

  it('moves focus into itself when it opens', async () => {
    const w = mount(JournalDrawer, { attachTo: document.body })
    await nextTick()
    await nextTick()
    expect(w.element.contains(document.activeElement)).toBe(true)
    w.unmount()
  })

  it('asks to close on ✕ and on Escape, and keeps Escape to itself', async () => {
    const w = mount(JournalDrawer)
    await w.get('.lq-drawer-close').trigger('click')
    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    })
    w.element.dispatchEvent(escape)
    expect(w.emitted('close')).toHaveLength(2)
    expect(escape.defaultPrevented).toBe(true)
  })
})
