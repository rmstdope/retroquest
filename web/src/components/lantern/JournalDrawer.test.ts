// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import JournalDrawer from './JournalDrawer.vue'

describe('JournalDrawer', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('opens the journal on the tab asked for, with the tab row', () => {
    const w = mount(JournalDrawer, { props: { tab: 'spells' } })
    const selected = w.get('[role="tab"][aria-selected="true"]')
    expect(selected.text()).toContain('Spells')
    expect(w.findAll('[role="tab"]')).toHaveLength(3)
  })

  it('shows the empty line of a tab', () => {
    const w = mount(JournalDrawer, { props: { tab: 'bag' } })
    expect(w.text()).toContain('Your bag is empty.')
  })

  it('follows a different tab pressed while open', async () => {
    const w = mount(JournalDrawer, { props: { tab: 'bag' } })
    await w.setProps({ tab: 'quests' })
    expect(w.get('[role="tab"][aria-selected="true"]').text()).toContain(
      'Quests',
    )
  })

  it('moves focus into itself when it opens', async () => {
    const w = mount(JournalDrawer, {
      props: { tab: 'bag' },
      attachTo: document.body,
    })
    await nextTick()
    await nextTick()
    expect(w.element.contains(document.activeElement)).toBe(true)
    w.unmount()
  })

  it('asks to close on ✕ and on Escape, and keeps Escape to itself', async () => {
    const w = mount(JournalDrawer, { props: { tab: 'bag' } })
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
