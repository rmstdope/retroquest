// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LanternLoading from './LanternLoading.vue'

describe('LanternLoading', () => {
  afterEach(() => document.documentElement.removeAttribute('data-ui'))

  it('shows the full status, file count included', () => {
    const w = mount(LanternLoading, {
      props: { status: 'Loading game files... (10/363)' },
    })

    expect(w.get('.lq-loading-status').text()).toBe(
      'Loading game files... (10/363)',
    )
  })

  it('announces each loading step once, not every file count', async () => {
    const w = mount(LanternLoading, {
      props: { status: 'Loading game files... (10/363)' },
    })
    expect(w.get('[role="status"]').text()).toBe('Loading game files...')

    await w.setProps({ status: 'Loading game files... (20/363)' })
    expect(w.get('[role="status"]').text()).toBe('Loading game files...')

    await w.setProps({ status: 'Error: Network error' })
    expect(w.get('[role="status"]').text()).toBe('Error: Network error')
  })
})
