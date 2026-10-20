// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// Pyodide never finishes loading here: the app stays on its loading screen.
vi.mock('./composables/useBridge', () => ({
  useBridge: () => ({ init: () => new Promise(() => {}) }),
}))

import App from './App.vue'

describe('App while the game loads', () => {
  let wrapper: VueWrapper | undefined
  afterEach(() => {
    wrapper?.unmount()
    window.history.replaceState(null, '', '/')
  })

  function mountAt(search: string) {
    window.history.replaceState(null, '', `/${search}`)
    setActivePinia(createPinia())
    wrapper = mount(App, { attachTo: document.body })
    return wrapper
  }

  it('shows the Lantern loading screen by default', () => {
    const w = mountAt('')

    expect(w.find('.lq-loading').exists()).toBe(true)
    expect(w.get('[role="status"]').text()).toBe('Initializing...')
  })

  it('shows the Lantern loading screen for an old ?ui=classic link too', () => {
    const w = mountAt('?ui=classic')

    expect(w.find('.lq-loading').exists()).toBe(true)
  })
})
